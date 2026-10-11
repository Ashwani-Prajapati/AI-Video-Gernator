export type VideoDuration = 45 | 50 | 55 | 60;
export type AspectRatio = '16:9' | '9:16' | '1:1' | '21:9';
export type Resolution = '720p' | '1080p' | '4k';

export type VideoStyle =
  | 'cinematic-realism'
  | '3d-animation'
  | 'cartoon'
  | 'anime'
  | 'fantasy'
  | 'sci-fi'
  | 'documentary'
  | 'educational'
  | 'product-ad'
  | 'nature'
  | 'horror'
  | 'custom';

export type CameraMovement =
  | 'static'
  | 'pan-left'
  | 'pan-right'
  | 'tilt-up'
  | 'tilt-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'drone-fpv'
  | 'orbit'
  | 'tracking-shot';

export type TransitionType = 'cut' | 'crossfade' | 'fade-black' | 'wipe-left' | 'dissolve';

export type JobStatus =
  | 'queued'
  | 'preparing_storyboard'
  | 'generating_scenes'
  | 'rendering_final'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type SceneStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface CharacterContinuity {
  id: string;
  name: string;
  appearance: string;
  clothing: string;
  facialFeatures: string;
  colorPalette: string;
  voiceDescription?: string;
  referenceImageUrl?: string;
}

export interface EnvironmentContinuity {
  id: string;
  name: string;
  locationType: string;
  lighting: string;
  artDirection: string;
  colorMood: string;
  referenceImageUrl?: string;
}

export interface ContinuityDocument {
  characters: CharacterContinuity[];
  environments: EnvironmentContinuity[];
  generalArtDirection: string;
  lightingAtmosphere: string;
  colorGrading: string;
  timelineChronology: string;
}

export interface Scene {
  id: string;
  projectId: string;
  orderIndex: number;
  title: string;
  prompt: string;
  negativePrompt?: string;
  targetDuration: number;
  actualDuration?: number;
  cameraMovement: CameraMovement;
  motionIntensity: number;
  status: SceneStatus;
  videoUrl?: string;
  thumbnailUrl?: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  narrationText?: string;
  audioTrackUrl?: string;
  transitionToNext: TransitionType;
  providerJobId?: string;
  error?: string;
  generationAttempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSettings {
  targetTotalDuration: VideoDuration;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  visualStyle: VideoStyle;
  cameraMovementDefault: CameraMovement;
  motionIntensityDefault: number;
  modelId: string;
  providerId: string;
  fps: number;
  includeAudio: boolean;
  narrationVoice: string;
  narrationLanguage: 'en' | 'hi';
  bgMusicGenre?: string;
  bgMusicVolume: number;
  narrationVolume: number;
  burnSubtitles: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  originalPrompt: string;
  enhancedPrompt?: string;
  settings: ProjectSettings;
  continuity: ContinuityDocument;
  scenes: Scene[];
  finalVideoUrl?: string;
  finalVideoDuration?: number;
  finalVideoSizeBytes?: number;
  status: JobStatus;
  currentJobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  type: 'full_project' | 'single_scene' | 'storyboard_only' | 'render_only';
  targetSceneId?: string;
  status: JobStatus;
  stageMessage: string;
  progressPercent: number;
  totalScenes: number;
  completedScenes: number;
  currentSceneIndex: number;
  providerId: string;
  modelId: string;
  error?: string;
  logs: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ModelCapability {
  id: string;
  name: string;
  providerId: string;
  providerName: string;
  supportsTextToVideo: boolean;
  supportsImageToVideo: boolean;
  supportsFirstLastFrame: boolean;
  supportsReferenceImages: boolean;
  supportsNativeAudio: boolean;
  maxClipDurationSeconds: number;
  supportedAspectRatios: AspectRatio[];
  supportedResolutions: Resolution[];
  isConfigured: boolean;
  isSelfHosted: boolean;
  pricingDescription: string;
  rateLimitDescription: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  apiKey?: string;
  apiEndpoint?: string;
  enabled: boolean;
  mode: 'api' | 'self-hosted';
  hasKeyConfigured?: boolean;
  maskedKey?: string;
  models: ModelCapability[];
}

export interface Asset {
  id: string;
  projectId?: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'subtitle';
  url: string;
  sizeBytes: number;
  mimeType: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
