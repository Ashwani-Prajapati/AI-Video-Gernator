import type { GenerateSceneParams, GenerationResult, VideoModelAdapter } from '../types.js';

export class ReplicateAdapter implements VideoModelAdapter {
  public id = 'replicate';
  public name = 'Replicate (Wan 2.1 & Open Video Models)';

  public validateCredentials(): { isValid: boolean; message?: string } {
    const key = process.env.REPLICATE_API_TOKEN;
    if (!key || key.trim().length === 0) {
      return {
        isValid: false,
        message:
          'Replicate API Token is not configured. Set REPLICATE_API_TOKEN in environment or Settings to use Wan 2.1.',
      };
    }
    return { isValid: true };
  }

  public async generateScene(params: GenerateSceneParams): Promise<GenerationResult> {
    const credCheck = this.validateCredentials();
    if (!credCheck.isValid) {
      return { success: false, error: credCheck.message };
    }

    const apiKey = process.env.REPLICATE_API_TOKEN;

    try {
      // Wan 2.1 text-to-video model version
      const endpoint = 'https://api.replicate.com/v1/predictions';
      const body = {
        version: 'wan-video/wan-2.1-14b',
        input: {
          prompt: params.prompt,
          negative_prompt: params.negativePrompt || 'blurry, low quality, distorted, bad anatomy',
          aspect_ratio: params.aspectRatio,
          num_frames: 81,
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `Replicate API error (${response.status}): ${errText}` };
      }

      const data = (await response.json()) as any;
      return {
        success: true,
        providerJobId: data.id,
      };
    } catch (err: any) {
      return { success: false, error: `Replicate request failed: ${err.message}` };
    }
  }

  public async checkJobStatus(jobId: string): Promise<GenerationResult> {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) return { success: false, error: 'Missing Replicate API token' };

    try {
      const res = await fetch(`https://api.replicate.com/v1/predictions/${jobId}`, {
        headers: { Authorization: `Token ${apiKey}` },
      });

      if (!res.ok) return { success: false, error: `Replicate polling error: ${res.status}` };
      const data = (await res.json()) as any;

      if (data.status === 'succeeded') {
        const output = Array.isArray(data.output) ? data.output[0] : data.output;
        return {
          success: true,
          videoUrl: output,
        };
      } else if (data.status === 'failed' || data.status === 'canceled') {
        return {
          success: false,
          error: data.error || 'Replicate generation failed',
        };
      }

      return { success: true, providerJobId: jobId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
