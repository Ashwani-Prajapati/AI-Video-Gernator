import React, { useState } from 'react';
import {
  Film,
  Search,
  SlidersHorizontal,
  Download,
  Copy,
  Trash2,
  Clock,
  Play,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { Project } from '../types';

interface ProjectsPageProps {
  projects: Project[];
  onOpenEditor: (projectId: string) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onNewProject: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  onOpenEditor,
  onDuplicateProject,
  onDeleteProject,
  onNewProject,
}) => {
  const [search, setSearch] = useState('');
  const [filterDuration, setFilterDuration] = useState<string>('all');

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.originalPrompt.toLowerCase().includes(search.toLowerCase());
    const matchesDuration =
      filterDuration === 'all' ||
      String(p.settings?.targetTotalDuration) === filterDuration;
    return matchesSearch && matchesDuration;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Projects Library</h2>
          <p className="text-xs text-slate-400">
            {projects.length} multi-scene productions stored in database.
          </p>
        </div>

        <button
          onClick={onNewProject}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-button text-white text-xs font-semibold shadow-lg shadow-purple-600/20 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Create New 60s Video</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d0f18] p-3 rounded-2xl border border-white/[0.07]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or prompts..."
            className="w-full bg-[#070912] border border-white/[0.08] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Duration:</span>
          {['all', '45', '50', '60'].map((d) => (
            <button
              key={d}
              onClick={() => setFilterDuration(d)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterDuration === d
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white'
              }`}
            >
              {d === 'all' ? 'All' : `${d}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.01]">
          <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Projects Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Try adjusting your search query or create your first cinematic film.
          </p>
          <button
            onClick={onNewProject}
            className="px-4 py-2 rounded-xl gradient-button text-white text-xs font-semibold"
          >
            Create New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="glass-card rounded-2xl overflow-hidden border border-white/[0.08] flex flex-col justify-between group"
            >
              {/* Media Preview */}
              <div className="relative aspect-video bg-[#05060a] overflow-hidden">
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
                    <Film className="w-8 h-8 text-purple-500/40 mb-2" />
                    <span className="text-xs text-slate-400 font-medium">Multi-scene Project</span>
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

                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                      project.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : project.status === 'failed'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                    {project.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {project.originalPrompt}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {project.finalVideoUrl && (
                      <a
                        href={project.finalVideoUrl}
                        download={`${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`}
                        className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors"
                        title="Download MP4"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => onDuplicateProject(project.id)}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors"
                      title="Duplicate Project"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteProject(project.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenEditor(project.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-semibold transition-colors ml-1 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Timeline</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
