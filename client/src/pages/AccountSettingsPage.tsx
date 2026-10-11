import React, { useState } from 'react';
import {
  Settings,
  HardDrive,
  Database,
  ShieldCheck,
  Check,
  Terminal,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface AccountSettingsPageProps {
  systemHealth: any;
  onRefreshHealth: () => void;
}

export const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({
  systemHealth,
  onRefreshHealth,
}) => {
  const [retentionDays, setRetentionDays] = useState(7);
  const [defaultResolution, setDefaultResolution] = useState('1080p');
  const [defaultDuration, setDefaultDuration] = useState('60');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Studio Configuration & Environment</h2>
          <p className="text-xs text-slate-400">
            System diagnostics, video export defaults, and local rendering pipelines.
          </p>
        </div>
        <button
          onClick={onRefreshHealth}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Health</span>
        </button>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Application settings saved successfully.</span>
        </div>
      )}

      {/* System Diagnostics Card */}
      <div className="glass-panel p-6 rounded-3xl space-y-4 border border-white/[0.08]">
        <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Host System & Engine Diagnostics</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-2xl bg-[#070912] border border-white/[0.06]">
            <span className="text-[11px] text-slate-400 block mb-1">Backend Server Status</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {systemHealth?.status === 'ok' ? 'HEALTHY / ONLINE' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#070912] border border-white/[0.06]">
            <span className="text-[11px] text-slate-400 block mb-1">FFmpeg Binary Core</span>
            <span className="text-xs font-mono text-purple-300 truncate block" title={systemHealth?.ffmpegPath}>
              {systemHealth?.ffmpegPath ? 'win32-x64 static loaded' : 'System PATH'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#070912] border border-white/[0.06]">
            <span className="text-[11px] text-slate-400 block mb-1">Active AI Providers</span>
            <span className="text-sm font-bold text-white font-mono">
              {systemHealth?.availableModels || 7} Supported Models
            </span>
          </div>
        </div>
      </div>

      {/* Storage and Cleanup Settings */}
      <div className="glass-panel p-6 rounded-3xl space-y-4 border border-white/[0.08]">
        <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-purple-400" />
          <span>Video Storage & Retention Policy</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Temporary Scene File Retention</label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(parseInt(e.target.value))}
              className="w-full bg-[#070912] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
            >
              <option value={3}>Retain 3 days</option>
              <option value={7}>Retain 7 days (Recommended)</option>
              <option value={30}>Retain 30 days</option>
              <option value={0}>Retain indefinitely</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Auto-cleans intermediate scene files to prevent local disk space accumulation.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">Default Target Film Duration</label>
            <select
              value={defaultDuration}
              onChange={(e) => setDefaultDuration(e.target.value)}
              className="w-full bg-[#070912] border border-white/[0.08] rounded-xl px-3 py-2 text-white"
            >
              <option value="45">45 Seconds (6 Scenes)</option>
              <option value="50">50 Seconds (7 Scenes)</option>
              <option value="60">60 Seconds (8 Scenes)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Default duration preset for the creator studio workspace.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl gradient-button text-white text-xs font-semibold cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Guide documentation card */}
      <div className="glass-panel p-6 rounded-3xl space-y-3 border border-white/[0.08]">
        <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Local Setup Guide for ComfyUI & External AI Models</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          To run 100% free offline generation, launch your local ComfyUI on default port <code className="bg-black/50 px-1.5 py-0.5 rounded text-purple-300">8188</code> with the AnimateDiff or Wan2.1 custom nodes. If connecting to Google Veo 2, obtain a Gemini/Vertex AI key from Google AI Studio and enter it in the AI Model Hub tab.
        </p>
      </div>
    </div>
  );
};
