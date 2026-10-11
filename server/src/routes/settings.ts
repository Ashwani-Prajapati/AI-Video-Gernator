import { Router } from 'express';
import { db } from '../db/db.js';

const router = Router();

// GET all provider configurations with masked keys
router.get('/', (req, res) => {
  try {
    const providers = db.getProviders().map((p) => ({
      id: p.id,
      name: p.name,
      enabled: p.enabled,
      mode: p.mode,
      apiEndpoint: p.apiEndpoint,
      hasKeyConfigured: Boolean(p.apiKey && p.apiKey.length > 5),
      maskedKey: p.apiKey
        ? `${p.apiKey.slice(0, 4)}...${p.apiKey.slice(-4)}`
        : undefined,
      models: p.models,
    }));
    res.json({ success: true, providers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST update provider API Key or Endpoint
router.post('/key', (req, res) => {
  try {
    const { providerId, apiKey, apiEndpoint } = req.body;
    if (!providerId) {
      return res.status(400).json({ success: false, error: 'providerId is required' });
    }

    const updated = db.updateProviderKey(providerId, apiKey, apiEndpoint);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }

    // Also update current process environment if provided
    if (providerId === 'google') process.env.GOOGLE_AI_API_KEY = apiKey;
    if (providerId === 'runway') process.env.RUNWAYML_API_SECRET = apiKey;
    if (providerId === 'luma') process.env.LUMA_API_KEY = apiKey;
    if (providerId === 'replicate') process.env.REPLICATE_API_TOKEN = apiKey;
    if (apiEndpoint && providerId === 'comfyui') process.env.COMFYUI_ENDPOINT = apiEndpoint;

    res.json({
      success: true,
      message: `Credentials updated for ${updated.name}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST toggle mode between API Mode and Self-Hosted Mode
router.post('/mode', (req, res) => {
  try {
    const { providerId, mode, apiEndpoint } = req.body;
    if (!providerId || !mode) {
      return res.status(400).json({ success: false, error: 'providerId and mode are required' });
    }

    const updated = db.setProviderMode(providerId, mode, apiEndpoint);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }

    res.json({ success: true, provider: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
