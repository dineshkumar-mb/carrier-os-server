import { Job } from '../../models/Job';
import { JobMatch } from '../../models/JobMatch';

export const ensurePortalJobsExist = async (userId: string) => {
  try {
    const existingCount = await Job.countDocuments({});
    if (existingCount >= 11) {
      return; // Already populated
    }

    const defaultJobs = [
      {
        title: 'Senior Full Stack Engineer',
        company: 'Microsoft',
        location: 'Bengaluru / Remote',
        salary: { min: 140000, max: 190000, currency: 'USD' },
        description: 'Build enterprise AI cloud solutions with React, TypeScript, Node.js, and Azure.',
        skills: ['React', 'Node.js', 'TypeScript', 'System Design', 'Azure'],
        url: 'https://www.linkedin.com/jobs/view/microsoft-fullstack-dev',
        source: 'LinkedIn',
        status: 'active' as const,
        postedDate: new Date()
      },
      {
        title: 'React & Node.js Lead Architect',
        company: 'Swiggy',
        location: 'Bengaluru, India',
        salary: { min: 3500000, max: 5000000, currency: 'INR' },
        description: 'Lead core consumer platform services, real-time tracking engines, and microservices.',
        skills: ['React', 'Node.js', 'Redis', 'MongoDB', 'System Architecture'],
        url: 'https://www.naukri.com/job-listings-swiggy-lead-architect',
        source: 'Naukri',
        status: 'active' as const,
        postedDate: new Date()
      },
      {
        title: 'AI Product & Platform Engineer',
        company: 'Flipkart',
        location: 'Bengaluru / Remote, India',
        salary: { min: 2800000, max: 4200000, currency: 'INR' },
        description: 'Develop next-gen AI search, automated recommendations, and real-time candidate experiences.',
        skills: ['TypeScript', 'Node.js', 'Python', 'LLMs', 'GraphQL'],
        url: 'https://apna.co/jobs/flipkart-ai-product-engineer',
        source: 'Apna',
        status: 'active' as const,
        postedDate: new Date()
      },
      {
        title: 'Staff Frontend Architect',
        company: 'Airbnb',
        location: 'San Francisco / Remote',
        salary: { min: 180000, max: 240000, currency: 'USD' },
        description: 'Design world-class web platform components, design systems, and fast performance bundles.',
        skills: ['React', 'TypeScript', 'Next.js', 'Web Performance'],
        url: 'https://boards.greenhouse.io/airbnb/jobs/frontend-architect',
        source: 'Greenhouse',
        status: 'active' as const,
        postedDate: new Date()
      },
      {
        title: 'Lead Backend Systems Developer',
        company: 'Figma',
        location: 'Remote (US/Global)',
        salary: { min: 165000, max: 210000, currency: 'USD' },
        description: 'Build real-time multiplayer collaborative infrastructure, WebSockets, and database persistence.',
        skills: ['Node.js', 'TypeScript', 'WebSockets', 'Distributed Systems'],
        url: 'https://jobs.lever.co/figma/backend-systems-lead',
        source: 'Lever',
        status: 'active' as const,
        postedDate: new Date()
      },
      {
        title: 'Software Engineering Associate',
        company: 'Razorpay',
        location: 'Bengaluru, India',
        salary: { min: 1800000, max: 2600000, currency: 'INR' },
        description: 'Build secure payment gateway APIs, merchant web dashboards, and real-time webhook systems.',
        skills: ['Node.js', 'React', 'TypeScript', 'SQL', 'APIs'],
        url: 'https://internshala.com/job/detail/razorpay-software-associate',
        source: 'Internshala',
        status: 'active' as const,
        postedDate: new Date()
      },
      {
        title: 'Remote Full Stack Engineer',
        company: 'Automattic',
        location: 'Remote (Worldwide)',
        salary: { min: 120000, max: 160000, currency: 'USD' },
        description: 'Work asynchronously on WordPress.com, Jetpack, and open-source cloud tools.',
        skills: ['React', 'Node.js', 'JavaScript', 'REST APIs'],
        url: 'https://remoteok.com/remote-jobs/automattic-full-stack-engineer',
        source: 'RemoteOK',
        status: 'active' as const,
        postedDate: new Date()
      },
      {
        title: 'Senior React & Node Developer',
        company: 'GitLab',
        location: 'Remote (Worldwide)',
        salary: { min: 135000, max: 175000, currency: 'USD' },
        description: 'Develop DevOps platform UI workflows, CI/CD pipeline visualizers, and code review engines.',
        skills: ['React', 'Node.js', 'TypeScript', 'GraphQL', 'CI/CD'],
        url: 'https://remotive.com/remote-jobs/gitlab-senior-react-dev',
        source: 'Remotive',
        status: 'active' as const,
        postedDate: new Date()
      },
      {
        title: 'Cloud Infrastructure & Telemetry Engineer',
        company: 'Datadog',
        location: 'New York / Remote',
        salary: { min: 150000, max: 195000, currency: 'USD' },
        description: 'Build high-throughput observability agents, PromQL query interfaces, and log streams.',
        skills: ['TypeScript', 'Node.js', 'Go', 'Docker', 'Kubernetes'],
        url: 'https://himalayas.app/jobs/datadog-telemetry-engineer',
        source: 'Himalayas',
        status: 'active' as const,
        postedDate: new Date()
      },
      {
        title: 'Full Stack AI Agent Developer',
        company: 'Zapier',
        location: 'Remote',
        salary: { min: 140000, max: 185000, currency: 'USD' },
        description: 'Build autonomous integration workflows, AI app connectors, and developer web tools.',
        skills: ['React', 'Node.js', 'TypeScript', 'AI Agents', 'OpenAI'],
        url: 'https://weworkremotely.com/jobs/zapier-fullstack-ai-dev',
        source: 'WeWorkRemotely',
        status: 'active' as const,
        postedDate: new Date()
      },
      {
        title: 'TypeScript & Node Platform Engineer',
        company: 'Zalando',
        location: 'Berlin / Remote (EU)',
        salary: { min: 85000, max: 110000, currency: 'EUR' },
        description: 'Engineers e-commerce recommendation pipelines, high-concurrency microservices, and React apps.',
        skills: ['TypeScript', 'Node.js', 'React', 'Microservices', 'PostgreSQL'],
        url: 'https://www.arbeitnow.com/jobs/zalando-node-platform-engineer',
        source: 'ArbeitNow',
        status: 'active' as const,
        postedDate: new Date()
      }
    ];

    for (const j of defaultJobs) {
      let jobDoc = await Job.findOne({ url: j.url });
      if (!jobDoc) {
        jobDoc = await Job.create(j);
      }

      const matchExists = await JobMatch.exists({ userId, jobId: jobDoc._id });
      if (!matchExists) {
        await JobMatch.create({
          userId,
          jobId: jobDoc._id,
          matchScore: Math.floor(Math.random() * 21) + 78, // 78% - 98% match
          matchReasons: [`Matched for ${j.title}`, 'High skill alignment with Master Resume'],
          missingSkills: [],
          recommendedSkills: ['System Design', 'Docker'],
          confidenceScore: 92,
          salaryFit: 'High',
          locationFit: 'High',
          experienceFit: 'High',
          applicationPriority: 'HIGH',
          state: 'Discovered',
          decision: 'REVIEW'
        });
      }
    }

    console.log('[PortalSeeder] Ensured jobs exist across all 11 portals.');
  } catch (err) {
    console.error('[PortalSeeder] Seeder error:', err);
  }
};
