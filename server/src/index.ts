import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { db } from './db/db.js';
import assetsRouter from './routes/assets.js';
import generateRouter from './routes/generate.js';
import jobsRouter from './routes/jobs.js';
import modelsRouter from './routes/models.js';
import projectsRouter from './routes/projects.js';
import renderRouter from './routes/render.js';
import scenesRouter from './routes/scenes.js';
import settingsRouter from './routes/settings.js';
import { FFmpegService, OUTPUTS_DIR, UPLOADS_DIR } from './services/video/ffmpegService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static media files
app.use('/outputs', express.static(OUTPUTS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// Health check & system diagnostics
app.get('/api/health', (req, res) => {
  const models = db.getModels();
  res.json({
    status: 'ok',
    version: '1.0.0',
    app: 'VividFlow AI Studio Server',
    ffmpegPath: FFmpegService.getFfmpegPath(),
    availableModels: models.length,
    activeJobs: db.getActiveJobs().length,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/scenes', scenesRouter);
app.use('/api/generate', generateRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/render', renderRouter);
app.use('/api/models', modelsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/assets', assetsRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ServerError]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🎬 VividFlow AI Studio Backend running on port ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🎥 FFmpeg Engine: ${FFmpegService.getFfmpegPath()}`);
  console.log(`=======================================================`);
});
