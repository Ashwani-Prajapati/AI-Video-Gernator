import { Router } from 'express';
import { db } from '../db/db.js';

const router = Router();

// GET all available models and capabilities
router.get('/', (req, res) => {
  try {
    const models = db.getModels();
    res.json({ success: true, models });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
