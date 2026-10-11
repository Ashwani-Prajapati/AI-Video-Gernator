import React from 'react';
import {
  Film,
  Sparkles,
  Image,
  FolderKanban,
  SlidersHorizontal,
  FolderOpen,
  Cpu,
  Settings,
  Flame,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'text-to-video'
  | 'image-to-video'
  | 'projects'
  | 'editor'
  | 'assets'
  | 'models'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeJobsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeJobsCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Film },
    { id: 'text-to-video', label: 'AI Video Studio', icon: Sparkles, badge: '60s Multi-Scene' },
    { id: 'image-to-video', label: 'Image to Video', icon: Image },
    { id: 'projects', label: 'Projects Library', icon: FolderKanban },
    { id: 'editor', label: 'Timeline Editor', icon: SlidersHorizontal, badge: 'NLE' },
    { id: 'assets', label: 'Asset Library', icon: FolderOpen },
    { id: 'models', label: 'AI Model Hub', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0c14]/90 border-r border-white/[0.07] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-[#07080d] rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-purple-400 fill-purple-400/30" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg tracking-tight text-white">VividFlow</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Multi-Scene AI Filmmaking</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-purple-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-purple-500/30 text-purple-200'
                        : 'bg-white/[0.06] text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Card */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="p-3 rounded-xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 font-medium">Generation Pipeline</span>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Active Worker</span>
            <span className="text-slate-200 font-mono text-[10px]">FFmpeg 24fps</span>
          </div>

          {activeJobsCount > 0 && (
            <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
              <span className="text-purple-300 animate-pulse font-medium">Running Task</span>
              <span className="px-1.5 py-0.5 bg-purple-500/30 text-purple-200 rounded text-[10px] font-bold">
                {activeJobsCount} Active
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
