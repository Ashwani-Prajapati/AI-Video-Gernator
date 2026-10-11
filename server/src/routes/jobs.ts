import { Router } from 'express';
import { db } from '../db/db.js';
import { jobQueue } from '../services/jobs/jobQueue.js';

const router = Router();

// GET job status
router.get('/:id', (req, res) => {
  try {
    const job = db.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    const project = db.getProjectById(job.projectId);
    const scenes = project ? db.getScenes(project.id) : [];

    res.json({
      success: true,
      job,
      projectStatus: project?.status,
      finalVideoUrl: project?.finalVideoUrl,
      scenes,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST cancel job
router.post('/:id/cancel', (req, res) => {
  try {
    const success = jobQueue.cancelJob(req.params.id);
    res.json({ success, message: 'Cancellation signal sent' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
