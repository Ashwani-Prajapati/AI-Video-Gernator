import type { GenerateSceneParams, GenerationResult, VideoModelAdapter } from '../types.js';

export class RunwayAdapter implements VideoModelAdapter {
  public id = 'runway';
  public name = 'Runway ML (Gen-3 Alpha)';

  public validateCredentials(): { isValid: boolean; message?: string } {
    const key = process.env.RUNWAYML_API_SECRET;
    if (!key || key.trim().length === 0) {
      return {
        isValid: false,
        message:
          'Runway API Secret is not configured. Set RUNWAYML_API_SECRET in environment or Settings to use Gen-3 Alpha.',
      };
    }
    return { isValid: true };
  }

  public async generateScene(params: GenerateSceneParams): Promise<GenerationResult> {
    const credCheck = this.validateCredentials();
    if (!credCheck.isValid) {
      return { success: false, error: credCheck.message };
    }

    const apiKey = process.env.RUNWAYML_API_SECRET;

    try {
      const endpoint = 'https://api.runwayml.com/v1/image_to_video';
      const body: Record<string, unknown> = {
        promptText: params.prompt,
        model: 'gen3a_turbo',
        duration: Math.min(10, Math.max(5, Math.round(params.durationSeconds))),
        ratio: params.aspectRatio === '9:16' ? '9:16' : '16:9',
      };

      if (params.referenceImageUrl) {
        body.promptImage = params.referenceImageUrl;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `Runway API error (${response.status}): ${errText}` };
      }

      const data = (await response.json()) as any;
      return {
        success: true,
        providerJobId: data.id,
      };
    } catch (err: any) {
      return { success: false, error: `Runway request failed: ${err.message}` };
    }
  }

  public async checkJobStatus(jobId: string): Promise<GenerationResult> {
    const apiKey = process.env.RUNWAYML_API_SECRET;
    if (!apiKey) return { success: false, error: 'Missing Runway API key' };

    try {
      const res = await fetch(`https://api.runwayml.com/v1/tasks/${jobId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!res.ok) return { success: false, error: `Runway poll error: ${res.status}` };
      const data = (await res.json()) as any;

      if (data.status === 'SUCCEEDED') {
        return {
          success: true,
          videoUrl: data.output?.[0],
        };
      } else if (data.status === 'FAILED') {
        return {
          success: false,
          error: data.failure || 'Runway generation failed',
        };
      }

      return { success: true, providerJobId: jobId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
