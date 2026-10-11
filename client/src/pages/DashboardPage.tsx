import React, { useState } from 'react';
import {
  Sparkles,
  Film,
  Play,
  Clock,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Flame,
} from 'lucide-react';
import type { Project, VideoDuration } from '../types';

interface DashboardPageProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onStartNewWithPrompt: (prompt: string, duration: VideoDuration) => void;
  onNavigateToTab: (tab: any) => void;
}

const INSPIRATION_PROMPTS = [
  {
    title: 'The Chemical Elements in Love',
    prompt:
      'A cinematic 3D animated film about two cute glowing chemical element beings falling in love in a colorful retro-future laboratory. Microscopic sparkles, volumetric lighting, expressive reactions.',
    duration: 60 as VideoDuration,
    style: '3d-animation',
    tag: 'Trending 60s',
  },
  {
    title: 'The Alchemist of Neon City',
    prompt:
      'Cinematic cyberpunk story of a rogue synth-chemist discovering an ancient bioluminescent vial in rainy sector 7. Anamorphic lens flares, chrome reflections, high tension.',
    duration: 60 as VideoDuration,
    style: 'cinematic-realism',
    tag: 'Cyberpunk',
  },
  {
    title: 'Solarpunk Oasis Expedition',
    prompt:
      'Hyper-detailed documentary style exploration of a lush botanical solarpunk sky-city. Giant glass biomes, pollinator drones, warm golden hour sunlight.',
    duration: 50 as VideoDuration,
    style: 'sci-fi',
    tag: 'Solarpunk',
  },
  {
    title: 'Deep Sea Bioluminescence',
    prompt:
      'Nature documentary camera gliding past towering hydrothermal vents and translucent glowing abyssal sea creatures with iridescent scales.',
    duration: 45 as VideoDuration,
    style: 'nature',
    tag: 'Nature 45s',
  },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  projects,
  onOpenProject,
  onStartNewWithPrompt,
  onNavigateToTab,
}) => {
  const [quickPrompt, setQuickPrompt] = useState('');
  const [quickDuration, setQuickDuration] = useState<VideoDuration>(60);

  const totalMinutes = (
    projects.reduce((acc, p) => acc + (p.finalVideoDuration || 60), 0) / 60
  ).toFixed(1);

  const handleLaunchQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    onStartNewWithPrompt(quickPrompt, quickDuration);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Quick Production Section */}
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-[#121626] via-[#0d101d] to-[#07080e] p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span>Autonomous Multi-Scene AI Video Pipeline</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
            Direct Complete <span className="gradient-text-accent">45–60 Second Films</span> with Single Prompts
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            VividFlow automatically breaks your story into cohesive scenes, enforces character continuity, generates dynamic camera motion, and assembles the final timeline with FFmpeg.
          </p>

          {/* Quick Production Form */}
          <form onSubmit={handleLaunchQuick} className="pt-2 space-y-3">
            <div className="relative">
              <input
                type="text"
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                placeholder="Describe your film... e.g. A futuristic robot rediscovering an ancient flowering tree in the ruins of an obsidian city"
                className="w-full bg-[#070912]/80 border border-white/[0.12] rounded-2xl px-5 py-4 pr-36 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 shadow-inner"
              />
              <button
                type="submit"
                disabled={!quickPrompt.trim()}
                className="absolute right-2 top-2 bottom-2 px-5 rounded-xl gradient-button text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Produce Film</span>
              </button>
            </div>

            {/* Quick Duration selection chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Target Duration:</span>
              {([45, 50, 55, 60] as VideoDuration[]).map((dur) => (
                <button
                  type="button"
                  key={dur}
                  onClick={() => setQuickDuration(dur)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    quickDuration === dur
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.05]'
                  }`}
                >
                  {dur} Seconds ({Math.ceil(dur / 7.5)} Scenes)
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Video Projects</span>
            <Film className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-display">{projects.length}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">+100%</span> persistent in DB
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Rendered Runtime</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-display">{totalMinutes} mins</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-cyan-400 font-semibold">Continuous</span> 45-60s workflows
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Multi-Scene Pipeline</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-display">6 - 8 Clips</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            Auto-storyboard continuity
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Rendering Engine</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-display">FFmpeg 1080p</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            Zero-credit app limit
          </div>
        </div>
      </div>

      {/* Inspiration Showcase */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white font-display">Inspiration & Storyboard Presets</h3>
            <p className="text-xs text-slate-400">Click any production concept to load and edit its full storyboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {INSPIRATION_PROMPTS.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onStartNewWithPrompt(item.prompt, item.duration)}
              className="glass-card p-5 rounded-2xl cursor-pointer flex flex-col justify-between group hover:border-purple-500/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {item.tag}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{item.duration}s</span>
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {item.prompt}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-purple-300 font-semibold group-hover:translate-x-0.5 transition-transform">
                <span>Load Storyboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white font-display">Recent Projects</h3>
            <p className="text-xs text-slate-400">Jump directly into timeline editing or MP4 export</p>
          </div>
          <button
            onClick={() => onNavigateToTab('projects')}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
          >
            <span>View all ({projects.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.01]">
            <Film className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No video projects yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-white/[0.08]"
              >
                {/* Thumbnail / Video header */}
                <div className="relative aspect-video bg-[#05060b] overflow-hidden group">
                  {project.finalVideoUrl ? (
                    <video
                      src={project.finalVideoUrl}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      muted
                      loop
                      onMouseOver={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                      onMouseOut={(e) => (e.target as HTMLVideoElement).pause()}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <Film className="w-8 h-8 text-purple-400/50 mb-2" />
                      <span className="text-xs text-slate-400">Storyboard Generated</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 font-mono">
                      {project.settings?.targetTotalDuration || 60}s
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-900/60 backdrop-blur-md text-[10px] font-medium text-purple-200 border border-purple-500/20">
                      {project.scenes?.length || 8} Scenes
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white truncate mb-1">{project.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {project.originalPrompt}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {project.settings?.visualStyle || 'cinematic-realism'}
                    </span>
                    <button
                      onClick={() => onOpenProject(project.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Edit Timeline</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
