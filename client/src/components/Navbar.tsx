import React from 'react';
import { Sparkles, Play, ShieldAlert, Cpu, HardDrive } from 'lucide-react';
import type { NavTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavTab;
  onNewProject: () => void;
  activeJobStage?: string;
  onOpenJobModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNewProject,
  activeJobStage,
  onOpenJobModal,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Creator Dashboard',
      subtitle: 'Overview of recent cinematic productions and active pipelines',
    },
    'text-to-video': {
      title: 'AI Video Studio',
      subtitle: 'Generate cohesive 45-60s multi-scene films from text prompts',
    },
    'image-to-video': {
      title: 'Image to Video Studio',
      subtitle: 'Transform still character & concept art into cinematic motion',
    },
    projects: {
      title: 'Projects Library',
      subtitle: 'Manage, edit, export, and duplicate all your video productions',
    },
    editor: {
      title: 'Timeline & NLE Editor',
      subtitle: 'Arrange scenes, adjust camera movement, mix audio, and render final MP4',
    },
    assets: {
      title: 'Asset Library',
      subtitle: 'Reference images, sound effects, character sheets, and renders',
    },
    models: {
      title: 'AI Model Hub & Adapters',
      subtitle: 'Configure Google Veo, Runway, Luma, Replicate, and Self-Hosted ComfyUI',
    },
    settings: {
      title: 'Studio Settings',
      subtitle: 'Storage retention, FFmpeg configurations, and export preferences',
    },
  };

  const current = titles[currentTab] || { title: 'Studio', subtitle: '' };

  return (
    <header className="h-16 px-6 bg-[#090b13]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base font-bold text-white font-display flex items-center gap-2">
          {current.title}
        </h1>
        <p className="text-[11px] text-slate-400 hidden sm:block">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Active generation alert button */}
        {activeJobStage && (
          <button
            onClick={onOpenJobModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-medium animate-pulse hover:bg-purple-500/25 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="max-w-[160px] truncate">{activeJobStage}</span>
          </button>
        )}

        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-300">
          <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
          <span>Local FFmpeg Core</span>
        </div>

        <button
          onClick={onNewProject}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl gradient-button text-white text-xs font-semibold shadow-lg shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New 60s Film</span>
        </button>
      </div>
    </header>
  );
};
