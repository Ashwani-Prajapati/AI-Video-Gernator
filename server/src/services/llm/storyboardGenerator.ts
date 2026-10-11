import { v4 as uuidv4 } from 'uuid';
import type {
  CameraMovement,
  CharacterContinuity,
  ContinuityDocument,
  EnvironmentContinuity,
  Scene,
  TransitionType,
  VideoDuration,
  VideoStyle,
} from '../../types/index.js';

interface StoryboardPlan {
  enhancedPrompt: string;
  continuity: ContinuityDocument;
  scenes: Array<{
    title: string;
    prompt: string;
    targetDuration: number;
    cameraMovement: CameraMovement;
    motionIntensity: number;
    narrationText: string;
    transitionToNext: TransitionType;
  }>;
}

export class StoryboardGenerator {
  /**
   * Generates a coherent multi-scene storyboard plan tailored to exact duration (45s, 50s, 55s, 60s)
   * with complete character continuity, lighting specs, and camera directions.
   */
  public static async planProject(options: {
    prompt: string;
    totalDuration: VideoDuration;
    style: VideoStyle;
    cameraDefault: CameraMovement;
    maxClipDuration?: number;
    language?: 'en' | 'hi';
  }): Promise<StoryboardPlan> {
    const totalSecs = options.totalDuration || 60;
    const clipLimit = options.maxClipDuration || 8;

    // Calculate optimal number of scenes
    // E.g. for 60s: 8 scenes of 7.5s (or 6 scenes of 10s)
    let numScenes = Math.ceil(totalSecs / clipLimit);
    if (numScenes < 6) numScenes = 6;
    if (numScenes > 10) numScenes = 10;
    const durationPerScene = parseFloat((totalSecs / numScenes).toFixed(2));

    const promptLower = options.prompt.toLowerCase();

    // Check if user has Gemini API configured for advanced LLM reasoning
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (geminiKey) {
      try {
        const llmResult = await this.generateWithGemini(
          options.prompt,
          totalSecs,
          numScenes,
          options.style,
          options.language || 'en',
          geminiKey
        );
        if (llmResult) return llmResult;
      } catch (err) {
        console.warn('Gemini LLM storyboarding failed, using cinematic director engine:', err);
      }
    }

    // High-intelligence Algorithmic Filmmaking Storyboard Engine
    return this.generateAlgorithmicStoryboard(options, totalSecs, numScenes, durationPerScene);
  }

  private static async generateWithGemini(
    prompt: string,
    totalDuration: number,
    numScenes: number,
    style: VideoStyle,
    language: string,
    apiKey: string
  ): Promise<StoryboardPlan | null> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const systemPrompt = `You are an elite cinematic Hollywood director and AI filmmaker. Break down the following video concept into a cohesive ${numScenes}-scene storyboard for a total duration of ${totalDuration} seconds.
Visual style: ${style}. Narration language: ${language}.
Return strictly valid JSON matching this schema:
{
  "enhancedPrompt": "detailed expanded visual concept",
  "characters": [{"name": "string", "appearance": "string", "clothing": "string", "facialFeatures": "string", "colorPalette": "string"}],
  "environments": [{"name": "string", "locationType": "string", "lighting": "string", "artDirection": "string", "colorMood": "string"}],
  "generalArtDirection": "string",
  "scenes": [
    {
      "title": "Scene 1: Title",
      "prompt": "Highly detailed visual description with camera movement, subject action, lighting and style",
      "cameraMovement": "pan-left" | "pan-right" | "zoom-in" | "zoom-out" | "tracking-shot" | "orbit",
      "motionIntensity": 6,
      "narrationText": "Voiceover sentence",
      "transitionToNext": "crossfade" | "cut"
    }
  ]
}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Concept: "${prompt}"` }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    const durationPerScene = parseFloat((totalDuration / (parsed.scenes?.length || numScenes)).toFixed(2));

    return {
      enhancedPrompt: parsed.enhancedPrompt || prompt,
      continuity: {
        characters: (parsed.characters || []).map((c: any) => ({ ...c, id: uuidv4() })),
        environments: (parsed.environments || []).map((e: any) => ({ ...e, id: uuidv4() })),
        generalArtDirection: parsed.generalArtDirection || `${style} aesthetic, cinematic lighting, 8k resolution`,
        lightingAtmosphere: 'Consistent cinematic lighting matching visual style',
        colorGrading: 'Curated 35mm cinematic color palette',
        timelineChronology: `Sequential story from 0s to ${totalDuration}s`,
      },
      scenes: (parsed.scenes || []).map((s: any) => ({
        title: s.title,
        prompt: s.prompt,
        targetDuration: durationPerScene,
        cameraMovement: s.cameraMovement || 'tracking-shot',
        motionIntensity: s.motionIntensity || 6,
        narrationText: s.narrationText || '',
        transitionToNext: s.transitionToNext || 'crossfade',
      })),
    };
  }

  private static generateAlgorithmicStoryboard(
    options: {
      prompt: string;
      totalDuration: VideoDuration;
      style: VideoStyle;
      cameraDefault: CameraMovement;
      language?: 'en' | 'hi';
    },
    totalSecs: number,
    numScenes: number,
    durationPerScene: number
  ): StoryboardPlan {
    const isHindi = options.language === 'hi';
    const cleanPrompt = options.prompt.trim();

    // Determine characters based on prompt keywords
    const characterName = cleanPrompt.includes('chemical')
      ? 'Aura & Vance (Element Beings)'
      : cleanPrompt.includes('girl') || cleanPrompt.includes('woman')
        ? 'Elena (Protagonist)'
        : cleanPrompt.includes('man') || cleanPrompt.includes('boy')
          ? 'Kael (Protagonist)'
          : 'The Wanderer';

    const character: CharacterContinuity = {
      id: uuidv4(),
      name: characterName,
      appearance: `Striking, expressive design matching ${options.style} aesthetic. High emotional resonance.`,
      clothing: 'Tailored attire matching the world setting with signature accent colors.',
      facialFeatures: 'Expressive eyes, distinct facial silhouette, consistent lighting highlights.',
      colorPalette: 'Luminous cyan, deep indigo, warm amber highlights.',
      voiceDescription: isHindi
        ? 'Warm, expressive, cinematic Hindi narrator.'
        : 'Warm, resonant cinematic voice with steady pacing.',
    };

    const environment: EnvironmentContinuity = {
      id: uuidv4(),
      name: 'Primary World Stage',
      locationType: 'Vivid cinematic environment reflecting narrative atmosphere.',
      lighting: 'Volumetric god rays, atmospheric haze, harmonious key and fill lighting.',
      artDirection: `${options.style} masterclass cinematography, 8k textures, realistic reflections.`,
      colorMood: 'Deep charcoal shadows with rich, vibrant cinematic highlights.',
    };

    const continuity: ContinuityDocument = {
      characters: [character],
      environments: [environment],
      generalArtDirection: `Consistent ${options.style} visual identity, ultra-detailed textures, smooth cinematic framerate.`,
      lightingAtmosphere: 'Physically accurate lighting with subtle volumetric haze and lens flares.',
      colorGrading: 'Rich balanced cinematic LUT with film-grade grain.',
      timelineChronology: `Continuous story timeline across ${numScenes} scenes (${totalSecs} seconds total).`,
    };

    // Standard Narrative 3-Act Structure broken down across scenes:
    // 1: Establishing / Exposition
    // 2: Inciting Spark
    // 3: Rising Tension / Discovery
    // 4: Development / Interaction
    // 5: Turning Point
    // 6: Dramatic Climax
    // 7: Climax Aftermath
    // 8: Resolution / Final Reveal
    const narrativeBeats = [
      {
        act: 'Establishing the World',
        camera: 'zoom-in' as CameraMovement,
        enNarration: 'Every story begins with a subtle spark waiting to awaken.',
        hiNarration: 'हर कहानी की शुरुआत एक अनोखी चिंगारी से होती है।',
      },
      {
        act: 'The First Discovery',
        camera: 'pan-right' as CameraMovement,
        enNarration: 'An unexpected rhythm pulses through the atmosphere.',
        hiNarration: 'हवा में एक अनदेखी तरंग दौड़ने लगती है।',
      },
      {
        act: 'Unfolding Connection',
        camera: 'tracking-shot' as CameraMovement,
        enNarration: 'Boundaries blur as curiosity pulls two worlds together.',
        hiNarration: 'जिज्ञासा दो अलग दुनियाओं को करीब ले आती है।',
      },
      {
        act: 'Rising Momentum',
        camera: 'orbit' as CameraMovement,
        enNarration: 'Energy gathers, illuminating every hidden detail.',
        hiNarration: 'ऊर्जा का प्रवाह तेज होता है और हर अंधेरा कोना चमक उठता है।',
      },
      {
        act: 'The Pivotal Moment',
        camera: 'zoom-in' as CameraMovement,
        enNarration: 'A single moment changes the course of everything.',
        hiNarration: 'एक पल पूरे सफर की दिशा बदल देता है।',
      },
      {
        act: 'The Climax Unfolds',
        camera: 'tracking-shot' as CameraMovement,
        enNarration: 'All elements collide in a breathtaking symphony of light.',
        hiNarration: 'सभी तत्व मिलकर रोशनी का एक अद्भुत संगम बनाते हैं।',
      },
      {
        act: 'The Resonating Echo',
        camera: 'tilt-up' as CameraMovement,
        enNarration: 'The silence that follows carries the warmth of transformation.',
        hiNarration: 'इस बदलाव की गूंज चारों ओर फैल जाती है।',
      },
      {
        act: 'The Final Vista',
        camera: 'zoom-out' as CameraMovement,
        enNarration: 'A new chapter dawns, vibrant and unforgettable.',
        hiNarration: 'और एक नए, खूबसूरत सफर का आगाज़ होता है।',
      },
    ];

    const scenes = Array.from({ length: numScenes }).map((_, index) => {
      const beat = narrativeBeats[index % narrativeBeats.length];
      const cameraMove = beat.camera;
      const motionIntensity = 5 + (index % 4);

      return {
        title: `Scene ${index + 1}: ${beat.act}`,
        prompt: `${options.prompt}. Act ${index + 1}: ${beat.act}. Camera movement: ${cameraMove}. Style: ${options.style}. High cinematic fidelity, ${character.name} in focus with consistent appearance (${character.appearance}), volumetric lighting, photorealistic textures.`,
        targetDuration: durationPerScene,
        cameraMovement: cameraMove,
        motionIntensity,
        narrationText: isHindi ? beat.hiNarration : beat.enNarration,
        transitionToNext: (index === numScenes - 1 ? 'cut' : 'crossfade') as TransitionType,
      };
    });

    return {
      enhancedPrompt: `Cinematic ${options.style} masterpiece. ${options.prompt}. Master composition, volumetric illumination, 8K resolution, photorealistic rendering with rich dynamic range.`,
      continuity,
      scenes,
    };
  }
}
