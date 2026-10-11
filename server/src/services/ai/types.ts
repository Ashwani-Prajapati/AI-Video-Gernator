import type { AspectRatio, CameraMovement, Resolution } from '../../types/index.js';

export interface GenerateSceneParams {
  projectId: string;
  sceneId: string;
  prompt: string;
  negativePrompt?: string;
  durationSeconds: number;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  cameraMovement: CameraMovement;
  motionIntensity: number; // 1 to 10
  referenceImageUrl?: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  style: string;
  characterDescriptions?: string[];
  environmentDescription?: string;
}

export interface GenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  actualDurationSeconds?: number;
  providerJobId?: string;
  error?: string;
  isSimulated?: boolean;
}

export interface VideoModelAdapter {
  id: string;
  name: string;
  generateScene(params: GenerateSceneParams): Promise<GenerationResult>;
  checkJobStatus?(jobId: string): Promise<GenerationResult>;
  cancelJob?(jobId: string): Promise<boolean>;
  validateCredentials(): { isValid: boolean; message?: string };
}
