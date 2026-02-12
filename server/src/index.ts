import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import candidatesRouter from './routes/candidates';
import jobsRouter from './routes/jobs';
import interviewsRouter from './routes/interviews';
import applicationsRouter from './routes/applications';
import employeesRouter from './routes/employees';
import resignedAgentsRouter from './routes/resignedAgents';
import agentRanksRouter from './routes/agentRanks';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import notificationsRouter from './routes/notifications';

const app = express();
const PORT = config.port;

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Хэт олон хүсэлт илгээсэн. Түр хүлээнэ үү.' }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: config.isProduction ? config.cors.origin : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/resigned-agents', resignedAgentsRouter);
app.use('/api/agent-ranks', agentRanksRouter);
app.use('/api/notifications', notificationsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
