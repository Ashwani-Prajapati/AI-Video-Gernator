import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Play,
  Layers,
  Wand2,
  ChevronDown,
  ChevronUp,
  Camera,
  Film,
  Music,
  User,
  MapPin,
  Clock,
  RotateCcw,
  Check,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import type {
  AspectRatio,
  CameraMovement,
  ModelCapability,
  Resolution,
  VideoDuration,
  VideoStyle,
} from '../types';

interface TextToVideoPageProps {
  models: ModelCapability[];
  initialPrompt?: string;
  initialDuration?: VideoDuration;
  onStartGeneration: (params: any) => void;
  onGenerateStoryboard: (params: any) => Promise<any>;
}

const STYLE_PRESETS: Array<{ id: VideoStyle; name: string; desc: string; icon: string }> = [
  { id: 'cinematic-realism', name: 'Cinematic Realism', desc: '35mm film grain, anamorphic lens flares, photorealistic lighting', icon: '🎬' },
  { id: '3d-animation', name: '3D Animation', desc: 'Pixar / Dreamworks fidelity, expressive character emotion, vibrant colors', icon: '✨' },
  { id: 'anime', name: 'Anime Masterpiece', desc: 'Makoto Shinkai style, hand-drawn aesthetic, luminous skies', icon: '🌸' },
  { id: 'sci-fi', name: 'Sci-Fi Cyberpunk', desc: 'Neon volumetric fog, holographic interfaces, high-tech vehicles', icon: '🚀' },
  { id: 'fantasy', name: 'Epic Fantasy', desc: 'Mythical landscapes, magical particle bioluminescence, ancient relics', icon: '🐉' },
  { id: 'cartoon', name: 'Modern Cartoon', desc: 'Stylized 2D/3D hybrid animation with punchy frame pacing', icon: '🎨' },
  { id: 'documentary', name: 'Documentary', desc: 'National Geographic cinematography, raw natural lighting, wide lenses', icon: '🌍' },
  { id: 'nature', name: 'Macro Nature', desc: 'Extreme macro botanical details, gentle wind, shallow depth of field', icon: '🌿' },
  { id: 'product-ad', name: 'Commercial & Product', desc: 'High-speed studio lighting, dynamic camera reveals, sleek gloss', icon: '💎' },
  { id: 'horror', name: 'Psychological Horror', desc: 'Low-key shadows, desaturated tones, eerie atmospheric tension', icon: '🌑' },
];

const CAMERA_OPTIONS: Array<{ id: CameraMovement; name: string }> = [
  { id: 'tracking-shot', name: 'Tracking Dolly' },
  { id: 'zoom-in', name: 'Slow Push In' },
  { id: 'zoom-out', name: 'Epic Pull Out' },
  { id: 'pan-right', name: 'Pan Right' },
  { id: 'pan-left', name: 'Pan Left' },
  { id: 'tilt-up', name: 'Tilt Up' },
  { id: 'tilt-down', name: 'Tilt Down' },
  { id: 'orbit', name: 'Orbit 360°' },
  { id: 'drone-fpv', name: 'FPV Drone Glide' },
  { id: 'static', name: 'Locked-off Static' },
];

export const TextToVideoPage: React.FC<TextToVideoPageProps> = ({
  models,
  initialPrompt = '',
  initialDuration = 60,
  onStartGeneration,
  onGenerateStoryboard,
}) => {
  const [prompt, setPrompt] = useState(
    initialPrompt ||
      'Create a cinematic 3D animated film about two cute chemical element beings falling in love in a colorful science laboratory. Use expressive characters, smooth camera movements, realistic lighting, detailed textures, and a heartwarming ending.'
  );
  const [negativePrompt, setNegativePrompt] = useState('blurry, jittery, distorted faces, watermark, low resolution, bad anatomy');
  const [showNegative, setShowNegative] = useState(false);

  // Settings
  const [totalDuration, setTotalDuration] = useState<VideoDuration>(initialDuration);
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>('3d-animation');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [cameraMovement, setCameraMovement] = useState<CameraMovement>('tracking-shot');
  const [motionIntensity, setMotionIntensity] = useState<number>(7);
  const [selectedModelId, setSelectedModelId] = useState<string>('pollinations-video');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(0.35);
  const [narrationVolume, setNarrationVolume] = useState<number>(0.85);
  const [burnSubtitles, setBurnSubtitles] = useState(true);

  // Storyboard Preview State
  const [isPlanning, setIsPlanning] = useState(false);
  const [storyboardPlan, setStoryboardPlan] = useState<any | null>(null);

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];

  const handleEnhancePrompt = () => {
    const enhanced = `Masterpiece cinematic ${selectedStyle}. ${prompt.trim()} Ultra-detailed 8K composition, volumetric illumination, anamorphic bokeh, photorealistic physical shading, rich dynamic color grade.`;
    setPrompt(enhanced);
  };

  const handlePlanStoryboard = async () => {
    if (!prompt.trim()) return;
    setIsPlanning(true);
    try {
      const res = await onGenerateStoryboard({
        prompt,
        totalDuration,
        style: selectedStyle,
        cameraDefault: cameraMovement,
        language,
      });
      if (res && res.plan) {
        setStoryboardPlan(res.plan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleStartProduction = () => {
    onStartGeneration({
      prompt,
      targetTotalDuration: totalDuration,
      aspectRatio,
      resolution,
      visualStyle: selectedStyle,
      cameraMovementDefault: cameraMovement,
      motionIntensityDefault: motionIntensity,
      providerId: selectedModel?.providerId || 'procedural',
      modelId: selectedModel?.id || 'procedural-cinematic',
      narrationLanguage: language,
      scenes: storyboardPlan?.scenes,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
      {/* Center Left Workspace (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Main Prompt Card */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <label className="text-sm font-bold text-white font-display">Prompt & Concept Director</label>
            </div>
            <button
              onClick={handleEnhancePrompt}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-colors cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AI Enhance</span>
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Describe the entire story in natural language... e.g. Two chemical elements falling in love in a colorful science lab..."
            className="w-full bg-[#070912]/90 border border-white/[0.1] rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 resize-none leading-relaxed"
          />

          {/* Negative Prompt toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowNegative(!showNegative)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <span>Negative Prompt & Exclusions</span>
              {showNegative ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showNegative && (
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to exclude (e.g. blurry, deformed, text, low quality)..."
                className="mt-2 w-full bg-[#070912]/80 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            )}
          </div>

          {/* Quick Example Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">Quick Starters:</span>
            {[
              'Chemical Elements in Love',
              'Cyberpunk Rooftop Chase',
              'Cute Robot Gardening',
              'Deep Abyss Bioluminescence',
            ].map((starter, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(`Create a cinematic video about ${starter.toLowerCase()} with photorealistic textures, dynamic camera motion, and vivid lighting.`)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-slate-300 border border-white/[0.06] transition-colors"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Selection (45s, 50s, 55s, 60s) */}
        <div className="glass-panel p-6 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Film Duration Architecture</span>
            </h3>
            <span className="text-xs text-purple-300 font-mono">
              Auto-partitioned into {Math.ceil(totalDuration / 7.5)} scenes
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([45, 50, 55, 60] as VideoDuration[]).map((dur) => {
              const sceneCount = Math.ceil(dur / 7.5);
              const isSelected = totalDuration === dur;
              return (
                <button
                  type="button"
                  key={dur}
                  onClick={() => setTotalDuration(dur)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500/50 shadow-md shadow-purple-500/10'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-bold text-white font-display">{dur}s</span>
                    {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400">{sceneCount} Model Scenes</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">~7.5s per scene</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Style Selection Grid */}
        <div className="glass-panel p-6 rounded-3xl space-y-3">
          <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
            <Film className="w-4 h-4 text-cyan-400" />
            <span>Visual Art Direction</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {STYLE_PRESETS.map((style) => {
              const isSelected = selectedStyle === style.id;
              return (
                <button
                  type="button"
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/50 shadow-sm shadow-indigo-500/10'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="text-2xl mb-2">{style.icon}</div>
                  <div>
                    <div className="text-xs font-bold text-white truncate">{style.name}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{style.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Storyboard Planner & Continuity Section */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Scene Storyboard & Continuity Plan</span>
              </h3>
              <p className="text-xs text-slate-400">
                Preview character appearances, camera instructions, and narrative acts before generation
              </p>
            </div>
            <button
              type="button"
              onClick={handlePlanStoryboard}
              disabled={isPlanning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPlanning ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Planning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{storyboardPlan ? 'Regenerate Plan' : 'Generate Storyboard Plan'}</span>
                </>
              )}
            </button>
          </div>

          {storyboardPlan ? (
            <div className="space-y-4 pt-2">
              {/* Continuity Highlights */}
              {storyboardPlan.continuity?.characters?.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                    <User className="w-3.5 h-3.5" />
                    <span>Locked Character Continuity:</span>
                    <span className="text-white font-bold">{storyboardPlan.continuity.characters[0].name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {storyboardPlan.continuity.characters[0].appearance}
                  </p>
                </div>
              )}

              {/* Storyboard Scenes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {storyboardPlan.scenes.map((scene: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#070912]/60 border border-white/[0.06] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span className="truncate">{scene.title}</span>
                      <span className="text-[10px] text-purple-400 font-mono shrink-0 ml-2">
                        {scene.targetDuration}s
                      </span>
                    </div>
                    <textarea
                      value={scene.prompt}
                      onChange={(e) => {
                        const updated = [...storyboardPlan.scenes];
                        updated[idx].prompt = e.target.value;
                        setStoryboardPlan({ ...storyboardPlan, scenes: updated });
                      }}
                      rows={2}
                      className="w-full bg-black/40 border border-white/[0.06] rounded-lg p-2 text-[11px] text-slate-300 resize-none focus:outline-none focus:border-purple-500/40"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Camera: {scene.cameraMovement}</span>
                      <span className="text-purple-300">Narration: "{scene.narrationText?.slice(0, 20)}..."</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-white/[0.01] border border-dashed border-white/[0.08]">
              <p className="text-xs text-slate-400">
                Click "Generate Storyboard Plan" to inspect the {Math.ceil(totalDuration / 7.5)}-scene breakdown prior to launching, or launch directly below to auto-plan and render in one click!
              </p>
            </div>
          )}
        </div>

        {/* Prominent Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleStartProduction}
            className="w-full py-4 rounded-2xl gradient-button text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-purple-600/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5 fill-white/20" />
            <span>Generate Complete {totalDuration}-Second Film Now</span>
          </button>
        </div>
      </div>

      {/* Right Settings Panel (4 cols) */}
      <div className="lg:col-span-4 space-y-5">
        <div className="glass-panel p-6 rounded-3xl space-y-5 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Render Engine & Settings</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              No Credit Cap
            </span>
          </div>

          {/* AI Provider & Model Selection */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>AI Video Provider</span>
                {selectedModel?.isConfigured && (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {selectedModel.providerId === 'pollinations' || selectedModel.providerId === 'procedural' ? 'Free / Ready' : 'Key Ready'}
                  </span>
                )}
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-[#070912] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/60"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} {model.providerId === 'pollinations' ? '★ (Free & Unlimited)' : model.isSelfHosted ? '(Local/Free)' : model.isConfigured ? '(Key Configured)' : '(Needs API Key)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider Status Details */}
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Pricing Model:</span>
                <span className="text-purple-300 font-medium">{selectedModel?.pricingDescription}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Rate Limits:</span>
                <span className="text-slate-300 font-mono text-[10px]">{selectedModel?.rateLimitDescription}</span>
              </div>
            </div>

            {/* Quota Notice if Google is selected */}
            {selectedModel?.providerId === 'google' && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <span>⚠️ Google Quota Notice</span>
                </div>
                <p className="text-[10px] text-amber-200/90 leading-relaxed">
                  Google AI Studio Free Tier has strict daily quotas. If you see <em>"Individual quota reached"</em>, switch to <strong>Pollinations AI</strong> (Free) or <strong>Built-in Engine</strong> to continue generating instantly.
                </p>
              </div>
            )}
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Aspect Ratio</label>
            <div className="grid grid-cols-4 gap-2">
              {(['16:9', '9:16', '1:1', '21:9'] as AspectRatio[]).map((ar) => (
                <button
                  type="button"
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    aspectRatio === ar
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Export Resolution</label>
            <div className="grid grid-cols-3 gap-2">
              {(['720p', '1080p', '4k'] as Resolution[]).map((res) => (
                <button
                  type="button"
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    resolution === res
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Movement */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              <span>Camera Motion Cadence</span>
            </label>
            <select
              value={cameraMovement}
              onChange={(e) => setCameraMovement(e.target.value as CameraMovement)}
              className="w-full bg-[#070912] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/60"
            >
              {CAMERA_OPTIONS.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.name}
                </option>
              ))}
            </select>
          </div>

          {/* Motion Intensity Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Motion Dynamic Range</span>
              <span className="font-mono text-purple-300 font-bold">{motionIntensity} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={motionIntensity}
              onChange={(e) => setMotionIntensity(parseInt(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Audio & Narration Options */}
          <div className="space-y-3 pt-3 border-t border-white/[0.08]">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audio & Multilingual Narration</span>
            </h4>

            {/* Language Picker */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Narration Language</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    language === 'en'
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50'
                      : 'bg-white/[0.04] text-slate-400'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    language === 'hi'
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50'
                      : 'bg-white/[0.04] text-slate-400'
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
              </div>
            </div>

            {/* Music volume */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Background Soundtrack</span>
                <span>{Math.round(bgMusicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgMusicVolume}
                onChange={(e) => setBgMusicVolume(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Subtitles check */}
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={burnSubtitles}
                onChange={(e) => setBurnSubtitles(e.target.checked)}
                className="rounded accent-purple-500"
              />
              <span>Burn Subtitles / Captions to Video</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
