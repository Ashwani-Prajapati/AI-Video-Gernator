import React, { useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Camera,
  Layers,
  Sliders,
  AlertCircle,
  Play,
  Check,
} from 'lucide-react';
import type { CameraMovement, ModelCapability } from '../types';

interface ImageToVideoPageProps {
  models: ModelCapability[];
  onUploadImage: (file: File) => Promise<string>;
  onStartImageToVideo: (params: any) => void;
}

export const ImageToVideoPage: React.FC<ImageToVideoPageProps> = ({
  models,
  onUploadImage,
  onStartImageToVideo,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lastFrameImage, setLastFrameImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [prompt, setPrompt] = useState('Animate this character turning to look at the camera, volumetric atmospheric light drifting in background');
  const [duration, setDuration] = useState<number>(6);
  const [cameraMovement, setCameraMovement] = useState<CameraMovement>('pan-right');
  const [motionIntensity, setMotionIntensity] = useState<number>(6);
  const [selectedModelId, setSelectedModelId] = useState<string>('procedural-cinematic');

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0], 'first');
    }
  };

  const handleUpload = async (file: File, target: 'first' | 'last') => {
    setIsUploading(true);
    try {
      const url = await onUploadImage(file);
      if (target === 'first') setSelectedImage(url);
      else setLastFrameImage(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) return;

    onStartImageToVideo({
      imageUrl: selectedImage,
      lastFrameUrl: lastFrameImage,
      prompt,
      duration,
      cameraMovement,
      motionIntensity,
      modelId: selectedModelId,
      providerId: models.find((m) => m.id === selectedModelId)?.providerId || 'procedural',
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Image-to-Video Animation Studio</h2>
          <p className="text-xs text-slate-400">
            Provide keyframe stills, character references, and camera guidance to generate seamless motion.
          </p>
        </div>
        <span className="text-xs text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-full font-medium">
          Keyframe Interpolation
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Upload & Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Keyframe (First Frame) */}
          <div className="glass-panel p-6 rounded-3xl space-y-3">
            <label className="text-xs font-bold text-white flex items-center justify-between">
              <span>First Frame / Character Reference (Required)</span>
              {selectedImage && (
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Remove Image
                </button>
              )}
            </label>

            {selectedImage ? (
              <div className="relative rounded-2xl overflow-hidden aspect-video border border-purple-500/30 bg-black/50 group">
                <img src={selectedImage} alt="First Frame" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs text-white font-medium bg-black/60 px-3 py-1.5 rounded-lg">
                    Primary Keyframe Loaded
                  </span>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="relative border-2 border-dashed border-white/[0.12] hover:border-purple-500/50 rounded-2xl p-8 text-center bg-white/[0.01] hover:bg-white/[0.03] transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer"
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'first')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Drag & drop your reference image</p>
                  <p className="text-xs text-slate-400 mt-0.5">Supports PNG, JPG, or WebP up to 50MB</p>
                </div>
                {isUploading && (
                  <span className="text-xs text-purple-300 font-semibold animate-pulse">
                    Uploading & analyzing image...
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Optional Last Frame Guidance */}
          <div className="glass-panel p-5 rounded-3xl space-y-3">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Ending Frame / Target Composition (Optional)</span>
              {lastFrameImage && (
                <button
                  type="button"
                  onClick={() => setLastFrameImage(null)}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Remove
                </button>
              )}
            </label>

            {lastFrameImage ? (
              <div className="relative rounded-xl overflow-hidden aspect-video border border-indigo-500/30 max-h-36">
                <img src={lastFrameImage} alt="Last Frame" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="relative border border-dashed border-white/[0.08] rounded-xl p-4 text-center bg-white/[0.01] flex items-center justify-center gap-3">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'last')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <ImageIcon className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-400">Click to upload target end-frame for morphing transitions</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Motion Prompt & Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Motion & Camera Parameters</span>
            </h3>

            {/* Movement Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Motion Description</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe how the scene and camera should move..."
                className="w-full bg-[#070912] border border-white/[0.1] rounded-xl p-3 text-xs text-white resize-none focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Model Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Image-to-Video Engine</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full bg-[#070912] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Camera movement */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Camera Direction</label>
              <select
                value={cameraMovement}
                onChange={(e) => setCameraMovement(e.target.value as CameraMovement)}
                className="w-full bg-[#070912] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="pan-right">Pan Right</option>
                <option value="pan-left">Pan Left</option>
                <option value="zoom-in">Zoom In / Push</option>
                <option value="zoom-out">Zoom Out / Reveal</option>
                <option value="tilt-up">Tilt Up</option>
                <option value="orbit">Orbit Around Subject</option>
                <option value="static">Locked-off Static</option>
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Clip Duration</span>
                <span className="font-mono text-purple-300 font-bold">{duration} Seconds</span>
              </div>
              <input
                type="range"
                min="4"
                max="10"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Motion Intensity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Motion Amplitude</span>
                <span className="font-mono text-purple-300 font-bold">{motionIntensity} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={motionIntensity}
                onChange={(e) => setMotionIntensity(parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Action button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!selectedImage}
                className="w-full py-3.5 rounded-xl gradient-button text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Animate Image into Video</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
