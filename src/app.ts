import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db';

import jobRoutes from './api/routes/jobRoutes';
import applicationRoutes from './api/routes/applicationRoutes';
import resumeRoutes from './api/routes/resumeRoutes';
import aiRoutes from './api/routes/aiRoutes';
import authRoutes from './api/routes/authRoutes';
import dashboardRoutes from './api/routes/dashboardRoutes';
import inboxRoutes from './api/routes/inboxRoutes';
import healthRoutes from './api/routes/healthRoutes';
import metricsRoutes from './api/routes/metricsRoutes';
import approvalRoutes from './api/routes/approvalRoutes';
import analyticsRoutes from './api/routes/analyticsRoutes';
import marketRoutes from './api/routes/marketRoutes';
import policyRoutes from './api/routes/policyRoutes';
import autonomousRoutes from './api/routes/autonomousRoutes';
import { protect } from './api/middleware/authMiddleware';

import http from 'http';
import { initSocket } from './config/socket';

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

connectDB();
initSocket(server);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/api/metrics', metricsRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/jobs', protect, jobRoutes);
app.use('/api/applications', protect, applicationRoutes);
app.use('/api/resumes', protect, resumeRoutes);
app.use('/api/ai', protect, aiRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/inbox', protect, inboxRoutes);
app.use('/api/approval', protect, approvalRoutes);
app.use('/api/analytics', protect, analyticsRoutes);
app.use('/api/market', protect, marketRoutes);
app.use('/api/policy', protect, policyRoutes);
app.use('/api/autonomous', protect, autonomousRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Carrier OS v1.0 API Engine is running' });
});

if (!process.env.VERCEL) {
  server.listen(port, () => {
    console.log(`[Carrier OS Server] running on port ${port}`);
  });
}

export default app;
