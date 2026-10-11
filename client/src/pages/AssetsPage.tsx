import React, { useState } from 'react';
import {
  FolderOpen,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  Trash2,
  Download,
  Search,
} from 'lucide-react';
import type { Asset } from '../types';

interface AssetsPageProps {
  assets: Asset[];
  onUploadAsset: (file: File) => Promise<any>;
  onDeleteAsset: (id: string) => Promise<any>;
}

export const AssetsPage: React.FC<AssetsPageProps> = ({
  assets,
  onUploadAsset,
  onDeleteAsset,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const filtered = assets.filter((a) => {
    const matchesType = filterType === 'all' || a.type === filterType;
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        await onUploadAsset(e.target.files[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Asset & Media Library</h2>
          <p className="text-xs text-slate-400">
            Uploaded character references, background scores, and rendered video clips.
          </p>
        </div>

        <label className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-button text-white text-xs font-semibold cursor-pointer shadow-lg shadow-purple-600/20">
          <Upload className="w-3.5 h-3.5" />
          <span>{isUploading ? 'Uploading...' : 'Upload Asset'}</span>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*"
            className="hidden"
          />
        </label>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d0f18] p-3 rounded-2xl border border-white/[0.07]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full bg-[#070912] border border-white/[0.08] rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['all', 'image', 'video', 'audio'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterType === t
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.01]">
          <FolderOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Assets Available</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Upload character portrait references or audio tracks to use across scenes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className="glass-card rounded-2xl overflow-hidden border border-white/[0.08] flex flex-col justify-between group"
            >
              <div className="relative aspect-video bg-black/60 flex items-center justify-center overflow-hidden">
                {asset.type === 'image' && (
                  <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                )}
                {asset.type === 'video' && (
                  <video src={asset.url} className="w-full h-full object-cover" muted />
                )}
                {asset.type === 'audio' && (
                  <Music className="w-8 h-8 text-indigo-400" />
                )}
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white truncate mb-1">{asset.name}</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-mono">
                    {asset.type} • {(asset.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <a
                    href={asset.url}
                    download={asset.name}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => onDeleteAsset(asset.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
