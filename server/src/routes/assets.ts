import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { db } from '../db/db.js';
import { UPLOADS_DIR } from '../services/video/ffmpegService.js';

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `asset_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|mp4|webm|mp3|wav|ogg/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: jpg, png, webp, mp4, mp3, wav'));
    }
  },
});

// GET all assets
router.get('/', (req, res) => {
  try {
    const assets = db.getAssets();
    res.json({ success: true, assets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST upload asset
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { projectId, assetType } = req.body;
    let type: 'image' | 'video' | 'audio' | 'subtitle' = 'image';
    if (req.file.mimetype.startsWith('video/')) type = 'video';
    else if (req.file.mimetype.startsWith('audio/')) type = 'audio';
    else if (assetType) type = assetType;

    const fileUrl = `/uploads/${req.file.filename}`;

    const asset = db.addAsset({
      projectId,
      name: req.file.originalname,
      type,
      url: fileUrl,
      sizeBytes: req.file.size,
      mimeType: req.file.mimetype,
    });

    res.status(201).json({
      success: true,
      asset,
      url: fileUrl,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE asset
router.delete('/:id', (req, res) => {
  try {
    const deleted = db.deleteAsset(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }
    res.json({ success: true, message: 'Asset deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
