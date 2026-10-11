import type {
  Asset,
  GenerationJob,
  ModelCapability,
  Project,
  ProviderConfig,
  Scene,
} from '../types';

/**
 * Resolves the configured API base URL.
 * Checks VITE_API_URL / VITE_API_BASE_URL environment variables in production.
 * Defaults to relative '/api' for local Vite dev proxy and same-domain deployment.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return '/api';
};

/**
 * Returns backend server origin for media files (/outputs and /uploads).
 */
export const getMediaBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean.slice(0, -4) : clean;
  }
  return '';
};

/**
 * Resolves media URLs (e.g. /outputs/video.mp4 or /uploads/image.png) to full URLs
 * when the backend is hosted separately from the static frontend.
 */
export const resolveMediaUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const mediaBase = getMediaBaseUrl();
  if (mediaBase && url.startsWith('/')) {
    return `${mediaBase}${url}`;
  }
  return url;
};

/**
 * Helper to normalize media URLs across Scene objects
 */
const normalizeScene = (scene: Scene): Scene => ({
  ...scene,
  videoUrl: resolveMediaUrl(scene.videoUrl),
  thumbnailUrl: resolveMediaUrl(scene.thumbnailUrl),
  firstFrameUrl: resolveMediaUrl(scene.firstFrameUrl),
  lastFrameUrl: resolveMediaUrl(scene.lastFrameUrl),
  audioTrackUrl: resolveMediaUrl(scene.audioTrackUrl),
});

/**
 * Helper to normalize media URLs across Project objects
 */
const normalizeProject = (project: Project): Project => ({
  ...project,
  finalVideoUrl: resolveMediaUrl(project.finalVideoUrl),
  scenes: (project.scenes || []).map(normalizeScene),
});

/**
 * Safe fetch wrapper with content-type checking, HTTP status checks,
 * and descriptive human-readable errors.
 */
async function fetchSafe<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    throw new Error(
      `Cannot connect to backend server at "${url}". ${
        netErr.message || 'Please check your connection and verify the backend is online.'
      }`
    );
  }

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let errorDetail = '';
    if (contentType.includes('application/json')) {
      try {
        const errorJson = await res.json();
        errorDetail = errorJson.error || errorJson.message || JSON.stringify(errorJson);
      } catch {
        errorDetail = await res.text();
      }
    } else {
      const rawText = await res.text();
      if (res.status === 404) {
        errorDetail = `Backend route not found (HTTP 404 at ${url}). The backend is unreachable at this URL. If deployed on Vercel, please set VITE_API_URL in your Vercel project environment variables to point to your deployed backend URL. ${rawText.slice(0, 100)}`;
      } else {
        errorDetail = `Server error HTTP ${res.status} (${res.statusText}): ${rawText.slice(0, 140)}`;
      }
    }
    throw new Error(errorDetail || `API request failed with HTTP status ${res.status}`);
  }

  // Ensure content is JSON before parsing
  if (!contentType.includes('application/json')) {
    const rawText = await res.text();
    const isHtml = rawText.includes('<!doctype') || rawText.includes('<html') || contentType.includes('text/html');
    const hint = isHtml
      ? ' The frontend received HTML instead of API data. This occurs when Vercel serves index.html for missing backend routes. Please set VITE_API_URL in Vercel to your deployed backend URL.'
      : '';
    throw new Error(
      `Expected JSON from "${url}", but server returned ${contentType || 'text'} (HTTP ${res.status}).${hint}`
    );
  }

  try {
    return (await res.json()) as T;
  } catch (parseErr: any) {
    throw new Error(`Invalid JSON received from "${url}": ${parseErr.message}`);
  }
}

/**
 * Fallback AI Models for initial UI render and offline/cold-start resilience.
 * Contains only genuinely implemented providers in this project.
 */
export const DEFAULT_MODELS: ModelCapability[] = [
  {
    id: 'pollinations-video',
    name: 'Pollinations AI Video (Free & Unlimited)',
    providerId: 'pollinations',
    providerName: 'Pollinations AI',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: false,
    supportsReferenceImages: true,
    supportsNativeAudio: true,
    maxClipDurationSeconds: 10,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedResolutions: ['720p', '1080p'],
    isConfigured: true,
    isSelfHosted: false,
    pricingDescription: '$0 Free (No API Key Required)',
    rateLimitDescription: 'Open AI Video Tier',
  },
  {
    id: 'procedural-cinematic',
    name: 'VividFlow High-Def Engine (Free & Instant)',
    providerId: 'procedural',
    providerName: 'VividFlow Engine',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsReferenceImages: true,
    supportsNativeAudio: true,
    maxClipDurationSeconds: 10,
    supportedAspectRatios: ['16:9', '9:16', '1:1', '21:9'],
    supportedResolutions: ['720p', '1080p'],
    isConfigured: true,
    isSelfHosted: true,
    pricingDescription: 'Free & Local (Zero API keys required)',
    rateLimitDescription: 'Instant generation & assembly',
  },
  {
    id: 'veo-2',
    name: 'Google Veo 2 (Cinematic High-Def)',
    providerId: 'google',
    providerName: 'Google DeepMind',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsReferenceImages: true,
    supportsNativeAudio: true,
    maxClipDurationSeconds: 8,
    supportedAspectRatios: ['16:9', '9:16', '1:1', '21:9'],
    supportedResolutions: ['720p', '1080p', '4k'],
    isConfigured: false,
    isSelfHosted: false,
    pricingDescription: 'Google Cloud Vertex AI / Gemini API',
    rateLimitDescription: 'Standard Cloud Quota (10 QPM)',
  },
  {
    id: 'runway-gen3',
    name: 'Runway Gen-3 Alpha',
    providerId: 'runway',
    providerName: 'Runway ML',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsReferenceImages: false,
    supportsNativeAudio: false,
    maxClipDurationSeconds: 10,
    supportedAspectRatios: ['16:9', '9:16'],
    supportedResolutions: ['720p', '1080p'],
    isConfigured: false,
    isSelfHosted: false,
    pricingDescription: 'Runway Developer API (5-10 credits/sec)',
    rateLimitDescription: '5 concurrent generations',
  },
  {
    id: 'luma-ray',
    name: 'Luma Dream Machine (Ray 2)',
    providerId: 'luma',
    providerName: 'Luma AI',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsReferenceImages: true,
    supportsNativeAudio: false,
    maxClipDurationSeconds: 9,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedResolutions: ['720p', '1080p'],
    isConfigured: false,
    isSelfHosted: false,
    pricingDescription: 'Luma Ray API',
    rateLimitDescription: 'Standard API limits',
  },
  {
    id: 'wan-2.1',
    name: 'Wan 2.1 (Open Weights 14B)',
    providerId: 'replicate',
    providerName: 'Replicate / Open Source',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsReferenceImages: true,
    supportsNativeAudio: false,
    maxClipDurationSeconds: 6,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedResolutions: ['720p', '1080p'],
    isConfigured: false,
    isSelfHosted: false,
    pricingDescription: 'Replicate GPU Cloud (~$0.05 per clip)',
    rateLimitDescription: 'Scale on demand',
  },
  {
    id: 'comfyui-local',
    name: 'ComfyUI Local Self-Hosted (AnimateDiff / Wan2.1)',
    providerId: 'comfyui',
    providerName: 'Self-Hosted Local Server',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsReferenceImages: true,
    supportsNativeAudio: false,
    maxClipDurationSeconds: 8,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedResolutions: ['720p', '1080p'],
    isConfigured: true,
    isSelfHosted: true,
    pricingDescription: '$0 (Uses local GPU: RTX 3080/4090 or local inference)',
    rateLimitDescription: 'Hardware dependent (1 job at a time)',
  },
];

export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'pollinations',
    name: 'Pollinations AI (Free Video Generator)',
    enabled: true,
    mode: 'api',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'pollinations'),
  },
  {
    id: 'procedural',
    name: 'VividFlow Built-in Engine',
    enabled: true,
    mode: 'self-hosted',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'procedural'),
  },
  {
    id: 'google',
    name: 'Google Video AI (Veo 2 / Gemini)',
    enabled: true,
    mode: 'api',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'google'),
  },
  {
    id: 'runway',
    name: 'Runway ML (Gen-3 Alpha)',
    enabled: true,
    mode: 'api',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'runway'),
  },
  {
    id: 'luma',
    name: 'Luma AI (Dream Machine)',
    enabled: true,
    mode: 'api',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'luma'),
  },
  {
    id: 'replicate',
    name: 'Replicate (Wan 2.1 & Open Source)',
    enabled: true,
    mode: 'api',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'replicate'),
  },
  {
    id: 'comfyui',
    name: 'ComfyUI (Self-Hosted GPU)',
    enabled: true,
    mode: 'self-hosted',
    apiEndpoint: 'http://127.0.0.1:8188',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'comfyui'),
  },
];

export const api = {
  // Health
  async getHealth() {
    return fetchSafe('/health');
  },

  // Projects
  async getProjects(): Promise<{ success: boolean; projects: Project[] }> {
    const res = await fetchSafe<{ success: boolean; projects: Project[] }>('/projects');
    if (res.success && Array.isArray(res.projects)) {
      return {
        ...res,
        projects: res.projects.map(normalizeProject),
      };
    }
    return res;
  },

  async getProject(id: string): Promise<{ success: boolean; project: Project }> {
    const res = await fetchSafe<{ success: boolean; project: Project }>(`/projects/${id}`);
    if (res.success && res.project) {
      return {
        ...res,
        project: normalizeProject(res.project),
      };
    }
    return res;
  },

  async createProject(data: Partial<Project>): Promise<{ success: boolean; project: Project }> {
    const res = await fetchSafe<{ success: boolean; project: Project }>('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.success && res.project) {
      return { ...res, project: normalizeProject(res.project) };
    }
    return res;
  },

  async updateProject(id: string, data: Partial<Project>): Promise<{ success: boolean; project: Project }> {
    const res = await fetchSafe<{ success: boolean; project: Project }>(`/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.success && res.project) {
      return { ...res, project: normalizeProject(res.project) };
    }
    return res;
  },

  async deleteProject(id: string): Promise<{ success: boolean }> {
    return fetchSafe<{ success: boolean }>(`/projects/${id}`, { method: 'DELETE' });
  },

  async duplicateProject(id: string): Promise<{ success: boolean; project: Project }> {
    const res = await fetchSafe<{ success: boolean; project: Project }>(`/projects/${id}/duplicate`, {
      method: 'POST',
    });
    if (res.success && res.project) {
      return { ...res, project: normalizeProject(res.project) };
    }
    return res;
  },

  // Scenes
  async getScenes(projectId: string): Promise<{ success: boolean; scenes: Scene[] }> {
    const res = await fetchSafe<{ success: boolean; scenes: Scene[] }>(`/scenes/project/${projectId}`);
    if (res.success && Array.isArray(res.scenes)) {
      return {
        ...res,
        scenes: res.scenes.map(normalizeScene),
      };
    }
    return res;
  },

  async updateScene(id: string, data: Partial<Scene>): Promise<{ success: boolean; scene: Scene }> {
    const res = await fetchSafe<{ success: boolean; scene: Scene }>(`/scenes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.success && res.scene) {
      return { ...res, scene: normalizeScene(res.scene) };
    }
    return res;
  },

  async deleteScene(id: string): Promise<{ success: boolean }> {
    return fetchSafe<{ success: boolean }>(`/scenes/${id}`, { method: 'DELETE' });
  },

  async reorderScenes(projectId: string, sceneIds: string[]): Promise<{ success: boolean; scenes: Scene[] }> {
    const res = await fetchSafe<{ success: boolean; scenes: Scene[] }>(`/scenes/project/${projectId}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneIds }),
    });
    if (res.success && Array.isArray(res.scenes)) {
      return { ...res, scenes: res.scenes.map(normalizeScene) };
    }
    return res;
  },

  async regenerateScene(sceneId: string): Promise<{ success: boolean; jobId: string; job: GenerationJob }> {
    return fetchSafe<{ success: boolean; jobId: string; job: GenerationJob }>(`/scenes/${sceneId}/regenerate`, {
      method: 'POST',
    });
  },

  // Generation
  async generateStoryboard(data: {
    prompt: string;
    totalDuration: number;
    style: string;
    cameraDefault?: string;
    language?: 'en' | 'hi';
  }) {
    return fetchSafe('/generate/storyboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async startGeneration(data: any): Promise<{ success: boolean; projectId: string; jobId: string; job: GenerationJob }> {
    return fetchSafe<{ success: boolean; projectId: string; jobId: string; job: GenerationJob }>('/generate/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async generateImageToVideo(data: any): Promise<{ success: boolean; projectId: string; jobId: string }> {
    return fetchSafe<{ success: boolean; projectId: string; jobId: string }>('/generate/image-to-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // Jobs
  async getJob(id: string): Promise<{
    success: boolean;
    job: GenerationJob;
    projectStatus?: string;
    finalVideoUrl?: string;
    scenes?: Scene[];
  }> {
    const res = await fetchSafe<{
      success: boolean;
      job: GenerationJob;
      projectStatus?: string;
      finalVideoUrl?: string;
      scenes?: Scene[];
    }>(`/jobs/${id}`);

    if (res.success) {
      return {
        ...res,
        finalVideoUrl: resolveMediaUrl(res.finalVideoUrl),
        scenes: res.scenes ? res.scenes.map(normalizeScene) : undefined,
      };
    }
    return res;
  },

  async cancelJob(id: string): Promise<{ success: boolean }> {
    return fetchSafe<{ success: boolean }>(`/jobs/${id}/cancel`, { method: 'POST' });
  },

  // Render
  async renderProject(projectId: string, settings?: any): Promise<{ success: boolean; jobId: string }> {
    return fetchSafe<{ success: boolean; jobId: string }>(`/render/project/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
  },

  // Models & Settings
  async getModels(): Promise<{ success: boolean; models: ModelCapability[] }> {
    return fetchSafe<{ success: boolean; models: ModelCapability[] }>('/models');
  },

  async getSettings(): Promise<{ success: boolean; providers: ProviderConfig[] }> {
    return fetchSafe<{ success: boolean; providers: ProviderConfig[] }>('/settings');
  },

  async updateKey(providerId: string, apiKey: string, apiEndpoint?: string) {
    return fetchSafe('/settings/key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, apiKey, apiEndpoint }),
    });
  },

  async setMode(providerId: string, mode: 'api' | 'self-hosted', apiEndpoint?: string) {
    return fetchSafe('/settings/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, mode, apiEndpoint }),
    });
  },

  // Assets
  async getAssets(): Promise<{ success: boolean; assets: Asset[] }> {
    const res = await fetchSafe<{ success: boolean; assets: Asset[] }>('/assets');
    if (res.success && Array.isArray(res.assets)) {
      return {
        ...res,
        assets: res.assets.map((a) => ({
          ...a,
          url: resolveMediaUrl(a.url) || a.url,
        })),
      };
    }
    return res;
  },

  async uploadAsset(file: File, projectId?: string, assetType?: string): Promise<{ success: boolean; asset: Asset; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('projectId', projectId);
    if (assetType) formData.append('assetType', assetType);

    const res = await fetchSafe<{ success: boolean; asset: Asset; url: string }>('/assets/upload', {
      method: 'POST',
      body: formData,
    });
    if (res.success && res.asset) {
      return {
        ...res,
        url: resolveMediaUrl(res.url) || res.url,
        asset: {
          ...res.asset,
          url: resolveMediaUrl(res.asset.url) || res.asset.url,
        },
      };
    }
    return res;
  },

  async deleteAsset(id: string): Promise<{ success: boolean }> {
    return fetchSafe<{ success: boolean }>(`/assets/${id}`, { method: 'DELETE' });
  },
};
