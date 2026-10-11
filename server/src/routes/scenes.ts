import { Router } from 'express';
import { db } from '../db/db.js';
import { jobQueue } from '../services/jobs/jobQueue.js';

const router = Router();

// GET scenes for project
router.get('/project/:projectId', (req, res) => {
  try {
    const scenes = db.getScenes(req.params.projectId);
    res.json({ success: true, scenes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create scene
router.post('/project/:projectId', (req, res) => {
  try {
    const scene = db.createScene({
      ...req.body,
      projectId: req.params.projectId,
    });
    res.status(201).json({ success: true, scene });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT update scene
router.put('/:id', (req, res) => {
  try {
    const updated = db.updateScene(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Scene not found' });
    }
    res.json({ success: true, scene: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE scene
router.delete('/:id', (req, res) => {
  try {
    const success = db.deleteScene(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Scene not found' });
    }
    res.json({ success: true, message: 'Scene deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST reorder scenes
router.post('/project/:projectId/reorder', (req, res) => {
  try {
    const { sceneIds } = req.body;
    if (!Array.isArray(sceneIds)) {
      return res.status(400).json({ success: false, error: 'sceneIds must be an array' });
    }
    const scenes = db.reorderScenes(req.params.projectId, sceneIds);
    res.json({ success: true, scenes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST regenerate single scene
router.post('/:id/regenerate', (req, res) => {
  try {
    const scene = db.getSceneById(req.params.id);
    if (!scene) {
      return res.status(404).json({ success: false, error: 'Scene not found' });
    }

    const project = db.getProjectById(scene.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Associated project not found' });
    }

    const job = db.createJob({
      projectId: scene.projectId,
      type: 'single_scene',
      targetSceneId: scene.id,
      providerId: project.settings.providerId,
      modelId: project.settings.modelId,
      stageMessage: `Initiating regeneration for scene "${scene.title}"`,
    });

    jobQueue.enqueueJob(job.id);
    res.json({ success: true, jobId: job.id, job });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
