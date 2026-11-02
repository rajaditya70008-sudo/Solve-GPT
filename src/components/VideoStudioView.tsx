import React, { useState } from 'react';
import {
  Video,
  Sparkles,
  Download,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Upload,
  Wand2,
  Clock,
  Film,
  RefreshCw,
  Ratio,
  Maximize2,
  Check,
  Copy,
  ChevronRight,
} from 'lucide-react';
import { GeneratedVideo, TabType } from '../types';
import { exportAsset } from '../utils/exportUtils';

interface VideoStudioViewProps {
  currentPrompt: string;
  setCurrentPrompt: (prompt: string) => void;
  videoReferenceImage: string | null;
  setVideoReferenceImage: (img: string | null) => void;
  setActiveTab: (tab: TabType) => void;
  videoHistory: GeneratedVideo[];
  setVideoHistory: React.Dispatch<React.SetStateAction<GeneratedVideo[]>>;
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
  currentPrompt,
  setCurrentPrompt,
  videoReferenceImage,
  setVideoReferenceImage,
  setActiveTab,
  videoHistory,
  setVideoHistory,
}) => {
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState<'5s' | '10s'>('5s');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportedId, setExportedId] = useState<string | null>(null);

  // Camera Motion Tags
  const cameraMotionPresets = [
    { label: '🚁 Drone Flyover', tag: 'Smooth aerial drone flyover shot, gliding gracefully' },
    { label: '🎥 Dolly Zoom', tag: 'Cinematic forward dolly zoom with dramatic depth parallax' },
    { label: '🔄 360 Orbit', tag: '360-degree orbital camera rotation around the subject' },
    { label: '⏱️ Slow-Motion Pan', tag: 'High-speed 120fps slow-motion lateral tracking pan' },
    { label: '⚡ Dynamic FPV', tag: 'Fast-paced first-person view dive with realistic motion blur' },
    { label: '🔍 Macro Pull-back', tag: 'Close-up macro lens slowly pulling back to reveal context' },
  ];

  const handleApplyMotion = (motionText: string) => {
    if (currentPrompt.includes(motionText)) return;
    const separator = currentPrompt.trim().endsWith('.') ? ' ' : '. ';
    setCurrentPrompt(`${currentPrompt.trim()}${currentPrompt.trim() ? separator : ''}${motionText}`);
  };

  const handleEnhancePrompt = async () => {
    if (!currentPrompt.trim()) return;
    setEnhancing(true);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, type: 'video' }),
      });
      const data = await response.json();
      if (data.enhancedPrompt) {
        setCurrentPrompt(data.enhancedPrompt);
      }
    } catch (e) {
      console.warn('Enhance failed:', e);
    } finally {
      setEnhancing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setVideoReferenceImage(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!currentPrompt.trim()) {
      setError('Please enter a prompt to generate a video.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt.trim(),
          aspectRatio,
          duration,
          resolution,
          referenceImage: videoReferenceImage || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video.');
      }

      const newVideo: GeneratedVideo = {
        id: `video_${Date.now()}`,
        url: data.videoUrl,
        prompt: data.prompt || currentPrompt,
        aspectRatio: data.aspectRatio || aspectRatio,
        duration: data.duration || duration,
        resolution: data.resolution || resolution,
        createdAt: Date.now(),
      };

      setVideoHistory((prev) => [newVideo, ...prev]);
      setSelectedVideo(newVideo);
    } catch (err: any) {
      setError(err?.message || 'Video generation failed. Note: Omni Flash video generation requires server processing time.');
    } finally {
      setGenerating(false);
    }
  };

  const copyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = async (url: string, id: string) => {
    const success = await exportAsset(url, `solvegpt_video_${id}.mp4`);
    if (success) {
      setExportedId(id);
      setTimeout(() => setExportedId(null), 2500);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Studio Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-400 mb-2">
            <Film className="h-3.5 w-3.5" />
            <span>AI Video Studio • gemini-omni-1.1-flash</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Prompt to Video & Animation Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Generate cinematic video clips or bring still photos and step diagrams to life with physics-informed camera motion.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Video Controls */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 backdrop-blur shadow-xl">
            {/* Prompt input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Video Motion Prompt
                </label>
                <button
                  onClick={handleEnhancePrompt}
                  disabled={enhancing || !currentPrompt.trim()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-fuchsia-400 hover:text-fuchsia-300 disabled:opacity-50"
                  title="Use Gemini to enhance your prompt with cinematic lighting, camera angles, and atmospheric motion"
                >
                  <Wand2 className={`h-3.5 w-3.5 ${enhancing ? 'animate-spin' : ''}`} />
                  <span>{enhancing ? 'Enhancing...' : 'Enhance with AI'}</span>
                </button>
              </div>
              <textarea
                value={currentPrompt}
                onChange={(e) => setCurrentPrompt(e.target.value)}
                rows={4}
                placeholder="Describe the action and camera motion... (e.g., 'A slow cinematic 360-degree pan around a futuristic neon workstation showing robotic arms repairing a circuit board with soft glowing lights')"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 shadow-inner focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
              />
            </div>

            {/* Camera Motion Presets */}
            <div className="mt-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 block">
                Camera Motion Directives
              </label>
              <div className="flex flex-wrap gap-1.5">
                {cameraMotionPresets.map((motion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyMotion(motion.tag)}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-300 hover:border-fuchsia-500/50 hover:bg-slate-900 hover:text-white transition-all"
                  >
                    {motion.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Format Controls */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {/* Aspect Ratio */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  <Ratio className="h-3.5 w-3.5 text-fuchsia-400" />
                  <span>Aspect Ratio</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['16:9', '9:16'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`rounded-lg border p-2 text-center text-xs font-medium transition-all ${
                        aspectRatio === ratio
                          ? 'border-fuchsia-500 bg-fuchsia-500/20 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {ratio === '16:9' ? '16:9 Wide' : '9:16 Story'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  <Clock className="h-3.5 w-3.5 text-fuchsia-400" />
                  <span>Duration</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['5s', '10s'] as const).map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setDuration(dur)}
                      className={`rounded-lg border p-2 text-center text-xs font-medium transition-all ${
                        duration === dur
                          ? 'border-fuchsia-500 bg-fuchsia-500/20 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resolution */}
            <div className="mt-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 block">
                Resolution Quality
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['720p', '1080p'] as const).map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`rounded-lg border p-2 text-center text-xs font-medium transition-all ${
                      resolution === res
                        ? 'border-fuchsia-500 bg-fuchsia-500/20 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {res === '720p' ? '720p HD (Fast)' : '1080p Full HD'}
                  </button>
                ))}
              </div>
            </div>

            {/* Image-to-Video: Starting Frame Reference */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Image-to-Video (Starting Frame)
                </label>
                {videoReferenceImage && (
                  <button
                    onClick={() => setVideoReferenceImage(null)}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Clear Image
                  </button>
                )}
              </div>

              {videoReferenceImage ? (
                <div className="relative overflow-hidden rounded-xl border border-fuchsia-500/40 bg-slate-950/60 p-2">
                  <img
                    src={videoReferenceImage}
                    alt="Starting frame"
                    className="h-28 w-full object-cover rounded-lg"
                  />
                  <div className="mt-2 text-[11px] text-fuchsia-300">
                    ✓ Starting frame attached. Video model will animate this image.
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-4 hover:border-slate-600 transition-all">
                  <Upload className="h-5 w-5 text-slate-400" />
                  <span className="mt-1 text-xs text-slate-400 font-medium">
                    Upload initial frame or send from Photo Studio
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Animates photo directly into motion video
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !currentPrompt.trim()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/25 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Video (Omni Flash)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Video</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-xl border border-rose-800/40 bg-rose-950/30 p-3 text-xs text-rose-300">
                <p className="font-semibold">Generation Notice:</p>
                <p className="mt-0.5 text-rose-300/80">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Video Player & Gallery */}
        <div className="space-y-6 lg:col-span-7">
          {/* Active Player */}
          {selectedVideo || videoHistory.length > 0 ? (
            (() => {
              const video = selectedVideo || videoHistory[0];
              return (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur shadow-xl">
                  <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black flex items-center justify-center min-h-[340px] max-h-[500px]">
                    <video
                      src={video.url}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="max-h-[500px] w-auto max-w-full rounded-lg"
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-xs text-slate-300 font-medium line-clamp-2">
                        "{video.prompt}"
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-fuchsia-400">
                          {video.aspectRatio}
                        </span>
                        <span>•</span>
                        <span>{video.duration}</span>
                        <span>•</span>
                        <span>{video.resolution}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyPrompt(video.prompt, video.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                        title="Copy Prompt"
                      >
                        {copiedId === video.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>{copiedId === video.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => handleExport(video.url, video.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/10 px-3.5 py-1.5 text-xs font-semibold text-fuchsia-300 hover:bg-fuchsia-500/20 hover:text-white transition-all shadow-xs"
                        title="Export video MP4 to device"
                      >
                        {exportedId === video.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Exported!</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5 text-fuchsia-400" />
                            <span>Export Video</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 mb-3">
                <Video className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">
                No Videos Generated Yet
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                Enter a motion prompt on the left, click "Generate Video Demo" on any step from the Problem Solver, or animate a photo from Photo Studio.
              </p>
            </div>
          )}

          {/* History Gallery */}
          {videoHistory.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Video Clips Gallery ({videoHistory.length})
                </h3>
                <span className="text-xs text-slate-500">Click to watch</span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {videoHistory.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => setSelectedVideo(vid)}
                    className={`group relative aspect-video cursor-pointer overflow-hidden rounded-xl border bg-black transition-all ${
                      selectedVideo?.id === vid.id
                        ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/50'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <video
                      src={vid.url}
                      className="h-full w-full object-cover"
                      muted
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur text-white group-hover:scale-110 transition-transform">
                        <Play className="h-4 w-4 ml-0.5" />
                      </div>
                    </div>
                    {/* Quick export button on hover */}
                    <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(vid.url, vid.id);
                        }}
                        className="rounded-md bg-black/75 p-1 text-white hover:bg-black/95 hover:text-fuchsia-400 backdrop-blur transition-colors"
                        title="Export Video"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between text-[10px] text-white/80">
                      <span className="truncate max-w-[80px]">{vid.prompt}</span>
                      <span className="rounded bg-black/60 px-1 py-0.2">{vid.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
