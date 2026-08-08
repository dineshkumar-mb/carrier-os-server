import { runJobDiscovery } from '../services/jobDiscovery/discoveryEngine';
import connectDB from '../config/db';

export async function runJobDiscoveryTest() {
  console.log('\n--- [Test] Running AI Resume-Aware Job Discovery Engine ---');
  await connectDB();

  const userId = '6a4fdf8e1c372623a1958b7c';

  const { CareerProfile } = require('../models/CareerProfile');
  let profile = await CareerProfile.findOne({ userId });
  if (!profile) {
    console.log('Seeding CareerProfile for test user...');
    await CareerProfile.create({
      userId,
      primaryRole: 'React Developer',
      secondaryRole: 'Frontend Engineer',
      skills: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
      remotePreference: 'Remote',
      salaryExpectation: 120000,
      memoryContext: 'Prefers modern web frameworks. Wants remote positions.'
    });
  }

  try {
    console.log(`Starting real job discovery cycle for user ${userId}...`);
    const newJobs = await runJobDiscovery(userId);
    console.log(`Discovered and processed ${newJobs.length} new jobs.`);
    
    if (newJobs.length > 0) {
      console.log('Sample discovered job:', {
        title: newJobs[0].title,
        company: newJobs[0].company,
        skills: newJobs[0].skills
      });
    }
    
    console.log('✓ AI Job Discovery Engine Validation completed successfully!');
  } catch (err: any) {
    console.error('✗ AI Job Discovery Engine Validation failed:', err.message);
    throw err;
  }
}
