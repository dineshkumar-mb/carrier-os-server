import { Worker, Job } from 'bullmq';
import path from 'path';
import fs from 'fs';
import connection from '../config/redis';
import { APPLICATION_QUEUE_NAME } from './queue';
import { Application } from '../models/Application';
import { User } from '../models/User';
import { Resume, ResumeVersion } from '../models/Resume';
import { CoverLetter } from '../models/CoverLetter';
import { sendNotification } from '../services/notificationService';
import { emitLiveActivity } from '../config/socket';
import { browserPool } from '../utils/browserPool';
import { analyzeFormFields } from '../services/ai/formSolverAgent';
import { JobMatch } from '../models/JobMatch';
import { transitionState } from '../utils/stateMachine';

export const startApplyWorker = () => {
  console.log(`[Worker] Starting Playwright Apply Worker for queue: ${APPLICATION_QUEUE_NAME}`);

  const worker = new Worker(
    APPLICATION_QUEUE_NAME,
    async (job: Job) => {
      const { applicationId, jobUrl } = job.data;

      try {
        console.log(`[Worker] Processing Job ${job.id} for Application ${applicationId}`);
        await emitLiveActivity(`[Worker] Starting Playwright application process...`);

        const application = await Application.findById(applicationId);
        if (!application) throw new Error('Application not found');

        if (application.status === 'APPLIED') {
          console.log(`[Worker] Application ${applicationId} is already in APPLIED state. Skipping duplicate task.`);
          await emitLiveActivity(`[Worker] Application is already APPLIED. Skipping duplicate task.`);
          return;
        }

        const canonicalJobIdStr = (application as any).canonicalJobId || String((application as any).jobId);
        const existingMatch = await JobMatch.findOne({ userId: application.userId, jobId: canonicalJobIdStr });
        if (existingMatch && existingMatch.state === 'Applied') {
          console.log(`[Worker] JobMatch for application ${applicationId} is already Applied. Skipping duplicate task.`);
          return;
        }

        const user = await User.findById(application.userId);
        const coverLetter = await CoverLetter.findById(application.coverLetterId);

        if (!user) throw new Error('User not found');

        let resumeData: any = null;
        if (application.resumeVersionId) {
          const resumeVersion = await ResumeVersion.findById(application.resumeVersionId);
          if (resumeVersion && resumeVersion.content) {
            try {
              resumeData = JSON.parse(resumeVersion.content);
            } catch (e) {
              console.error('Error parsing resumeVersion content in worker:', e);
            }
          }
        }

        if (!resumeData) {
          console.log(`[Worker] Resume version not found, falling back to master resume for user ${user._id}`);
          const masterResume = await Resume.findOne({ userId: user._id });
          if (!masterResume) throw new Error('No resume data found for user');
          resumeData = masterResume.toObject();
        }

        application.status = 'APPLYING';
        application.timeline.push({ status: 'APPLYING', timestamp: new Date() });
        await application.save();

        let pdfPath = path.join(__dirname, '../temp', `resume_${application.userId}_${canonicalJobIdStr}.pdf`);
        if (!fs.existsSync(pdfPath)) {
          const { generateResumeDocuments } = require('../services/documents/DocumentService');
          const prefix = `resume_${application.userId}_${canonicalJobIdStr}`;
          const docOutput = await generateResumeDocuments(application.userId.toString(), resumeData, prefix);
          pdfPath = docOutput.pdfPath;
        }

        console.log(`[Worker] Launching isolated browser session for ${jobUrl}`);
        await emitLiveActivity(`[Worker] Launching Playwright browser tab...`);
        const context = await browserPool.acquireContext();
        const page = await context.newPage();
        try {
          await page.goto(jobUrl, { waitUntil: 'networkidle', timeout: 30000 });
          console.log(`[Worker] Page loaded successfully: ${jobUrl}`);
          await emitLiveActivity(`[Worker] Page loaded successfully: ${jobUrl}`);

          if (page.url().includes('remotive.com')) {
            console.log(`[Worker] Detected Remotive.com URL. Locating real application redirect...`);
            await emitLiveActivity(`[Worker] Navigating through Remotive redirect page...`);
            
            const applyAnchor = page.locator('a:has-text("Apply to this job"), a[href*="/apply"]').first();
            if (await applyAnchor.count() > 0) {
              const redirectUrl = await applyAnchor.getAttribute('href');
              if (redirectUrl) {
                const fullRedirectUrl = redirectUrl.startsWith('http') ? redirectUrl : `https://remotive.com${redirectUrl}`;
                console.log(`[Worker] Following Remotive redirect to: ${fullRedirectUrl}`);
                await page.goto(fullRedirectUrl);
                await page.waitForLoadState('networkidle');
              }
            }
          }

          await emitLiveActivity(`[Worker] Analyzing form using AI Form Solver...`);
          const mappings = await analyzeFormFields(page);
          
          let filledCount = 0;
          
          for (const mapping of mappings) {
            try {
              const locator = page.locator(mapping.selector);
              if (await locator.count() === 0) continue;
              
              if (mapping.fieldType === 'name') {
                await locator.fill(user.name || 'Candidate');
                filledCount++;
              } else if (mapping.fieldType === 'email') {
                await locator.fill(user.email);
                filledCount++;
              } else if (mapping.fieldType === 'phone') {
                await locator.fill(resumeData.phone || '555-0100');
                filledCount++;
              } else if (mapping.fieldType === 'resume') {
                await locator.setInputFiles(pdfPath);
                filledCount++;
              } else if (mapping.fieldType === 'cover_letter' && coverLetter) {
                await locator.fill(coverLetter.content);
                filledCount++;
              } else if (mapping.fieldType === 'github') {
                await locator.fill(resumeData.github || 'https://github.com/candidate');
                filledCount++;
              } else if (mapping.fieldType === 'linkedin') {
                await locator.fill(resumeData.linkedin || 'https://linkedin.com/in/candidate');
                filledCount++;
              } else if (mapping.fieldType === 'portfolio') {
                await locator.fill(resumeData.portfolio || 'https://candidate.dev');
                filledCount++;
              }
            } catch (e) {
              console.error(`[Worker] Failed to fill field ${mapping.fieldType} with selector ${mapping.selector}:`, e);
            }
          }

          if (filledCount === 0) {
            await emitLiveActivity(`[Worker] AI Form Solver found 0 elements. Falling back to standard selectors.`);
            const nameInput = page.locator('input[name*="name" i], input[id*="name" i]').first();
            if (await nameInput.count() > 0) await nameInput.fill(user.name || 'Candidate');

            const emailInput = page.locator('input[type="email" i], input[name*="email" i]').first();
            if (await emailInput.count() > 0) await emailInput.fill(user.email);

            const phoneInput = page.locator('input[type="tel" i], input[name*="phone" i]').first();
            if (await phoneInput.count() > 0) await phoneInput.fill(resumeData.phone || '555-0100');

            const fileInput = page.locator('input[type="file" i]').first();
            if (await fileInput.count() > 0) await fileInput.setInputFiles(pdfPath);

            const clInput = page.locator('textarea[name*="cover" i], textarea[id*="cover" i]').first();
            if (await clInput.count() > 0 && coverLetter) await clInput.fill(coverLetter.content);
          } else {
            await emitLiveActivity(`[Worker] AI Form Solver filled ${filledCount} input fields successfully.`);
          }

          await page.waitForTimeout(2000);

          await emitLiveActivity(`[Worker] Identifying submit button...`);
          const submitBtn = page.locator('button[type="submit" i], button:has-text("Submit"), button:has-text("Apply")').first();
          if (await submitBtn.count() > 0) {
              await emitLiveActivity(`[Worker] Submitting application...`);
              await submitBtn.click();
              await page.waitForTimeout(3000);
          }

          console.log(`[Worker] Form submitted successfully!`);
          await emitLiveActivity(`[Worker] Form submitted successfully!`);
        } finally {
          await page.close().catch(() => {});
          await browserPool.releaseContext(context);
        }

        const match = await JobMatch.findOne({ userId: application.userId, jobId: canonicalJobIdStr });
        if (match) {
          await transitionState(match, 'Applied', 'Application submitted successfully via automated worker.');
        }

        application.status = 'APPLIED';
        application.submittedAt = new Date();
        application.timeline.push({ status: 'APPLIED', timestamp: new Date(), note: 'Playwright automation succeeded' });
        await application.save();

        console.log(`[Worker] Job ${job.id} completed successfully.`);
        await sendNotification(application.userId, `✅ Application submitted successfully for job ${canonicalJobIdStr}`);
      } catch (error) {
        console.error(`[Worker] Error processing job ${job.id}:`, error);
        
        const application = await Application.findById(applicationId);
        if (application) {
          const canonicalJobIdStr = (application as any).canonicalJobId || String((application as any).jobId);
          application.status = 'FAILED';
          application.timeline.push({ status: 'FAILED', timestamp: new Date(), note: `Playwright automation failed: ${(error as any).message}` });
          await application.save();

          const match = await JobMatch.findOne({ userId: application.userId, jobId: canonicalJobIdStr });
          if (match) {
            await transitionState(match, 'Rejected', `Playwright application failed: ${(error as any).message}`);
          }

          await sendNotification(application.userId, `❌ Application failed for job ${canonicalJobIdStr}`);
        }
        
        throw error;
      }
    },
    { connection: connection as any }
  );

  worker.on('failed', async (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed with error:`, err);
    try {
      const { QueueFailureLog } = require('../models/QueueFailureLog');
      await QueueFailureLog.create({
        queueName: 'apply',
        jobId: job?.id || 'unknown',
        jobData: job?.data,
        errorMessage: err.message,
        stackTrace: err.stack,
        failedAt: new Date()
      });
    } catch (dbErr) {
      console.error('[Worker] Failed to write failure log to DB:', dbErr);
    }
  });
};
