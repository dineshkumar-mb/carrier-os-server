import fs from 'fs';
import path from 'path';
import { browserPool } from '../../utils/browserPool';
import { User } from '../../models/User';

export interface DocumentOutput {
  pdfPath: string;
  docxPath: string;
  pdfUrl: string;
  docxUrl: string;
}

export const generateResumeDocuments = async (
  userId: string,
  resumeData: any,
  prefix: string
): Promise<DocumentOutput> => {
  try {
    const user = await User.findById(userId);
    const name = user?.name || resumeData.name || 'Candidate';
    const email = user?.email || resumeData.email || '';
    const phone = resumeData.phone || '';

    const resumeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              color: #333333;
              line-height: 1.5;
              padding: 40px;
              font-size: 14px;
            }
            .header {
              text-align: center;
              margin-bottom: 25px;
            }
            .header h1 {
              margin: 0 0 5px 0;
              font-size: 26px;
              color: #111111;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .contact-info {
              font-size: 12px;
              color: #666666;
            }
            .section-title {
              font-size: 16px;
              color: #222222;
              border-bottom: 1.5px solid #222222;
              padding-bottom: 3px;
              margin-top: 20px;
              margin-bottom: 10px;
              text-transform: uppercase;
              font-weight: bold;
              letter-spacing: 0.5px;
            }
            .experience-item, .project-item {
              margin-bottom: 15px;
            }
            .item-header {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              color: #111111;
            }
            .item-subheader {
              font-style: italic;
              color: #555555;
              margin-bottom: 5px;
            }
            .highlights {
              margin: 0;
              padding-left: 20px;
            }
            .highlights li {
              margin-bottom: 3px;
            }
            .skills-list {
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${name}</h1>
            <div class="contact-info">
              ${email} | ${phone}
            </div>
          </div>
          
          <div class="section-title">Skills</div>
          <p><span class="skills-list">${resumeData.skills?.join(' • ') || ''}</span></p>

          <div class="section-title">Experience</div>
          ${resumeData.experience?.map((e: any) => `
            <div class="experience-item">
              <div class="item-header">
                <span>${e.role || e.title}</span>
                <span>${e.years || ''}</span>
              </div>
              <div class="item-subheader">${e.company}</div>
              <ul class="highlights">
                ${e.highlights?.map((h: string) => `<li>${h}</li>`).join('') || `<li>${e.description || ''}</li>`}
              </ul>
            </div>
          `).join('') || ''}

          <div class="section-title">Projects</div>
          ${resumeData.projects?.map((p: any) => `
            <div class="project-item">
              <div class="item-header">
                <span>${p.name}</span>
                <span>${p.tech?.join(', ') || ''}</span>
              </div>
              <p style="margin: 3px 0 0 0;">${p.description || ''}</p>
            </div>
          `).join('') || ''}
        </body>
      </html>
    `;

    const outputDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const pdfFilename = `${prefix}.pdf`;
    const docxFilename = `${prefix}.docx`;
    
    const pdfPath = path.join(outputDir, pdfFilename);
    const docxPath = path.join(outputDir, docxFilename);

    const context = await browserPool.acquireContext();
    try {
      const page = await context.newPage();
      await page.setContent(resumeHtml);
      await page.pdf({ path: pdfPath, format: 'A4', margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } });
      await page.close();
    } finally {
      await browserPool.releaseContext(context);
    }

    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Resume</title></head>
      <body>${resumeHtml}</body>
      </html>
    `;
    fs.writeFileSync(docxPath, docHtml);

    return {
      pdfPath,
      docxPath,
      pdfUrl: `/uploads/documents/${pdfFilename}`,
      docxUrl: `/uploads/documents/${docxFilename}`
    };
  } catch (err) {
    console.error('Error generating resume documents:', err);
    throw err;
  }
};
