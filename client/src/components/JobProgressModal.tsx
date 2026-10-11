import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Play,
  X,
  AlertTriangle,
} from 'lucide-react';
import type { GenerationJob, Scene } from '../types';

interface JobProgressModalProps {
  job: GenerationJob | null;
  scenes?: Scene[];
  finalVideoUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onCancelJob: (jobId: string) => void;
  onOpenEditor: (projectId: string) => void;
}

export const JobProgressModal: React.FC<JobProgressModalProps> = ({
  job,
  scenes = [],
  finalVideoUrl,
  isOpen,
  onClose,
  onCancelJob,
  onOpenEditor,
}) => {
  if (!isOpen || !job) return null;

  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isCancelled = job.status === 'cancelled';
  const isRunning = !isCompleted && !isFailed && !isCancelled;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0d0f18] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isFailed
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-pulse'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isFailed ? (
                <XCircle className="w-5 h-5" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                {isCompleted
                  ? 'Video Generation Complete'
                  : isFailed
                  ? 'Generation Encountered an Issue'
                  : 'Producing Multi-Scene Video'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Job ID: {job.id.slice(0, 8)} • Model: {job.modelId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Status Message & Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-slate-200 flex items-center gap-2">
                {isRunning && <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />}
                {job.stageMessage}
              </span>
              <span className="font-mono text-purple-300 font-bold">
                {job.progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden p-[1px]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isFailed
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400'
                }`}
                style={{ width: `${job.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Scenes progress grid if scenes exist */}
          {scenes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Scene Progress ({scenes.filter((s) => s.status === 'completed').length} / {scenes.length} Scenes)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      scene.status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-slate-200'
                        : scene.status === 'generating'
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-200 shadow-sm shadow-purple-500/10'
                        : scene.status === 'failed'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-white/[0.02] border-white/[0.05] text-slate-400'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-semibold truncate">{scene.title}</div>
                      <div className="text-[10px] text-slate-400">{scene.targetDuration}s duration</div>
                    </div>
                    <div>
                      {scene.status === 'completed' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {scene.status === 'generating' && (
                        <span className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin block shrink-0" />
                      )}
                      {scene.status === 'failed' && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      {scene.status === 'pending' && (
                        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terminal Logs */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Pipeline Logs</span>
            </div>
            <div className="bg-[#05060a] border border-white/[0.06] rounded-xl p-3 font-mono text-[11px] text-slate-300 max-h-36 overflow-y-auto space-y-1">
              {(job.logs || []).map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Error notice if failed */}
          {job.error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Generation Notice:</p>
                <p className="text-[11px] text-rose-300/90 mt-0.5">{job.error}</p>
              </div>
            </div>
          )}

          {/* Video preview on completion */}
          {isCompleted && finalVideoUrl && (
            <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-black/60 p-2">
              <video
                src={finalVideoUrl}
                controls
                autoPlay
                className="w-full aspect-video rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div>
            {isRunning && (
              <button
                onClick={() => onCancelJob(job.id)}
                className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-300 text-xs hover:bg-rose-500/10 transition-colors"
              >
                Cancel Generation
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-medium transition-colors"
            >
              Close
            </button>
            {isCompleted && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditor(job.projectId);
                }}
                className="px-4 py-1.5 rounded-xl gradient-button text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Open in Timeline Editor</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
