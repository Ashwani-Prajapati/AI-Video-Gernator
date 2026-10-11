import type {
  Asset,
  GenerationJob,
  ModelCapability,
  Project,
  ProviderConfig,
  Scene,
} from '../types';

const BASE_URL = '/api';

export const api = {
  // Health
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  // Projects
  async getProjects(): Promise<{ success: boolean; projects: Project[] }> {
    const res = await fetch(`${BASE_URL}/projects`);
    return res.json();
  },

  async getProject(id: string): Promise<{ success: boolean; project: Project }> {
    const res = await fetch(`${BASE_URL}/projects/${id}`);
    return res.json();
  },

  async createProject(data: Partial<Project>): Promise<{ success: boolean; project: Project }> {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateProject(id: string, data: Partial<Project>): Promise<{ success: boolean; project: Project }> {
    const res = await fetch(`${BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteProject(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/projects/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async duplicateProject(id: string): Promise<{ success: boolean; project: Project }> {
    const res = await fetch(`${BASE_URL}/projects/${id}/duplicate`, { method: 'POST' });
    return res.json();
  },

  // Scenes
  async getScenes(projectId: string): Promise<{ success: boolean; scenes: Scene[] }> {
    const res = await fetch(`${BASE_URL}/scenes/project/${projectId}`);
    return res.json();
  },

  async updateScene(id: string, data: Partial<Scene>): Promise<{ success: boolean; scene: Scene }> {
    const res = await fetch(`${BASE_URL}/scenes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteScene(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/scenes/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async reorderScenes(projectId: string, sceneIds: string[]): Promise<{ success: boolean; scenes: Scene[] }> {
    const res = await fetch(`${BASE_URL}/scenes/project/${projectId}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneIds }),
    });
    return res.json();
  },

  async regenerateScene(sceneId: string): Promise<{ success: boolean; jobId: string; job: GenerationJob }> {
    const res = await fetch(`${BASE_URL}/scenes/${sceneId}/regenerate`, { method: 'POST' });
    return res.json();
  },

  // Generation
  async generateStoryboard(data: {
    prompt: string;
    totalDuration: number;
    style: string;
    cameraDefault?: string;
    language?: 'en' | 'hi';
  }) {
    const res = await fetch(`${BASE_URL}/generate/storyboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async startGeneration(data: any): Promise<{ success: boolean; projectId: string; jobId: string; job: GenerationJob }> {
    const res = await fetch(`${BASE_URL}/generate/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async generateImageToVideo(data: any): Promise<{ success: boolean; projectId: string; jobId: string }> {
    const res = await fetch(`${BASE_URL}/generate/image-to-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Jobs
  async getJob(id: string): Promise<{
    success: boolean;
    job: GenerationJob;
    projectStatus?: string;
    finalVideoUrl?: string;
    scenes?: Scene[];
  }> {
    const res = await fetch(`${BASE_URL}/jobs/${id}`);
    return res.json();
  },

  async cancelJob(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/jobs/${id}/cancel`, { method: 'POST' });
    return res.json();
  },

  // Render
  async renderProject(projectId: string, settings?: any): Promise<{ success: boolean; jobId: string }> {
    const res = await fetch(`${BASE_URL}/render/project/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    return res.json();
  },

  // Models & Settings
  async getModels(): Promise<{ success: boolean; models: ModelCapability[] }> {
    const res = await fetch(`${BASE_URL}/models`);
    return res.json();
  },

  async getSettings(): Promise<{ success: boolean; providers: ProviderConfig[] }> {
    const res = await fetch(`${BASE_URL}/settings`);
    return res.json();
  },

  async updateKey(providerId: string, apiKey: string, apiEndpoint?: string) {
    const res = await fetch(`${BASE_URL}/settings/key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, apiKey, apiEndpoint }),
    });
    return res.json();
  },

  async setMode(providerId: string, mode: 'api' | 'self-hosted', apiEndpoint?: string) {
    const res = await fetch(`${BASE_URL}/settings/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, mode, apiEndpoint }),
    });
    return res.json();
  },

  // Assets
  async getAssets(): Promise<{ success: boolean; assets: Asset[] }> {
    const res = await fetch(`${BASE_URL}/assets`);
    return res.json();
  },

  async uploadAsset(file: File, projectId?: string, assetType?: string): Promise<{ success: boolean; asset: Asset; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('projectId', projectId);
    if (assetType) formData.append('assetType', assetType);

    const res = await fetch(`${BASE_URL}/assets/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  async deleteAsset(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/assets/${id}`, { method: 'DELETE' });
    return res.json();
  },
};
