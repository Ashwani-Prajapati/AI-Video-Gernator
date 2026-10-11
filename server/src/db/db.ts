import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';
import type {
  Asset,
  CharacterContinuity,
  GenerationJob,
  ModelCapability,
  Project,
  ProviderConfig,
  Scene,
} from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'vividflow_db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseState {
  projects: Project[];
  scenes: Scene[];
  characters: CharacterContinuity[];
  assets: Asset[];
  jobs: GenerationJob[];
  providers: ProviderConfig[];
}

const DEFAULT_MODELS: ModelCapability[] = [
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
    pricingDescription: 'Google Cloud Vertex AI Pricing ($0.08 - $0.20 per clip)',
    rateLimitDescription: 'Standard Cloud Quota (10 QPM)',
  },
  {
    id: 'sora-turbo',
    name: 'OpenAI Sora Turbo',
    providerId: 'openai',
    providerName: 'OpenAI',
    supportsTextToVideo: true,
    supportsImageToVideo: true,
    supportsFirstLastFrame: true,
    supportsReferenceImages: true,
    supportsNativeAudio: false,
    maxClipDurationSeconds: 10,
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedResolutions: ['720p', '1080p'],
    isConfigured: false,
    isSelfHosted: false,
    pricingDescription: 'OpenAI API Token & Video Compute Pricing',
    rateLimitDescription: 'Tier 3/4 API Rate Limits',
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
    name: 'VividFlow Procedural High-Def Engine (Immediate Playable)',
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
    pricingDescription: 'Free & Local (Zero API keys required for development)',
    rateLimitDescription: 'Instant generation & assembly',
  },
];

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'pollinations',
    name: 'Pollinations AI (Free Video Generator)',
    enabled: true,
    mode: 'api',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'pollinations'),
  },
  {
    id: 'google',
    name: 'Google Video AI (Veo 2 / Gemini)',
    enabled: true,
    mode: 'api',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'google'),
  },
  {
    id: 'openai',
    name: 'OpenAI (Sora & GPT-4o Scripting)',
    enabled: true,
    mode: 'api',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'openai'),
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
  {
    id: 'procedural',
    name: 'VividFlow Built-in Engine',
    enabled: true,
    mode: 'self-hosted',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'procedural'),
  },
];

class Database {
  private state: DatabaseState = {
    projects: [],
    scenes: [],
    characters: [],
    assets: [],
    jobs: [],
    providers: DEFAULT_PROVIDERS,
  };

  constructor() {
    this.load();
    if (this.state.projects.length === 0) {
      this.seedInitialProject();
    }
  }

  private load(): void {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.state = {
          projects: parsed.projects || [],
          scenes: parsed.scenes || [],
          characters: parsed.characters || [],
          assets: parsed.assets || [],
          jobs: parsed.jobs || [],
          providers: DEFAULT_PROVIDERS.map((dp) => {
            const existing = (parsed.providers || []).find((p: any) => p.id === dp.id);
            return existing ? { ...dp, ...existing, models: dp.models } : dp;
          }),
        };
      } catch (err) {
        console.error('Failed to parse database file, initializing clean state:', err);
      }
    }
  }

  private persist(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  private seedInitialProject(): void {
    const projectId = uuidv4();
    const demoProject: Project = {
      id: projectId,
      name: 'The Alchemist of Neon City (60s Cinematic)',
      description:
        'A cinematic cyberpunk story about a synth-chemist discovering a hidden luminous molecule that revitalizes a mechanical world.',
      originalPrompt:
        'A cinematic 3D animated video about a rogue synth-chemist discovering a glowing bioluminescent liquid in a rainy cybernetic alleyway. Detailed textures, volumetric rain, anamorphic lens flares, expressive characters, and a dramatic climax.',
      enhancedPrompt:
        'Masterpiece 8k cinematic 3D render, cyberpunk metropolis night rain, anamorphic bokeh, bioluminescent blue-gold elixirs, highly detailed character with brass goggles and distressed leather duster, volumetric neon fog, smooth dynamic gimbal camera.',
      settings: {
        targetTotalDuration: 60,
        aspectRatio: '16:9',
        resolution: '1080p',
        visualStyle: 'cinematic-realism',
        cameraMovementDefault: 'tracking-shot',
        motionIntensityDefault: 7,
        modelId: 'procedural-cinematic',
        providerId: 'procedural',
        fps: 30,
        includeAudio: true,
        narrationVoice: 'en-US-Neural',
        narrationLanguage: 'en',
        bgMusicGenre: 'cyberpunk-ambient',
        bgMusicVolume: 0.35,
        narrationVolume: 0.85,
        burnSubtitles: true,
      },
      continuity: {
        characters: [
          {
            id: uuidv4(),
            name: 'Kaelen (Synth-Chemist)',
            appearance: 'Mid-20s, sharp features, silver-streaked dark hair, luminous amber cybernetic right eye.',
            clothing: 'Distressed charcoal weather-proof duster coat, bronze-trimmed mechanical gauntlet on left arm.',
            facialFeatures: 'Subtle neon cyber-liner along cheekbones, determined expression.',
            colorPalette: 'Obsidian, bronze, amber, and vibrant electric teal.',
            voiceDescription: 'Deep, calm, reflective narrator with slight gravel.',
          },
        ],
        environments: [
          {
            id: uuidv4(),
            name: 'District 9 Neon Alleyway',
            locationType: 'Cyberpunk back-alley drenched in perpetual rain.',
            lighting: 'Soft overhead magenta & cyan neon signs reflecting on wet asphalt.',
            artDirection: 'Blade Runner meets Arcane, high volumetric atmospheric haze.',
            colorMood: 'Deep blues and blacks with piercing cyan bioluminescence.',
          },
        ],
        generalArtDirection: 'High dynamic range, cinematic 35mm film grain, 24fps motion cadence.',
        lightingAtmosphere: 'High contrast wet reflections, volumetric smoke, glowing chemical liquids.',
        colorGrading: 'Teal and orange cinematic grade with crushed darks and rich highlights.',
        timelineChronology: 'Continuous chronological sequence from 0:00 to 1:00.',
      },
      scenes: [],
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 8 scenes for complete 60 seconds (7.5s each)
    const scenePrompts = [
      {
        title: 'Scene 1: Midnight Downpour in Sector 7',
        prompt:
          'High angle tracking shot of Kaelen walking through a narrow rain-slicked neon alley, rain splashing on chrome puddles, neon signs flickering.',
        camera: 'tracking-shot',
        duration: 7.5,
        narration: 'In the lower decks of Sector 7, rain washed away everything except secrets.',
      },
      {
        title: 'Scene 2: The Mysterious Signal',
        prompt:
          'Over-the-shoulder shot as Kaelen pauses near a rusted power conduit. His cybernetic eye activates with a faint azure pulse.',
        camera: 'zoom-in',
        duration: 7.5,
        narration: 'A faint chemical frequency hummed beneath the iron grates.',
      },
      {
        title: 'Scene 3: Unveiling the Vial',
        prompt:
          'Extreme close up of mechanical bronze gauntlet prying open a steel maintenance hatch to reveal an ancient glass vial glowing with swirling liquid light.',
        camera: 'tilt-down',
        duration: 7.5,
        narration: 'Not synthetic fuel. Pure, unrefined bioluminescence.',
      },
      {
        title: 'Scene 4: The Chemical Reaction',
        prompt:
          'Macro shot of the luminous liquid swirling inside the glass vial, emitting tiny floating particles of light that illuminate Kaelen’s goggles.',
        camera: 'orbit',
        duration: 7.5,
        narration: 'One drop could spark life into a million dead circuits.',
      },
      {
        title: 'Scene 5: Approaching Patrol Drones',
        prompt:
          'Dutch angle medium shot looking up as red searchlights sweep over the rooftops, police surveillance drones hovering in the misty storm.',
        camera: 'pan-left',
        duration: 7.5,
        narration: 'The Corporate Syndicate had detected the harmonic pulse.',
      },
      {
        title: 'Scene 6: The Decisive Moment',
        prompt:
          'Close up on Kaelen’s face as he secures the vial into his insulated chest harness, jaw clenched with quiet defiance.',
        camera: 'static',
        duration: 7.5,
        narration: 'There was no turning back now.',
      },
      {
        title: 'Scene 7: Rooftop Escape',
        prompt:
          'Dynamic low angle running shot as Kaelen sprints across wet steel catwalks, blue sparks arcing behind him into the torrential storm.',
        camera: 'tracking-shot',
        duration: 7.5,
        narration: 'Into the storm, carrying the single spark that could rewrite the future.',
      },
      {
        title: 'Scene 8: Skyline Revelation',
        prompt:
          'Epic wide cinematic shot of Kaelen standing at the precipice of a high skyscraper looking over the sprawling neon metropolis, dawn breaking behind the smog.',
        camera: 'zoom-out',
        duration: 7.5,
        narration: 'The city was cold. But tonight, it would remember how to breathe.',
      },
    ];

    const scenes: Scene[] = scenePrompts.map((s, idx) => ({
      id: uuidv4(),
      projectId,
      orderIndex: idx,
      title: s.title,
      prompt: s.prompt,
      targetDuration: s.duration,
      actualDuration: s.duration,
      cameraMovement: s.camera as any,
      motionIntensity: 7,
      status: 'completed',
      narrationText: s.narration,
      transitionToNext: idx === scenePrompts.length - 1 ? 'cut' : 'crossfade',
      generationAttempts: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    demoProject.scenes = scenes;
    this.state.projects.push(demoProject);
    this.state.scenes.push(...scenes);
    this.persist();
  }

  // --- Projects ---
  public getProjects(): Project[] {
    return this.state.projects;
  }

  public getProjectById(id: string): Project | undefined {
    return this.state.projects.find((p) => p.id === id);
  }

  public createProject(projectData: Partial<Project>): Project {
    const id = projectData.id || uuidv4();
    const newProject: Project = {
      id,
      name: projectData.name || 'Untitled Video Project',
      description: projectData.description || '',
      originalPrompt: projectData.originalPrompt || '',
      enhancedPrompt: projectData.enhancedPrompt || '',
      settings: projectData.settings || {
        targetTotalDuration: 60,
        aspectRatio: '16:9',
        resolution: '1080p',
        visualStyle: 'cinematic-realism',
        cameraMovementDefault: 'pan-right',
        motionIntensityDefault: 6,
        modelId: 'procedural-cinematic',
        providerId: 'procedural',
        fps: 30,
        includeAudio: true,
        narrationVoice: 'en-US-Neural',
        narrationLanguage: 'en',
        bgMusicVolume: 0.3,
        narrationVolume: 0.8,
        burnSubtitles: true,
      },
      continuity: projectData.continuity || {
        characters: [],
        environments: [],
        generalArtDirection: 'Consistent cinematic photography, photorealistic lighting',
        lightingAtmosphere: 'Natural high-contrast lighting',
        colorGrading: 'Cinematic balance',
        timelineChronology: 'Sequential linear narrative',
      },
      scenes: projectData.scenes || [],
      status: projectData.status || 'queued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.projects.unshift(newProject);
    this.persist();
    return newProject;
  }

  public updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const idx = this.state.projects.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    this.state.projects[idx] = {
      ...this.state.projects[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.state.projects[idx];
  }

  public deleteProject(id: string): boolean {
    const initialLen = this.state.projects.length;
    this.state.projects = this.state.projects.filter((p) => p.id !== id);
    this.state.scenes = this.state.scenes.filter((s) => s.projectId !== id);
    this.state.jobs = this.state.jobs.filter((j) => j.projectId !== id);
    this.persist();
    return this.state.projects.length < initialLen;
  }

  public duplicateProject(id: string): Project | undefined {
    const original = this.getProjectById(id);
    if (!original) return undefined;

    const newId = uuidv4();
    const clonedScenes: Scene[] = original.scenes.map((s) => ({
      ...s,
      id: uuidv4(),
      projectId: newId,
      status: 'pending',
      videoUrl: undefined,
      thumbnailUrl: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const clonedProject: Project = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      scenes: clonedScenes,
      finalVideoUrl: undefined,
      status: 'queued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.projects.unshift(clonedProject);
    this.state.scenes.push(...clonedScenes);
    this.persist();
    return clonedProject;
  }

  // --- Scenes ---
  public getScenes(projectId: string): Scene[] {
    return this.state.scenes
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public getSceneById(id: string): Scene | undefined {
    return this.state.scenes.find((s) => s.id === id);
  }

  public createScene(sceneData: Partial<Scene> & { projectId: string }): Scene {
    const id = sceneData.id || uuidv4();
    const existing = this.getScenes(sceneData.projectId);
    const orderIndex = sceneData.orderIndex !== undefined ? sceneData.orderIndex : existing.length;

    const newScene: Scene = {
      id,
      projectId: sceneData.projectId,
      orderIndex,
      title: sceneData.title || `Scene ${orderIndex + 1}`,
      prompt: sceneData.prompt || '',
      negativePrompt: sceneData.negativePrompt,
      targetDuration: sceneData.targetDuration || 7.5,
      actualDuration: sceneData.actualDuration,
      cameraMovement: sceneData.cameraMovement || 'static',
      motionIntensity: sceneData.motionIntensity || 5,
      status: sceneData.status || 'pending',
      videoUrl: sceneData.videoUrl,
      thumbnailUrl: sceneData.thumbnailUrl,
      narrationText: sceneData.narrationText,
      transitionToNext: sceneData.transitionToNext || 'crossfade',
      generationAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.scenes.push(newScene);

    // Sync with project
    const proj = this.getProjectById(sceneData.projectId);
    if (proj) {
      proj.scenes = this.getScenes(sceneData.projectId);
    }

    this.persist();
    return newScene;
  }

  public updateScene(id: string, updates: Partial<Scene>): Scene | undefined {
    const idx = this.state.scenes.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;

    this.state.scenes[idx] = {
      ...this.state.scenes[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const projId = this.state.scenes[idx].projectId;
    const proj = this.getProjectById(projId);
    if (proj) {
      proj.scenes = this.getScenes(projId);
    }

    this.persist();
    return this.state.scenes[idx];
  }

  public deleteScene(id: string): boolean {
    const scene = this.getSceneById(id);
    if (!scene) return false;

    const projId = scene.projectId;
    this.state.scenes = this.state.scenes.filter((s) => s.id !== id);

    // Reindex remaining scenes
    const remaining = this.getScenes(projId);
    remaining.forEach((s, idx) => {
      s.orderIndex = idx;
    });

    const proj = this.getProjectById(projId);
    if (proj) {
      proj.scenes = remaining;
    }

    this.persist();
    return true;
  }

  public reorderScenes(projectId: string, sceneIds: string[]): Scene[] {
    sceneIds.forEach((id, newIndex) => {
      const scene = this.state.scenes.find((s) => s.id === id && s.projectId === projectId);
      if (scene) {
        scene.orderIndex = newIndex;
        scene.updatedAt = new Date().toISOString();
      }
    });

    const reordered = this.getScenes(projectId);
    const proj = this.getProjectById(projectId);
    if (proj) {
      proj.scenes = reordered;
    }

    this.persist();
    return reordered;
  }

  // --- Characters / Continuity ---
  public addCharacter(projectId: string, char: Omit<CharacterContinuity, 'id'>): CharacterContinuity {
    const proj = this.getProjectById(projectId);
    const newChar: CharacterContinuity = {
      id: uuidv4(),
      ...char,
    };
    if (proj) {
      proj.continuity.characters.push(newChar);
      this.persist();
    }
    return newChar;
  }

  // --- Generation Jobs ---
  public createJob(jobData: Partial<GenerationJob> & { projectId: string }): GenerationJob {
    const id = jobData.id || uuidv4();
    const newJob: GenerationJob = {
      id,
      projectId: jobData.projectId,
      type: jobData.type || 'full_project',
      targetSceneId: jobData.targetSceneId,
      status: 'queued',
      stageMessage: jobData.stageMessage || 'Queued for processing',
      progressPercent: 0,
      totalScenes: jobData.totalScenes || 0,
      completedScenes: 0,
      currentSceneIndex: 0,
      providerId: jobData.providerId || 'procedural',
      modelId: jobData.modelId || 'procedural-cinematic',
      logs: [
        `[${new Date().toLocaleTimeString()}] Generation job registered. Type: ${jobData.type || 'full_project'}`,
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.jobs.unshift(newJob);

    // Link job to project
    const proj = this.getProjectById(jobData.projectId);
    if (proj) {
      proj.currentJobId = id;
      proj.status = 'queued';
    }

    this.persist();
    return newJob;
  }

  public getJob(id: string): GenerationJob | undefined {
    return this.state.jobs.find((j) => j.id === id);
  }

  public updateJob(id: string, updates: Partial<GenerationJob>): GenerationJob | undefined {
    const idx = this.state.jobs.findIndex((j) => j.id === id);
    if (idx === -1) return undefined;

    const currentLogs = this.state.jobs[idx].logs || [];
    let updatedLogs = currentLogs;
    if (updates.logs) {
      updatedLogs = updates.logs;
    } else if (updates.stageMessage && updates.stageMessage !== this.state.jobs[idx].stageMessage) {
      updatedLogs = [
        ...currentLogs,
        `[${new Date().toLocaleTimeString()}] ${updates.stageMessage}`,
      ];
    }

    this.state.jobs[idx] = {
      ...this.state.jobs[idx],
      ...updates,
      logs: updatedLogs,
      updatedAt: new Date().toISOString(),
    };

    // Keep project status synced
    if (updates.status) {
      const proj = this.getProjectById(this.state.jobs[idx].projectId);
      if (proj) {
        proj.status = updates.status;
      }
    }

    this.persist();
    return this.state.jobs[idx];
  }

  public getActiveJobs(): GenerationJob[] {
    return this.state.jobs.filter((j) => ['queued', 'preparing_storyboard', 'generating_scenes', 'rendering_final'].includes(j.status));
  }

  // --- Model Providers & Settings ---
  public getProviders(): ProviderConfig[] {
    return this.state.providers;
  }

  public getModels(): ModelCapability[] {
    const allModels: ModelCapability[] = [];
    this.state.providers.forEach((p) => {
      p.models.forEach((m) => {
        allModels.push({
          ...m,
          isConfigured: p.mode === 'self-hosted' || Boolean(p.apiKey && p.apiKey.length > 5),
        });
      });
    });
    return allModels;
  }

  public updateProviderKey(providerId: string, apiKey: string, endpoint?: string): ProviderConfig | undefined {
    const provider = this.state.providers.find((p) => p.id === providerId);
    if (!provider) return undefined;

    provider.apiKey = apiKey;
    if (endpoint) {
      provider.apiEndpoint = endpoint;
    }
    provider.enabled = true;

    // Update models configured status
    provider.models.forEach((m) => {
      m.isConfigured = Boolean(apiKey && apiKey.length > 5);
    });

    this.persist();
    return provider;
  }

  public setProviderMode(providerId: string, mode: 'api' | 'self-hosted', endpoint?: string): ProviderConfig | undefined {
    const provider = this.state.providers.find((p) => p.id === providerId);
    if (!provider) return undefined;

    provider.mode = mode;
    if (endpoint) {
      provider.apiEndpoint = endpoint;
    }
    this.persist();
    return provider;
  }

  // --- Assets ---
  public getAssets(): Asset[] {
    return this.state.assets;
  }

  public addAsset(assetData: Omit<Asset, 'id' | 'createdAt'>): Asset {
    const asset: Asset = {
      id: uuidv4(),
      ...assetData,
      createdAt: new Date().toISOString(),
    };
    this.state.assets.unshift(asset);
    this.persist();
    return asset;
  }

  public deleteAsset(id: string): boolean {
    const initialLen = this.state.assets.length;
    this.state.assets = this.state.assets.filter((a) => a.id !== id);
    this.persist();
    return this.state.assets.length < initialLen;
  }
}

export const db = new Database();
