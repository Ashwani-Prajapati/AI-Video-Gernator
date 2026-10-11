import { Router } from 'express';
import { db } from '../db/db.js';

const router = Router();

// GET all projects
router.get('/', (req, res) => {
  try {
    const projects = db.getProjects();
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single project
router.get('/:id', (req, res) => {
  try {
    const project = db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    const scenes = db.getScenes(project.id);
    res.json({ success: true, project: { ...project, scenes } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create project
router.post('/', (req, res) => {
  try {
    const project = db.createProject(req.body);
    res.status(201).json({ success: true, project });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT update project
router.put('/:id', (req, res) => {
  try {
    const updated = db.updateProject(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, project: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE project
router.delete('/:id', (req, res) => {
  try {
    const deleted = db.deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST duplicate project
router.post('/:id/duplicate', (req, res) => {
  try {
    const duplicated = db.duplicateProject(req.params.id);
    if (!duplicated) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, project: duplicated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
