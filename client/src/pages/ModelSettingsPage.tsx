import React, { useState } from 'react';
import {
  Cpu,
  Key,
  Server,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  HardDrive,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import type { ModelCapability, ProviderConfig } from '../types';

interface ModelSettingsPageProps {
  providers: ProviderConfig[];
  models: ModelCapability[];
  onSaveKey: (providerId: string, key: string, endpoint?: string) => Promise<any>;
  onToggleMode: (providerId: string, mode: 'api' | 'self-hosted', endpoint?: string) => Promise<any>;
}

export const ModelSettingsPage: React.FC<ModelSettingsPageProps> = ({
  providers,
  models,
  onSaveKey,
  onToggleMode,
}) => {
  const [keysInput, setKeysInput] = useState<Record<string, string>>({});
  const [endpointsInput, setEndpointsInput] = useState<Record<string, string>>({
    comfyui: 'http://127.0.0.1:8188',
  });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = async (providerId: string) => {
    const key = keysInput[providerId] || '';
    const endpoint = endpointsInput[providerId];
    try {
      await onSaveKey(providerId, key, endpoint);
      setSaveStatus(`Saved credentials for ${providerId}`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">AI Video Model Hub & Adapters</h2>
          <p className="text-xs text-slate-400">
            Provider-independent adapter architecture. Connect external APIs or configure self-hosted GPU inference.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Keys Stored Securely on Backend Only</span>
        </div>
      </div>

      {saveStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Operating Modes Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Server className="w-4 h-4 text-purple-400" />
            <span>MODE A — Commercial AI APIs</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Connect directly to Google Veo 2, OpenAI Sora, Runway Gen-3, Luma Ray 2, or Replicate. VividFlow enforces zero artificial application credit caps; billing follows the provider's direct token rate.
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>MODE B — Self-Hosted GPU (ComfyUI / Local)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Point VividFlow to your local or private cloud ComfyUI server (AnimateDiff / Wan 2.1). Complete offline video synthesis with zero per-clip cloud fees.
          </p>
        </div>
      </div>

      {/* Provider Integration Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white font-display">Configured Providers</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {providers.map((p) => {
            const isLocal = p.mode === 'self-hosted';
            return (
              <div
                key={p.id}
                className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        p.hasKeyConfigured || isLocal
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {isLocal ? 'Self-Hosted' : p.hasKeyConfigured ? 'Active' : 'Key Required'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    {p.id === 'pollinations' && 'Pollinations Open AI Video Engine (100% Free, zero setup, no API key required).'}
                    {p.id === 'google' && 'Google Cloud Vertex AI & Gemini Video API for Veo 2 high-definition generation.'}
                    {p.id === 'openai' && 'OpenAI Video generation & GPT-4o cinematic storyboarding.'}
                    {p.id === 'runway' && 'Runway Gen-3 Alpha API for high motion fluidity.'}
                    {p.id === 'luma' && 'Luma Dream Machine Ray 2 keyframe motion engine.'}
                    {p.id === 'replicate' && 'Open-weight Wan 2.1 14B and CogVideoX cloud containers.'}
                    {p.id === 'comfyui' && 'Local WebSocket inference on NVIDIA RTX 3080/4090.'}
                    {p.id === 'procedural' && 'Built-in FFmpeg cinematic motion synthesizer (Free & Offline).'}
                  </p>
                </div>

                {/* Form fields */}
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  {p.id !== 'procedural' && p.id !== 'pollinations' && !isLocal && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Key className="w-3 h-3 text-purple-400" />
                          <span>API Key / Secret</span>
                        </span>
                        {p.hasKeyConfigured && (
                          <span className="text-emerald-400 font-mono text-[10px]">
                            Configured ({p.maskedKey})
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={keysInput[p.id] || ''}
                          onChange={(e) =>
                            setKeysInput({ ...keysInput, [p.id]: e.target.value })
                          }
                          placeholder={p.hasKeyConfigured ? 'Enter new key to update...' : 'Paste API Key...'}
                          className="flex-1 bg-[#070912] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => handleSave(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {isLocal && (
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Local Endpoint URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={endpointsInput[p.id] || p.apiEndpoint || 'http://127.0.0.1:8188'}
                          onChange={(e) =>
                            setEndpointsInput({ ...endpointsInput, [p.id]: e.target.value })
                          }
                          className="flex-1 bg-[#070912] border border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleSave(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-semibold"
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model Capabilities Matrix Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white font-display">Model Capability Matrix</h3>

        <div className="glass-panel rounded-2xl overflow-hidden border border-white/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] border-b border-white/[0.06] text-slate-400">
                <tr>
                  <th className="p-3.5">Model Name</th>
                  <th className="p-3.5">Provider</th>
                  <th className="p-3.5">Text-to-Video</th>
                  <th className="p-3.5">Image-to-Video</th>
                  <th className="p-3.5">Max Clip</th>
                  <th className="p-3.5">Supported Res</th>
                  <th className="p-3.5">Cost Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {models.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-semibold text-white">{m.name}</td>
                    <td className="p-3.5 text-slate-400">{m.providerName}</td>
                    <td className="p-3.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                    </td>
                    <td className="p-3.5 font-mono text-purple-300">{m.maxClipDurationSeconds}s</td>
                    <td className="p-3.5 font-mono text-[11px]">{m.supportedResolutions.join(', ')}</td>
                    <td className="p-3.5 text-slate-400">{m.pricingDescription}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
