import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db';
import { User } from '../models/User';
import { Job } from '../models/Job';
import { Resume } from '../models/Resume';

dotenv.config();

const seedData = async () => {
  await connectDB();

  try {
    // Clear existing data
    await User.deleteMany();
    await Job.deleteMany();
    await Resume.deleteMany();

    console.log('Cleared existing data.');

    // Create User
    const user = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      preferences: { notifyTelegram: false, notifyEmail: true },
    });

    // Create Resume
    await Resume.create({
      userId: user._id,
      experience: [
        { role: 'Software Engineer', company: 'Tech Corp', years: 2 },
      ],
      education: [
        { degree: 'B.S. Computer Science', university: 'State University' },
      ],
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
      projects: [
        { name: 'AI Career Copilot', tech: ['React', 'Node'] },
      ],
    });

    // Create Jobs
    await Job.create([
      {
        title: 'Frontend Engineer',
        company: 'Vercel',
        location: 'Remote',
        salary: { min: 120000, max: 160000, currency: 'USD' },
        description: 'Looking for a React expert with Next.js experience.',
        skills: ['React', 'Next.js', 'TypeScript'],
        url: 'https://vercel.com/careers',
        source: 'Company Page',
      },
      {
        title: 'Backend Developer',
        company: 'Stripe',
        location: 'San Francisco, CA',
        salary: { min: 140000, max: 180000, currency: 'USD' },
        description: 'Build scalable APIs using Node.js and MongoDB.',
        skills: ['Node.js', 'MongoDB', 'API Design'],
        url: 'https://stripe.com/jobs',
        source: 'Greenhouse',
      },
    ]);

    console.log('Seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
