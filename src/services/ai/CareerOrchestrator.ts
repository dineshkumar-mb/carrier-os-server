import { Job } from '../../models/Job';
import { JobMatch } from '../../models/JobMatch';
import { Resume, ResumeVersion } from '../../models/Resume';
import { CoverLetter } from '../../models/CoverLetter';
import { Application } from '../../models/Application';
import { User } from '../../models/User';
import { researchCompany } from './companyIntelligenceAgent';
import { tailorResume } from './resumeAgent';
import { generateCoverLetter } from './coverLetterAgent';
import { analyzeATS } from './atsAgent';
import { generateResumeDocuments } from '../documents/DocumentService';
import { transitionState } from '../../utils/stateMachine';
import { emitLiveActivity } from '../../config/socket';
import { applicationQueue } from '../../workers/queue';

// Agent OS & Autonomous Pipeline Imports
import { agentRegistry } from '../../core/agents/AgentRegistry';
import { plannerAgent } from '../../core/agents/PlannerAgent';
import { debateEngine } from '../../core/agents/DebateEngine';
import { eventBus } from '../../core/events/EventBus';
import { MasterResumeAudit } from './MasterResumeAudit';
import { PolicyEngine, ApplicationPolicyMode } from './PolicyEngine';

import { RecruiterAgent } from '../../core/agents/plugins/RecruiterAgent';
import { HiringManagerAgent } from '../../core/agents/plugins/HiringManagerAgent';
import { ATSAgentPlugin } from '../../core/agents/plugins/ATSAgentPlugin';
import { SalaryAgent } from '../../core/agents/plugins/SalaryAgent';
import { ReflectionAgent } from '../../core/agents/plugins/ReflectionAgent';
import { QuestionGeneratorAgent } from '../../core/agents/plugins/QuestionGeneratorAgent';
import { InterviewEvaluatorAgent } from '../../core/agents/plugins/InterviewEvaluatorAgent';

import { workflowRegistry } from '../../core/workflows/WorkflowRegistry';
import { ApplyToJobWorkflow } from '../../core/workflows/plugins/ApplyToJobWorkflow';
import { ResumeAuditWorkflow } from '../../core/workflows/plugins/ResumeAuditWorkflow';
import { InterviewPrepWorkflow } from '../../core/workflows/plugins/InterviewPrepWorkflow';

// Register agent plugins
agentRegistry.register(new RecruiterAgent());
agentRegistry.register(new HiringManagerAgent());
agentRegistry.register(new ATSAgentPlugin());
agentRegistry.register(new SalaryAgent());
agentRegistry.register(new ReflectionAgent());
agentRegistry.register(new QuestionGeneratorAgent());
agentRegistry.register(new InterviewEvaluatorAgent());

// Register workflows
workflowRegistry.register(new ApplyToJobWorkflow());
workflowRegistry.register(new ResumeAuditWorkflow());
workflowRegistry.register(new InterviewPrepWorkflow());

export class CareerOrchestrator {
  static async processJobMatch(userId: string, jobId: string): Promise<any> {
    try {
      const job = await Job.findById(jobId);
      if (!job) throw new Error('Job not found');

      const user = await User.findById(userId);
      const userPolicy: ApplicationPolicyMode = (user?.preferences as any)?.applicationPolicy || 'AUTOMATIC';

      let match = await JobMatch.findOne({ userId, jobId });
      if (!match) {
        match = await JobMatch.create({
          userId,
          jobId,
          matchScore: 0,
          state: 'Discovered',
          decision: 'REVIEW'
        });
      }

      const masterResume = await Resume.findOne({ userId });
      if (masterResume) {
        // Run Master Resume Health Audit
        const masterAudit = await MasterResumeAudit.auditResume(masterResume.toObject());
        console.log(`[Orchestrator] Master Resume Audit ATS Score: ${masterAudit.masterAtsScore}%`);
      }

      await emitLiveActivity(`[Autonomous Pipeline] 🤖 Processing job: ${job.title} at ${job.company}`);

      // Goal-Driven Capability Execution
      const goal = `Evaluate candidate match and automate career application for ${job.title} at ${job.company}`;
      const agentContext = {
        userId,
        jobId,
        jobTitle: job.title,
        company: job.company,
        jobDescription: job.description,
        resumeData: masterResume ? masterResume.toObject() : {},
        userProfile: {}
      };

      const { executionId, results } = await plannerAgent.executeGoalPlan(goal, agentContext);
      const debateOutcome = debateEngine.synthesizeDebate(results);

      match.matchScore = debateOutcome.consensusScore;
      match.confidenceScore = debateOutcome.overallConfidence;
      match.recruiterScore = debateOutcome.recruiterScore;
      match.hiringManagerScore = debateOutcome.hiringManagerScore;
      match.atsScore = debateOutcome.atsScore;
      match.salaryScore = debateOutcome.salaryScore;
      match.interviewProbability = debateOutcome.interviewProbability;
      match.offerProbability = debateOutcome.offerProbability;
      match.decision = debateOutcome.decision;
      match.decisionReason = debateOutcome.synthesisReasoning;
      match.matchReasons = debateOutcome.keyEvidences;
      match.aiDebateOutcome = debateOutcome as any;

      await match.save();
      await transitionState(match, 'Matched', `Debate Score: ${match.matchScore}% (Interview Prob: ${match.interviewProbability}%)`);

      // Generate Tailored Documents
      await this.tailorDocumentsForMatch(userId, jobId, userPolicy);

      return match;
    } catch (err) {
      console.error('[CareerOrchestrator] Error in Autonomous Pipeline:', err);
      await emitLiveActivity(`[CareerOrchestrator] Error: ${(err as any).message}`);
      throw err;
    }
  }

  static async tailorDocumentsForMatch(userId: string, jobId: string, userPolicy: ApplicationPolicyMode = 'AUTOMATIC'): Promise<void> {
    try {
      const match = await JobMatch.findOne({ userId, jobId });
      if (!match) throw new Error('JobMatch not found');

      const job = await Job.findById(jobId);
      if (!job) throw new Error('Job not found');

      const resume = await Resume.findOne({ userId });
      if (!resume) throw new Error('Master resume not found');

      const companyInfo = await researchCompany(job.company);

      await emitLiveActivity(`[Orchestrator] Tailoring resume for ${job.title}...`);
      const tailoredData = await tailorResume(resume.toObject(), `${job.title}\n${job.description}\nCompany Mission: ${companyInfo.mission}\nTech Stack: ${companyInfo.techStack.join(', ')}`, userId);

      // Re-Validation Quality Gate: Re-scan tailored resume against ATS
      const revalidatedATS = await analyzeATS(tailoredData, job.description);
      const finalAtsScore = revalidatedATS.score || match.atsScore || 85;

      const resumeVersion = await ResumeVersion.create({
        masterId: resume._id,
        jobId: job._id,
        content: JSON.stringify(tailoredData),
        atsScore: finalAtsScore,
        atsFeedback: revalidatedATS.feedback || match.matchReasons || []
      });

      match.tailoredResumeId = resumeVersion._id as any;
      match.atsScore = finalAtsScore;
      await match.save();

      await transitionState(match, 'Resume Generated', `Tailored Resume ATS Score: ${finalAtsScore}%`);

      await emitLiveActivity(`[Orchestrator] Generating personalized cover letter...`);
      const coverLetterContent = await generateCoverLetter(tailoredData, `${job.title}\n${job.description}\nCompany Hiring Values: ${companyInfo.hiringValues.join(', ')}`);

      const coverLetter = await CoverLetter.create({
        jobId: job._id,
        resumeVersionId: resumeVersion._id,
        content: coverLetterContent
      });
      match.tailoredCoverLetterId = coverLetter._id as any;
      await match.save();
      await transitionState(match, 'Cover Letter Generated', 'Cover Letter Tailored Successfully.');

      // Quality Gate Check
      if (finalAtsScore >= 80) {
        await transitionState(match, 'ATS Passed', `Re-Validation Quality Gate PASSED (${finalAtsScore}% >= 80%).`);
      } else {
        await transitionState(match, 'Review', `Re-Validation Quality Gate WARNING (${finalAtsScore}% < 80%). Flagged for review.`);
      }

      const filenamePrefix = `resume_${userId}_${jobId}`;
      await generateResumeDocuments(userId, tailoredData, filenamePrefix);

      let app = await Application.findOne({ canonicalJobId: jobId, userId });
      if (!app) {
        app = await Application.create({
          tenantId: 'default-tenant',
          canonicalJobId: jobId,
          userId,
          resumeVersionId: resumeVersion._id,
          coverLetterId: coverLetter._id,
          status: 'PREPARING',
          timeline: [{ status: 'PREPARING', timestamp: new Date(), note: 'Application created by Carrier OS' }]
        });
      }

      // Application Policy Engine Evaluation
      const policyDecision = PolicyEngine.evaluatePolicy(userPolicy, finalAtsScore, match.matchScore);
      console.log(`[Orchestrator] Policy Evaluation Outcome:`, policyDecision);

      await transitionState(match, policyDecision.nextState, policyDecision.reason);

      if (policyDecision.shouldAutoSubmit) {
        await emitLiveActivity(`[Orchestrator] Enqueuing auto apply task via Playwright worker...`);
        await applicationQueue.add('apply', {
          applicationId: app._id,
          jobUrl: job.url
        });
      } else {
        await emitLiveActivity(`[Orchestrator] ${policyDecision.reason}`);
      }
    } catch (err) {
      console.error('[Orchestrator] Tailoring failed:', err);
      await emitLiveActivity(`[Orchestrator] Document tailoring failed: ${(err as any).message}`);

      const match = await JobMatch.findOne({ userId, jobId });
      if (match) {
        await transitionState(match, 'Rejected', `Document generation failed: ${(err as any).message}`);
      }
    }
  }
}
