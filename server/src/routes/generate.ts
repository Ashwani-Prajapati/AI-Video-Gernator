import { Router } from 'express';
import { db } from '../db/db.js';
import { jobQueue } from '../services/jobs/jobQueue.js';
import { StoryboardGenerator } from '../services/llm/storyboardGenerator.js';

const router = Router();

// POST preview/generate storyboard only
router.post('/storyboard', async (req, res) => {
  try {
    const { prompt, totalDuration = 60, style = 'cinematic-realism', cameraDefault = 'tracking-shot', language = 'en' } = req.body;
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const plan = await StoryboardGenerator.planProject({
      prompt,
      totalDuration,
      style,
      cameraDefault,
      language,
    });

    res.json({ success: true, plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST start full multi-scene project generation
router.post('/start', async (req, res) => {
  try {
    const {
      projectId,
      name,
      prompt,
      targetTotalDuration = 60,
      aspectRatio = '16:9',
      resolution = '1080p',
      visualStyle = 'cinematic-realism',
      cameraMovementDefault = 'tracking-shot',
      motionIntensityDefault = 6,
      providerId = 'procedural',
      modelId = 'procedural-cinematic',
      narrationLanguage = 'en',
      scenes: customScenes,
    } = req.body;

    if (!prompt && !projectId) {
      return res.status(400).json({ success: false, error: 'Prompt or existing projectId is required' });
    }

    let project = projectId ? db.getProjectById(projectId) : null;

    if (!project) {
      // Create new project
      project = db.createProject({
        name: name || `Project: ${prompt.slice(0, 32)}...`,
        originalPrompt: prompt,
        settings: {
          targetTotalDuration,
          aspectRatio,
          resolution,
          visualStyle,
          cameraMovementDefault,
          motionIntensityDefault,
          providerId,
          modelId,
          fps: 30,
          includeAudio: true,
          narrationVoice: narrationLanguage === 'hi' ? 'hi-IN-Neural' : 'en-US-Neural',
          narrationLanguage,
          bgMusicVolume: 0.35,
          narrationVolume: 0.85,
          burnSubtitles: true,
        },
      });
    } else {
      // Update existing project settings
      project = db.updateProject(project.id, {
        settings: {
          ...project.settings,
          targetTotalDuration,
          aspectRatio,
          resolution,
          visualStyle,
          providerId,
          modelId,
          narrationLanguage,
        },
      })!;
    }

    // If custom scenes were edited in the storyboard and provided
    if (Array.isArray(customScenes) && customScenes.length > 0) {
      // Clear old scenes
      const existingScenes = db.getScenes(project.id);
      existingScenes.forEach((s) => db.deleteScene(s.id));

      // Re-insert custom scenes
      customScenes.forEach((s: any, idx: number) => {
        db.createScene({
          projectId: project!.id,
          orderIndex: idx,
          title: s.title || `Scene ${idx + 1}`,
          prompt: s.prompt,
          targetDuration: s.targetDuration || targetTotalDuration / customScenes.length,
          cameraMovement: s.cameraMovement || cameraMovementDefault,
          motionIntensity: s.motionIntensity || motionIntensityDefault,
          narrationText: s.narrationText,
          transitionToNext: s.transitionToNext || 'crossfade',
          status: 'pending',
        });
      });
    }

    // Create persistent generation job
    const job = db.createJob({
      projectId: project.id,
      type: 'full_project',
      providerId,
      modelId,
      stageMessage: 'Generation initialized',
    });

    // Enqueue job to background worker
    jobQueue.enqueueJob(job.id);

    res.json({
      success: true,
      projectId: project.id,
      jobId: job.id,
      job,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Image-to-Video generation
router.post('/image-to-video', async (req, res) => {
  try {
    const {
      imageUrl,
      prompt,
      duration = 6,
      aspectRatio = '16:9',
      resolution = '1080p',
      motionIntensity = 6,
      cameraMovement = 'pan-right',
      providerId = 'procedural',
      modelId = 'procedural-cinematic',
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'Reference image URL is required' });
    }

    // Create project for image-to-video
    const project = db.createProject({
      name: `Image to Video: ${prompt ? prompt.slice(0, 30) : 'Animated Sequence'}`,
      originalPrompt: prompt || 'Animate the reference image with fluid cinematic motion',
      settings: {
        targetTotalDuration: 45,
        aspectRatio,
        resolution,
        visualStyle: 'cinematic-realism',
        cameraMovementDefault: cameraMovement,
        motionIntensityDefault: motionIntensity,
        providerId,
        modelId,
        fps: 30,
        includeAudio: true,
        narrationVoice: 'en-US-Neural',
        narrationLanguage: 'en',
        bgMusicVolume: 0.3,
        narrationVolume: 0.8,
        burnSubtitles: false,
      },
    });

    // Add first scene with reference image
    db.createScene({
      projectId: project.id,
      orderIndex: 0,
      title: 'Scene 1: Image Animation',
      prompt: prompt || 'Bring image to life with subtle depth and cinematic light shift',
      firstFrameUrl: imageUrl,
      targetDuration: duration,
      cameraMovement,
      motionIntensity,
      status: 'pending',
    });

    const job = db.createJob({
      projectId: project.id,
      type: 'full_project',
      providerId,
      modelId,
    });

    jobQueue.enqueueJob(job.id);

    res.json({
      success: true,
      projectId: project.id,
      jobId: job.id,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
