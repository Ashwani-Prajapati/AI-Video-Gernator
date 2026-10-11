import { FFmpegService } from '../../video/ffmpegService.js';
import type { GenerateSceneParams, GenerationResult, VideoModelAdapter } from '../types.js';

export class ProceduralAdapter implements VideoModelAdapter {
  public id = 'procedural';
  public name = 'VividFlow Built-in Procedural Engine';

  public validateCredentials(): { isValid: boolean; message?: string } {
    return {
      isValid: true,
      message: 'Local FFmpeg procedural generator active. Ready for instant scene synthesis.',
    };
  }

  public async generateScene(params: GenerateSceneParams): Promise<GenerationResult> {
    try {
      const result = await FFmpegService.generateProceduralSceneClip({
        sceneId: params.sceneId,
        title: `Scene: ${params.prompt.slice(0, 30)}`,
        prompt: params.prompt,
        durationSeconds: params.durationSeconds,
        aspectRatio: params.aspectRatio,
        resolution: params.resolution,
        cameraMovement: params.cameraMovement,
        motionIntensity: params.motionIntensity,
        visualStyle: params.style,
      });

      return {
        success: true,
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        actualDurationSeconds: result.duration,
        isSimulated: true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Procedural generation failed: ${err.message}`,
      };
    }
  }
}
