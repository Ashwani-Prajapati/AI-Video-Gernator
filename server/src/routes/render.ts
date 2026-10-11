import { Router } from 'express';
import { db } from '../db/db.js';
import { jobQueue } from '../services/jobs/jobQueue.js';

const router = Router();

// POST re-render final video from current project timeline
router.post('/project/:id', async (req, res) => {
  try {
    const project = db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Optional override settings from editor (transition, resolution, aspect ratio, audio volumes)
    if (req.body.settings) {
      db.updateProject(project.id, {
        settings: {
          ...project.settings,
          ...req.body.settings,
        },
      });
    }

    const job = db.createJob({
      projectId: project.id,
      type: 'render_only',
      providerId: project.settings.providerId,
      modelId: project.settings.modelId,
      stageMessage: 'Initiating timeline video render',
    });

    jobQueue.enqueueJob(job.id);

    res.json({
      success: true,
      jobId: job.id,
      job,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
