import { ComfyUIAdapter } from './adapters/comfyui.js';
import { GoogleVeoAdapter } from './adapters/googleVeo.js';
import { LumaAdapter } from './adapters/luma.js';
import { PollinationsAdapter } from './adapters/pollinations.js';
import { ProceduralAdapter } from './adapters/procedural.js';
import { ReplicateAdapter } from './adapters/replicate.js';
import { RunwayAdapter } from './adapters/runway.js';
import type { VideoModelAdapter } from './types.js';

class ModelAdapterRegistry {
  private adapters: Map<string, VideoModelAdapter> = new Map();

  constructor() {
    this.register(new GoogleVeoAdapter());
    this.register(new PollinationsAdapter());
    this.register(new RunwayAdapter());
    this.register(new LumaAdapter());
    this.register(new ReplicateAdapter());
    this.register(new ComfyUIAdapter());
    this.register(new ProceduralAdapter());
  }

  public register(adapter: VideoModelAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  public getAdapter(providerId: string): VideoModelAdapter {
    const adapter = this.adapters.get(providerId);
    if (adapter) return adapter;
    // Default fallback to procedural engine
    return this.adapters.get('procedural')!;
  }

  public getAll(): VideoModelAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const modelRegistry = new ModelAdapterRegistry();
