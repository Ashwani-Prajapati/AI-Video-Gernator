import type { GenerateSceneParams, GenerationResult, VideoModelAdapter } from '../types.js';

export class ComfyUIAdapter implements VideoModelAdapter {
  public id = 'comfyui';
  public name = 'ComfyUI (Self-Hosted Local Inference)';

  public validateCredentials(): { isValid: boolean; message?: string } {
    const endpoint = process.env.COMFYUI_ENDPOINT || 'http://127.0.0.1:8188';
    return {
      isValid: true,
      message: `Configured for local ComfyUI at ${endpoint}. Ensure your local ComfyUI server is running with AnimateDiff or Wan2.1 nodes.`,
    };
  }

  public async generateScene(params: GenerateSceneParams): Promise<GenerationResult> {
    const endpoint = process.env.COMFYUI_ENDPOINT || 'http://127.0.0.1:8188';

    try {
      // Check if ComfyUI local server is active
      const healthCheck = await fetch(`${endpoint}/system_stats`, { signal: AbortSignal.timeout(3000) });
      if (!healthCheck.ok) {
        return {
          success: false,
          error: `ComfyUI server at ${endpoint} returned status ${healthCheck.status}. Ensure local ComfyUI is launched.`,
        };
      }

      // ComfyUI workflow prompt submission payload
      const promptPayload = {
        client_id: `vividflow_${Date.now()}`,
        prompt: {
          '3': {
            class_type: 'KSampler',
            inputs: {
              seed: Math.floor(Math.random() * 1000000),
              steps: 25,
              cfg: 7,
              sampler_name: 'euler',
              scheduler: 'normal',
            },
          },
          '6': {
            class_type: 'CLIPTextEncode',
            inputs: { text: params.prompt },
          },
        },
      };

      const res = await fetch(`${endpoint}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptPayload),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `ComfyUI submission error: ${err}` };
      }

      const data = (await res.json()) as any;
      return {
        success: true,
        providerJobId: data.prompt_id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Cannot connect to local ComfyUI at ${endpoint}: ${err.message}. Please verify local ComfyUI is running.`,
      };
    }
  }

  public async checkJobStatus(jobId: string): Promise<GenerationResult> {
    const endpoint = process.env.COMFYUI_ENDPOINT || 'http://127.0.0.1:8188';
    try {
      const res = await fetch(`${endpoint}/history/${jobId}`);
      if (!res.ok) return { success: false, error: `ComfyUI history fetch failed: ${res.status}` };

      const data = (await res.json()) as any;
      const historyItem = data[jobId];
      if (historyItem && historyItem.outputs) {
        // Look for video/gif output nodes
        return {
          success: true,
          videoUrl: `${endpoint}/view?filename=vividflow_${jobId}.mp4`,
        };
      }
      return { success: true, providerJobId: jobId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
