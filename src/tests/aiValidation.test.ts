import { tailorResume } from '../services/ai/resumeAgent';
import connectDB from '../config/db';

export async function runAIValidationTest() {
  console.log('\n--- [Test] Running AI Resume Tailoring Validation ---');
  await connectDB();

  const dummyResume = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0100',
    skills: ['JavaScript', 'HTML', 'CSS', 'React'],
    experience: [
      {
        company: 'WebCorp',
        role: 'Frontend Developer',
        description: 'Built React components and web pages.'
      }
    ]
  };

  const jobDescription = 'Looking for a Senior Frontend Engineer with React and TypeScript experience to build scalable platforms.';

  try {
    console.log('Sending tailoring request to AI agent...');
    const tailored = await tailorResume(dummyResume, jobDescription);
    
    console.log('Tailoring result received.');
    
    if (!tailored.skills || !Array.isArray(tailored.skills)) {
      throw new Error('AI validation failed: skills array is missing or invalid');
    }
    
    console.log('Tailored skills count:', tailored.skills.length);
    console.log('✓ AI Resume Tailoring Validation completed successfully!');
  } catch (err: any) {
    console.error('✗ AI Resume Tailoring Validation failed:', err.message);
    throw err;
  }
}
