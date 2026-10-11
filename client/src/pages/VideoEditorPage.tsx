import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  SlidersHorizontal,
  Sparkles,
  Download,
  Trash2,
  Copy,
  Plus,
  RefreshCw,
  Layers,
  Music,
  MessageSquare,
  Scissors,
  Check,
  ChevronRight,
  Film,
  Camera,
} from 'lucide-react';
import type { CameraMovement, Project, Scene, TransitionType } from '../types';

interface VideoEditorPageProps {
  project: Project | null;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => Promise<any>;
  onDeleteScene: (sceneId: string) => Promise<any>;
  onReorderScenes: (projectId: string, sceneIds: string[]) => Promise<any>;
  onRegenerateScene: (sceneId: string) => Promise<any>;
  onRenderProject: (projectId: string, settings: any) => Promise<any>;
}

export const VideoEditorPage: React.FC<VideoEditorPageProps> = ({
  project,
  onUpdateScene,
  onDeleteScene,
  onReorderScenes,
  onRegenerateScene,
  onRenderProject,
}) => {
  if (!project) {
    return (
      <div className="p-16 text-center text-slate-400">
        <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No Project Selected</h3>
        <p className="text-xs">Please open a project from your library or create a new video.</p>
      </div>
    );
  }

  const [scenes, setScenes] = useState<Scene[]>(project.scenes || []);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    project.scenes?.[0]?.id || ''
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [activeTransition, setActiveTransition] = useState<TransitionType>('crossfade');

  // Audio mix controls
  const [bgMusicVolume, setBgMusicVolume] = useState(project.settings?.bgMusicVolume ?? 0.35);
  const [narrationVolume, setNarrationVolume] = useState(project.settings?.narrationVolume ?? 0.85);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setScenes(project.scenes || []);
    if (!selectedSceneId && project.scenes?.length > 0) {
      setSelectedSceneId(project.scenes[0].id);
    }
  }, [project]);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId) || scenes[0];

  // Total project duration calculated from scenes
  const totalDuration = scenes.reduce(
    (acc, s) => acc + (s.actualDuration || s.targetDuration || 7.5),
    0
  );

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Reordering helpers (move scene left/right)
  const handleMoveScene = async (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const newScenes = [...scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[targetIndex];
    newScenes[targetIndex] = temp;

    setScenes(newScenes);
    await onReorderScenes(
      project.id,
      newScenes.map((s) => s.id)
    );
  };

  // Single scene regeneration
  const handleRegenerate = async (sceneId: string) => {
    try {
      await onRegenerateScene(sceneId);
    } catch (err) {
      console.error(err);
    }
  };

  // Render final video trigger
  const handleRenderFinal = async () => {
    setIsRendering(true);
    try {
      await onRenderProject(project.id, {
        bgMusicVolume,
        narrationVolume,
        transition: activeTransition,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRendering(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Bar with Project Name & Render Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              NLE Studio
            </span>
            <h2 className="text-lg font-bold text-white font-display truncate max-w-md">
              {project.name}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {scenes.length} Scenes • Total Duration: {totalDuration.toFixed(1)}s • Style:{' '}
            {project.settings?.visualStyle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {project.finalVideoUrl && (
            <a
              href={project.finalVideoUrl}
              download={`${project.name}.mp4`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 text-xs font-semibold border border-white/[0.08] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MP4</span>
            </a>
          )}

          <button
            onClick={handleRenderFinal}
            disabled={isRendering}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-button text-white text-xs font-bold shadow-lg shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
          >
            {isRendering ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Rendering Final Video...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Render & Export MP4</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Player & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Preview Player (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="glass-panel p-3 rounded-3xl overflow-hidden bg-black/60 border border-white/[0.1] shadow-2xl">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center group">
              <video
                ref={videoRef}
                src={project.finalVideoUrl || selectedScene?.videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                muted={isMuted}
                className="w-full h-full object-contain"
              />

              {/* Big overlay play button */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-purple-600/80 hover:bg-purple-600 text-white flex items-center justify-center backdrop-blur-md shadow-2xl hover:scale-110 transition-all cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </button>
              )}
            </div>

            {/* Custom Player Controls Bar */}
            <div className="p-3 space-y-2">
              {/* Scrubber Bar */}
              <input
                type="range"
                min="0"
                max={videoRef.current?.duration || totalDuration || 60}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-white/[0.1] rounded-lg"
              />

              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-1 rounded-lg hover:bg-white/[0.08] text-white"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime = 0;
                    }}
                    className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] text-slate-400">
                    {formatTime(currentTime)} / {formatTime(totalDuration)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-[10px] text-purple-300 font-medium">
                    {project.finalVideoUrl ? 'Assembled Project' : `Inspecting: ${selectedScene?.title}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Scene Inspector Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-3xl space-y-4 border border-white/[0.08]">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white font-display">Scene Inspector</h3>
              </div>
              {selectedScene && (
                <button
                  onClick={() => handleRegenerate(selectedScene.id)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate Scene</span>
                </button>
              )}
            </div>

            {selectedScene ? (
              <div className="space-y-3.5 text-xs">
                {/* Title and Duration */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Scene Title</label>
                  <input
                    type="text"
                    value={selectedScene.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setScenes(
                        scenes.map((s) => (s.id === selectedScene.id ? { ...s, title: val } : s))
                      );
                      onUpdateScene(selectedScene.id, { title: val });
                    }}
                    className="w-full bg-[#070912] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-medium mt-1 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                {/* Prompt */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Scene Visual Prompt</label>
                  <textarea
                    rows={3}
                    value={selectedScene.prompt}
                    onChange={(e) => {
                      const val = e.target.value;
                      setScenes(
                        scenes.map((s) => (s.id === selectedScene.id ? { ...s, prompt: val } : s))
                      );
                      onUpdateScene(selectedScene.id, { prompt: val });
                    }}
                    className="w-full bg-[#070912] border border-white/[0.08] rounded-xl p-2.5 text-slate-200 mt-1 resize-none focus:outline-none focus:border-purple-500/50 leading-relaxed"
                  />
                </div>

                {/* Narration Script */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Narration Voiceover Line</span>
                  </label>
                  <input
                    type="text"
                    value={selectedScene.narrationText || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setScenes(
                        scenes.map((s) => (s.id === selectedScene.id ? { ...s, narrationText: val } : s))
                      );
                      onUpdateScene(selectedScene.id, { narrationText: val });
                    }}
                    placeholder="Enter narration text for this clip..."
                    className="w-full bg-[#070912] border border-white/[0.08] rounded-xl px-3 py-2 text-slate-200 mt-1 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                {/* Camera & Transition */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Camera Movement</label>
                    <select
                      value={selectedScene.cameraMovement}
                      onChange={(e) => {
                        const val = e.target.value as CameraMovement;
                        setScenes(
                          scenes.map((s) => (s.id === selectedScene.id ? { ...s, cameraMovement: val } : s))
                        );
                        onUpdateScene(selectedScene.id, { cameraMovement: val });
                      }}
                      className="w-full bg-[#070912] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-slate-200 mt-1"
                    >
                      <option value="tracking-shot">Tracking Dolly</option>
                      <option value="zoom-in">Zoom In</option>
                      <option value="zoom-out">Zoom Out</option>
                      <option value="pan-right">Pan Right</option>
                      <option value="pan-left">Pan Left</option>
                      <option value="orbit">Orbit</option>
                      <option value="static">Static</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Transition to Next</label>
                    <select
                      value={selectedScene.transitionToNext}
                      onChange={(e) => {
                        const val = e.target.value as TransitionType;
                        setScenes(
                          scenes.map((s) => (s.id === selectedScene.id ? { ...s, transitionToNext: val } : s))
                        );
                        onUpdateScene(selectedScene.id, { transitionToNext: val });
                      }}
                      className="w-full bg-[#070912] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-slate-200 mt-1"
                    >
                      <option value="crossfade">Crossfade</option>
                      <option value="cut">Direct Cut</option>
                      <option value="fade-black">Fade to Black</option>
                      <option value="wipe-left">Wipe Left</option>
                      <option value="dissolve">Dissolve</option>
                    </select>
                  </div>
                </div>

                {/* Duration Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-400">Scene Duration</span>
                    <span className="font-mono text-purple-300 font-bold">
                      {selectedScene.targetDuration}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    step="0.5"
                    value={selectedScene.targetDuration}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setScenes(
                        scenes.map((s) => (s.id === selectedScene.id ? { ...s, targetDuration: val } : s))
                      );
                      onUpdateScene(selectedScene.id, { targetDuration: val });
                    }}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Select a scene below to inspect its parameters.</p>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Track Interactive Timeline */}
      <div className="glass-panel p-5 rounded-3xl space-y-4 border border-white/[0.08]">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white font-display">Timeline Sequences</h3>
            <span className="text-xs font-mono text-slate-400">({scenes.length} Clips)</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>BGM Vol:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgMusicVolume}
                onChange={(e) => setBgMusicVolume(parseFloat(e.target.value))}
                className="w-16 accent-indigo-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Voice Vol:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={narrationVolume}
                onChange={(e) => setNarrationVolume(parseFloat(e.target.value))}
                className="w-16 accent-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Timeline Tracks */}
        <div className="space-y-3">
          {/* Track 1: Video Scenes Track */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-purple-400" />
                <span>Track 1: Video Scenes & Transitions</span>
              </span>
              <span className="text-[10px] text-slate-500">Reorder with arrows</span>
            </div>

            {/* Horizontal Scenes Carousel */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 timeline-track p-2 rounded-2xl border border-white/[0.04]">
              {scenes.map((scene, idx) => {
                const isSelected = scene.id === selectedSceneId;
                return (
                  <div key={scene.id} className="flex items-center shrink-0">
                    <div
                      onClick={() => setSelectedSceneId(scene.id)}
                      className={`w-44 p-2.5 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                        isSelected
                          ? 'bg-purple-600/25 border-purple-500 shadow-md shadow-purple-500/20'
                          : 'bg-[#0a0d18] border-white/[0.08] hover:border-purple-500/40'
                      }`}
                    >
                      {/* Thumbnail or Icon */}
                      <div className="aspect-video rounded-xl bg-black/60 overflow-hidden mb-2 relative">
                        {scene.videoUrl ? (
                          <video src={scene.videoUrl} className="w-full h-full object-cover" muted />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">
                            Ready
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                          {scene.targetDuration}s
                        </span>
                      </div>

                      <div className="text-xs font-bold text-white truncate mb-1">
                        {scene.title}
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-[10px]">
                        <button
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveScene(idx, 'left');
                          }}
                          className="px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 disabled:opacity-20"
                        >
                          ◀
                        </button>
                        <span className="text-[10px] text-purple-300 font-mono">#{idx + 1}</span>
                        <button
                          disabled={idx === scenes.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveScene(idx, 'right');
                          }}
                          className="px-1.5 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 disabled:opacity-20"
                        >
                          ▶
                        </button>
                      </div>
                    </div>

                    {/* Transition indicator pill between clips */}
                    {idx < scenes.length - 1 && (
                      <div
                        className="mx-1 px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-[9px] font-mono text-indigo-300 shrink-0"
                        title="Transition effect"
                      >
                        {scene.transitionToNext}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track 2: Narration Voiceover Text Track */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Track 2: Multilingual Voiceover Line</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {scenes.map((s, idx) => (
                <div
                  key={s.id}
                  className="w-44 shrink-0 p-2 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[10px] text-cyan-200 truncate"
                  title={s.narrationText}
                >
                  <span className="font-bold text-cyan-400 mr-1">#{idx + 1}:</span>
                  {s.narrationText || 'No voiceover'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
