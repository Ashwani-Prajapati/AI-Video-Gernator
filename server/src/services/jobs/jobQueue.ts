import path from 'node:path';
import { db } from '../../db/db.js';
import type { GenerationJob, JobStatus, Project, Scene } from '../../types/index.js';
import { modelRegistry } from '../ai/registry.js';
import { StoryboardGenerator } from '../llm/storyboardGenerator.js';
import { FFmpegService, OUTPUTS_DIR } from '../video/ffmpegService.js';

export class JobQueue {
  private isProcessing = false;
  private cancelledJobs = new Set<string>();

  constructor() {
    // Check for unfinished jobs on boot
    this.recoverJobs();
    // Poll loop every 3 seconds for queued jobs
    setInterval(() => this.processNext(), 3000);
  }

  private recoverJobs(): void {
    const active = db.getActiveJobs();
    active.forEach((job) => {
      console.log(`[JobQueue] Recovering unfinished job ${job.id} (Status: ${job.status})`);
      db.updateJob(job.id, {
        status: 'queued',
        stageMessage: 'Server restarted: Job re-queued for processing',
      });
    });
  }

  public enqueueJob(jobId: string): void {
    console.log(`[JobQueue] Enqueued job: ${jobId}`);
    setTimeout(() => this.processNext(), 100);
  }

  public cancelJob(jobId: string): boolean {
    this.cancelledJobs.add(jobId);
    db.updateJob(jobId, {
      status: 'cancelled',
      stageMessage: 'Generation cancelled by user',
    });
    return true;
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing) return;

    const queuedJobs = db.getActiveJobs().filter((j) => j.status === 'queued');
    if (queuedJobs.length === 0) return;

    const job = queuedJobs[0];
    this.isProcessing = true;

    try {
      if (job.type === 'single_scene') {
        await this.executeSingleSceneJob(job);
      } else if (job.type === 'render_only') {
        await this.executeRenderOnlyJob(job);
      } else {
        await this.executeFullProjectJob(job);
      }
    } catch (err: any) {
      console.error(`[JobQueue] Job ${job.id} encountered error:`, err);
      db.updateJob(job.id, {
        status: 'failed',
        error: err.message || 'Unknown processing error',
        stageMessage: `Failed: ${err.message}`,
      });
    } finally {
      this.isProcessing = false;
      this.cancelledJobs.delete(job.id);
    }
  }

  private async executeFullProjectJob(job: GenerationJob): Promise<void> {
    const project = db.getProjectById(job.projectId);
    if (!project) throw new Error(`Project ${job.projectId} not found.`);

    // Check cancellation
    if (this.cancelledJobs.has(job.id)) return;

    // STEP 1: Storyboard Generation if project has no scenes or needs new plan
    let scenes = db.getScenes(project.id);
    if (scenes.length === 0) {
      db.updateJob(job.id, {
        status: 'preparing_storyboard',
        stageMessage: `Analyzing concept and breaking into scenes for ${project.settings.targetTotalDuration}s total duration...`,
        progressPercent: 10,
      });

      const plan = await StoryboardGenerator.planProject({
        prompt: project.originalPrompt,
        totalDuration: project.settings.targetTotalDuration,
        style: project.settings.visualStyle,
        cameraDefault: project.settings.cameraMovementDefault,
        language: project.settings.narrationLanguage,
      });

      // Update project with plan
      db.updateProject(project.id, {
        enhancedPrompt: plan.enhancedPrompt,
        continuity: plan.continuity,
      });

      // Insert scenes into database
      plan.scenes.forEach((s, idx) => {
        db.createScene({
          projectId: project.id,
          orderIndex: idx,
          title: s.title,
          prompt: s.prompt,
          targetDuration: s.targetDuration,
          cameraMovement: s.cameraMovement,
          motionIntensity: s.motionIntensity,
          narrationText: s.narrationText,
          transitionToNext: s.transitionToNext,
          status: 'pending',
        });
      });

      scenes = db.getScenes(project.id);
    }

    db.updateJob(job.id, {
      totalScenes: scenes.length,
      stageMessage: `Storyboard ready (${scenes.length} scenes). Initiating scene generation...`,
      progressPercent: 20,
    });

    // STEP 2: Scene Generation
    const adapter = modelRegistry.getAdapter(project.settings.providerId);
    let completedCount = 0;

    for (let i = 0; i < scenes.length; i++) {
      if (this.cancelledJobs.has(job.id)) {
        db.updateJob(job.id, { status: 'cancelled', stageMessage: 'Cancelled during scene generation' });
        return;
      }

      const scene = scenes[i];

      // Skip already completed scenes
      if (scene.status === 'completed' && scene.videoUrl) {
        completedCount++;
        continue;
      }

      db.updateScene(scene.id, { status: 'generating' });
      db.updateJob(job.id, {
        status: 'generating_scenes',
        currentSceneIndex: i + 1,
        stageMessage: `Generating Scene ${i + 1} of ${scenes.length}: "${scene.title}"...`,
        progressPercent: Math.round(20 + ((i + 1) / scenes.length) * 60),
      });

      try {
        const genResult = await adapter.generateScene({
          projectId: project.id,
          sceneId: scene.id,
          prompt: scene.prompt,
          durationSeconds: scene.targetDuration,
          aspectRatio: project.settings.aspectRatio,
          resolution: project.settings.resolution,
          cameraMovement: scene.cameraMovement,
          motionIntensity: scene.motionIntensity,
          style: project.settings.visualStyle,
        });

        if (genResult.success && genResult.videoUrl) {
          db.updateScene(scene.id, {
            status: 'completed',
            videoUrl: genResult.videoUrl,
            thumbnailUrl: genResult.thumbnailUrl,
            actualDuration: genResult.actualDurationSeconds || scene.targetDuration,
            error: undefined,
          });
          completedCount++;
        } else {
          db.updateScene(scene.id, {
            status: 'failed',
            error: genResult.error || 'Generation failed',
          });
        }
      } catch (sceneErr: any) {
        db.updateScene(scene.id, {
          status: 'failed',
          error: sceneErr.message || 'Scene generation error',
        });
      }
    }

    // Refresh scenes list
    scenes = db.getScenes(project.id);
    const successfulScenes = scenes.filter((s) => s.status === 'completed' && s.videoUrl);

    if (successfulScenes.length === 0) {
      throw new Error('All scene generations failed. Check model credentials or provider status.');
    }

    // STEP 3: Final Video Assembly via FFmpeg
    db.updateJob(job.id, {
      status: 'rendering_final',
      stageMessage: `Assembling and rendering final ${project.settings.targetTotalDuration}s video with transitions...`,
      progressPercent: 90,
    });

    const scenePaths = successfulScenes.map((s) => {
      // Map public url back to local path if local
      if (s.videoUrl!.startsWith('/outputs/')) {
        const basename = path.basename(s.videoUrl!);
        return path.join(OUTPUTS_DIR, basename);
      }
      return s.videoUrl!;
    });

    const assembly = await FFmpegService.assembleFinalVideo({
      projectId: project.id,
      sceneVideoPaths: scenePaths,
      aspectRatio: project.settings.aspectRatio,
      resolution: project.settings.resolution,
      transition: 'crossfade',
      bgMusicVolume: project.settings.bgMusicVolume,
    });

    // STEP 4: Complete Job
    db.updateProject(project.id, {
      finalVideoUrl: assembly.finalVideoUrl,
      finalVideoDuration: assembly.duration,
      finalVideoSizeBytes: assembly.sizeBytes,
      status: 'completed',
    });

    db.updateJob(job.id, {
      status: 'completed',
      completedScenes: successfulScenes.length,
      progressPercent: 100,
      stageMessage: `Successfully produced final ${assembly.duration.toFixed(1)}s cinematic video!`,
      completedAt: new Date().toISOString(),
    });

    console.log(`[JobQueue] Successfully completed job ${job.id} for project ${project.id}`);
  }

  private async executeSingleSceneJob(job: GenerationJob): Promise<void> {
    if (!job.targetSceneId) throw new Error('Missing targetSceneId for single_scene job');
    const scene = db.getSceneById(job.targetSceneId);
    if (!scene) throw new Error(`Scene ${job.targetSceneId} not found`);
    const project = db.getProjectById(job.projectId);
    if (!project) throw new Error(`Project ${job.projectId} not found`);

    db.updateJob(job.id, {
      status: 'generating_scenes',
      stageMessage: `Regenerating scene "${scene.title}"...`,
      progressPercent: 35,
    });

    db.updateScene(scene.id, { status: 'generating' });

    const adapter = modelRegistry.getAdapter(project.settings.providerId);
    const genResult = await adapter.generateScene({
      projectId: project.id,
      sceneId: scene.id,
      prompt: scene.prompt,
      durationSeconds: scene.targetDuration,
      aspectRatio: project.settings.aspectRatio,
      resolution: project.settings.resolution,
      cameraMovement: scene.cameraMovement,
      motionIntensity: scene.motionIntensity,
      style: project.settings.visualStyle,
    });

    if (genResult.success && genResult.videoUrl) {
      db.updateScene(scene.id, {
        status: 'completed',
        videoUrl: genResult.videoUrl,
        thumbnailUrl: genResult.thumbnailUrl,
        actualDuration: genResult.actualDurationSeconds || scene.targetDuration,
        error: undefined,
      });

      db.updateJob(job.id, {
        status: 'completed',
        progressPercent: 100,
        stageMessage: `Scene "${scene.title}" regenerated successfully.`,
        completedAt: new Date().toISOString(),
      });
    } else {
      db.updateScene(scene.id, {
        status: 'failed',
        error: genResult.error || 'Regeneration failed',
      });
      throw new Error(genResult.error || 'Regeneration failed');
    }
  }

  private async executeRenderOnlyJob(job: GenerationJob): Promise<void> {
    const project = db.getProjectById(job.projectId);
    if (!project) throw new Error(`Project ${job.projectId} not found`);

    const scenes = db.getScenes(project.id).filter((s) => s.status === 'completed' && s.videoUrl);
    if (scenes.length === 0) throw new Error('No completed scenes available to render.');

    db.updateJob(job.id, {
      status: 'rendering_final',
      stageMessage: 'Re-assembling final video from timeline...',
      progressPercent: 50,
    });

    const scenePaths = scenes.map((s) => {
      if (s.videoUrl!.startsWith('/outputs/')) {
        return path.join(OUTPUTS_DIR, path.basename(s.videoUrl!));
      }
      return s.videoUrl!;
    });

    const assembly = await FFmpegService.assembleFinalVideo({
      projectId: project.id,
      sceneVideoPaths: scenePaths,
      aspectRatio: project.settings.aspectRatio,
      resolution: project.settings.resolution,
      transition: 'crossfade',
      bgMusicVolume: project.settings.bgMusicVolume,
    });

    db.updateProject(project.id, {
      finalVideoUrl: assembly.finalVideoUrl,
      finalVideoDuration: assembly.duration,
      finalVideoSizeBytes: assembly.sizeBytes,
      status: 'completed',
    });

    db.updateJob(job.id, {
      status: 'completed',
      progressPercent: 100,
      stageMessage: 'Timeline rendered successfully.',
      completedAt: new Date().toISOString(),
    });
  }
}

export const jobQueue = new JobQueue();
