import { Types } from 'mongoose';

export interface IUser {
  email: string;
  name?: string;
  telegramChatId?: string;
  preferences: {
    notifyTelegram: boolean;
    notifyEmail: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IJob {
  title: string;
  company: string;
  location: string;
  country?: string;
  city?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  description: string;
  skills: string[];
  url: string;
  applicationUrl?: string;
  companyLogo?: string;
  source: string;
  employmentType?: string;
  remoteStatus?: 'Remote' | 'Hybrid' | 'Onsite';
  postedDate?: Date;
  sha256Hash?: string;
  status: 'active' | 'closed';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IApplication {
  jobId: Types.ObjectId | IJob;
  userId: Types.ObjectId | IUser;
  resumeVersionId?: Types.ObjectId;
  coverLetterId?: Types.ObjectId;
  status: 'Pending' | 'Auto-Applying' | 'Applied' | 'Interview' | 'Rejected';
  timeline: {
    status: string;
    timestamp: Date;
    note?: string;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IResume {
  userId: Types.ObjectId | IUser;
  experience: any[]; // define more strictly later
  education: any[];
  skills: string[];
  projects: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IResumeVersion {
  masterId: Types.ObjectId | IResume;
  jobId: Types.ObjectId | IJob;
  content: string; // Markdown/HTML
  atsScore?: number;
  atsFeedback?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICoverLetter {
  jobId: Types.ObjectId | IJob;
  resumeVersionId: Types.ObjectId | IResumeVersion;
  content: string; // Markdown
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotification {
  userId: Types.ObjectId | IUser;
  message: string;
  type: string;
  read: boolean;
  channel: 'Telegram' | 'In-App' | 'Email';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICareerProfile {
  userId: Types.ObjectId | IUser;
  primaryRole?: string;
  secondaryRole?: string;
  seniority?: string;
  experience?: string;
  yearsOfExperience?: number;
  skills: string[];
  preferredIndustries: string[];
  preferredTechStack: string[];
  preferredCountries?: string[];
  preferredCities?: string[];
  remotePreference?: string;
  salaryExpectation?: number;
  memoryContext?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IJobMatch {
  jobId: Types.ObjectId | IJob;
  userId: Types.ObjectId | IUser;
  matchScore: number;
  matchReasons: string[];
  missingSkills: string[];
  recommendedSkills: string[];
  decision: 'APPLY' | 'SKIP' | 'REVIEW' | 'REJECT';
  decisionReason?: string;
  tailoredResumeId?: Types.ObjectId;
  tailoredCoverLetterId?: Types.ObjectId;
  state: 'Discovered' | 'Matched' | 'Ranked' | 'Review' | 'Resume Generated' | 'Cover Letter Generated' | 'ATS Passed' | 'Queued' | 'Applying' | 'Applied' | 'Confirmation Received' | 'Interview' | 'Offer' | 'Rejected' | 'Archived';
  retryCount: number;
  confidenceScore?: number;
  salaryFit?: 'High' | 'Medium' | 'Low' | 'Unknown';
  locationFit?: 'High' | 'Medium' | 'Low' | 'Unknown';
  experienceFit?: 'High' | 'Medium' | 'Low' | 'Unknown';
  applicationPriority?: 'HIGH' | 'MEDIUM' | 'LOW';
  recruiterScore?: number;
  hiringManagerScore?: number;
  atsScore?: number;
  salaryScore?: number;
  interviewProbability?: number;
  offerProbability?: number;
  aiDebateOutcome?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICompanyProfile {
  companyName: string;
  products: string[];
  services: string[];
  mission?: string;
  engineeringCulture?: string;
  techStack: string[];
  latestNews: string[];
  hiringValues: string[];
  lastResearched?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IConfiguration {
  userId: Types.ObjectId | IUser;
  autoApplyMode: 'Manual' | 'Semi-Auto' | 'Full-Auto';
  matchThreshold: number;
  schedulerInterval: number;
  maxDailyApplications: number;
  preferredCountries: string[];
  preferredJobBoards: string[];
  remoteOnly: boolean;
  blacklistedCompanies: string[];
  whitelistedCompanies: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IInboundEmail {
  userId: Types.ObjectId | IUser;
  sender: string;
  subject: string;
  body: string;
  receivedAt: Date;
  classification: 'Interview' | 'Rejection' | 'Follow-up' | 'Other';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICalendarEvent {
  userId: Types.ObjectId | IUser;
  jobMatchId: Types.ObjectId | IJobMatch;
  company: string;
  title: string;
  startTime: Date;
  endTime: Date;
  meetingLink?: string;
  checklist: string[];
  createdAt?: Date;
  updatedAt?: Date;
}
