import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import resumeRoutes from './routes/resume.js';
import jobRoutes from './routes/job.js';
import scoringRoutes from './routes/scoring.js';
import candidateRoutes from './routes/candidate.js';
import emailRoutes from './routes/email.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use('/api/resume', resumeRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/scoring', scoringRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/email', emailRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`ATS Platform API running on port ${PORT}`);
});
