import type { GenerateSceneParams, GenerationResult, VideoModelAdapter } from '../types.js';

export class LumaAdapter implements VideoModelAdapter {
  public id = 'luma';
  public name = 'Luma Dream Machine (Ray 2)';

  public validateCredentials(): { isValid: boolean; message?: string } {
    const key = process.env.LUMA_API_KEY;
    if (!key || key.trim().length === 0) {
      return {
        isValid: false,
        message:
          'Luma API Key is not configured. Set LUMA_API_KEY in environment or Settings to use Dream Machine.',
      };
    }
    return { isValid: true };
  }

  public async generateScene(params: GenerateSceneParams): Promise<GenerationResult> {
    const credCheck = this.validateCredentials();
    if (!credCheck.isValid) {
      return { success: false, error: credCheck.message };
    }

    const apiKey = process.env.LUMA_API_KEY;

    try {
      const endpoint = 'https://api.lumalabs.ai/dream-machine/v1/generations';
      const body: Record<string, unknown> = {
        prompt: params.prompt,
        aspect_ratio: params.aspectRatio,
        loop: false,
      };

      if (params.firstFrameUrl) {
        body.keyframes = {
          frame0: { type: 'image', url: params.firstFrameUrl },
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `Luma API error (${response.status}): ${errText}` };
      }

      const data = (await response.json()) as any;
      return {
        success: true,
        providerJobId: data.id,
      };
    } catch (err: any) {
      return { success: false, error: `Luma request failed: ${err.message}` };
    }
  }

  public async checkJobStatus(jobId: string): Promise<GenerationResult> {
    const apiKey = process.env.LUMA_API_KEY;
    if (!apiKey) return { success: false, error: 'Missing Luma API key' };

    try {
      const res = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${jobId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) return { success: false, error: `Luma polling error: ${res.status}` };
      const data = (await res.json()) as any;

      if (data.state === 'completed') {
        return {
          success: true,
          videoUrl: data.assets?.video,
          thumbnailUrl: data.assets?.image,
        };
      } else if (data.state === 'failed') {
        return {
          success: false,
          error: data.failure_reason || 'Luma video generation failed',
        };
      }

      return { success: true, providerJobId: jobId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
