import type { GenerateSceneParams, GenerationResult, VideoModelAdapter } from '../types.js';

export class GoogleVeoAdapter implements VideoModelAdapter {
  public id = 'google';
  public name = 'Google Veo 2 (Gemini Video AI)';

  public validateCredentials(): { isValid: boolean; message?: string } {
    const key = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!key || key.trim().length === 0) {
      return {
        isValid: false,
        message:
          'Google AI API Key is not configured. Please set GOOGLE_AI_API_KEY in your environment or Settings panel to access Google Veo 2.',
      };
    }
    return { isValid: true };
  }

  public async generateScene(params: GenerateSceneParams): Promise<GenerationResult> {
    const credCheck = this.validateCredentials();
    if (!credCheck.isValid) {
      return {
        success: false,
        error: credCheck.message,
      };
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

    try {
      // Vertex AI / Google Video Gen endpoint
      // Note: Official Google Veo uses Google DeepMind's Vertex AI / Generative Language API
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-video:predictVideo?key=${apiKey}`;

      const payload: Record<string, unknown> = {
        prompt: params.prompt,
        videoDurationSeconds: params.durationSeconds,
        aspectRatio: params.aspectRatio === '9:16' ? 'PORTRAIT' : 'LANDSCAPE',
        personGeneration: 'ALLOW_ADULT',
      };

      if (params.referenceImageUrl) {
        payload.referenceImage = { imageUri: params.referenceImageUrl };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Google Veo API error (${response.status}): ${errorText}`,
        };
      }

      const data = (await response.json()) as any;
      const operationName = data.name; // Long-running operation ID

      // If immediate video link is returned
      if (data.generatedVideo?.videoUri) {
        return {
          success: true,
          videoUrl: data.generatedVideo.videoUri,
          actualDurationSeconds: params.durationSeconds,
          providerJobId: operationName,
        };
      }

      return {
        success: true,
        providerJobId: operationName,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Failed to connect to Google Veo API: ${err.message}`,
      };
    }
  }

  public async checkJobStatus(jobId: string): Promise<GenerationResult> {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'Missing Google API Key' };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/${jobId}?key=${apiKey}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        return { success: false, error: `Google operation polling failed with code ${response.status}` };
      }

      const data = (await response.json()) as any;
      if (data.done) {
        if (data.error) {
          return { success: false, error: data.error.message || 'Google Veo video generation failed.' };
        }
        const videoUri = data.response?.generatedVideos?.[0]?.video?.uri;
        return {
          success: true,
          videoUrl: videoUri,
        };
      }

      return { success: true, providerJobId: jobId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
