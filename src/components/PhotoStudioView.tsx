import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Copy,
  Check,
  Video,
  Upload,
  X,
  Maximize2,
  RefreshCw,
  Wand2,
  Layers,
  Ratio,
} from 'lucide-react';
import { GeneratedPhoto, TabType } from '../types';
import { exportAsset } from '../utils/exportUtils';

interface PhotoStudioViewProps {
  currentPrompt: string;
  setCurrentPrompt: (prompt: string) => void;
  onAnimateToVideo: (imageUrl: string, prompt: string) => void;
  setActiveTab: (tab: TabType) => void;
  photoHistory: GeneratedPhoto[];
  setPhotoHistory: React.Dispatch<React.SetStateAction<GeneratedPhoto[]>>;
}

export const PhotoStudioView: React.FC<PhotoStudioViewProps> = ({
  currentPrompt,
  setCurrentPrompt,
  onAnimateToVideo,
  setActiveTab,
  photoHistory,
  setPhotoHistory,
}) => {
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [style, setStyle] = useState('photorealistic');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportedId, setExportedId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GeneratedPhoto | null>(null);

  const stylePresets = [
    { id: 'photorealistic', label: '8K Photorealistic', desc: 'Natural daylight, 85mm f/1.4 lens' },
    { id: 'diagram', label: 'Technical Diagram', desc: 'Exploded view, engineering infographic' },
    { id: 'cinematic', label: 'Cinematic Film', desc: 'Anamorphic, 35mm grain, color grade' },
    { id: '3d-render', label: '3D Octane Render', desc: 'Raytraced studio lighting, subsurface scattering' },
    { id: 'macro', label: 'Macro Precision', desc: 'Extreme close-up depth of field' },
    { id: 'concept-art', label: 'Concept Art', desc: 'Digital painting with painterly brushwork' },
    { id: 'none', label: 'Raw / Unstyled', desc: 'Follow exact prompt verbatim' },
  ];

  const aspectRatios = [
    { id: '1:1', label: '1:1 Square', icon: '1:1' },
    { id: '16:9', label: '16:9 Landscape', icon: '16:9' },
    { id: '9:16', label: '9:16 Vertical Story', icon: '9:16' },
    { id: '4:3', label: '4:3 Standard', icon: '4:3' },
    { id: '3:4', label: '3:4 Portrait', icon: '3:4' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleEnhancePrompt = async () => {
    if (!currentPrompt.trim()) return;
    setEnhancing(true);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, type: 'photo' }),
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

  const handleGenerate = async () => {
    if (!currentPrompt.trim()) {
      setError('Please enter a prompt to generate an image.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt.trim(),
          aspectRatio,
          style,
          referenceImage: referenceImage || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image.');
      }

      const newPhoto: GeneratedPhoto = {
        id: `photo_${Date.now()}`,
        url: data.imageUrl,
        prompt: data.prompt || currentPrompt,
        aspectRatio: data.aspectRatio || aspectRatio,
        style,
        createdAt: Date.now(),
        explanation: data.explanation,
      };

      setPhotoHistory((prev) => [newPhoto, ...prev]);
      setSelectedPhoto(newPhoto);
    } catch (err: any) {
      setError(err?.message || 'Image generation failed. Please try again.');
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
    const success = await exportAsset(url, `solvegpt_photo_${id}.png`);
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
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 mb-2">
            <ImageIcon className="h-3.5 w-3.5" />
            <span>AI Photo Studio • gemini-3.1-flash-lite-image</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Prompt to Photo & Diagram Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Create high-fidelity visuals, technical schematics, and instructional graphics from text prompts or reference images.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Prompting Controls */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 backdrop-blur shadow-xl">
            {/* Prompt input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Image Prompt
                </label>
                <button
                  onClick={handleEnhancePrompt}
                  disabled={enhancing || !currentPrompt.trim()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                  title="Use Gemini to automatically enhance your prompt with photographic lighting, lens details, and textures"
                >
                  <Wand2 className={`h-3.5 w-3.5 ${enhancing ? 'animate-spin' : ''}`} />
                  <span>{enhancing ? 'Enhancing...' : 'Enhance with AI'}</span>
                </button>
              </div>
              <textarea
                value={currentPrompt}
                onChange={(e) => setCurrentPrompt(e.target.value)}
                rows={4}
                placeholder="Describe the image or diagram you want to create... (e.g., 'An exploded 3D technical diagram of a car brake caliper showing pads, piston, and rotor with clean studio lighting')"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Aspect Ratio */}
            <div className="mt-5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                <Ratio className="h-3.5 w-3.5 text-indigo-400" />
                <span>Aspect Ratio</span>
              </label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id as any)}
                    className={`rounded-lg border px-2.5 py-2 text-center text-xs font-medium transition-all ${
                      aspectRatio === ratio.id
                        ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold">{ratio.id}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style Presets */}
            <div className="mt-5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                <span>Visual Style Preset</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {stylePresets.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStyle(st.id)}
                    className={`rounded-lg border p-2 text-left text-xs transition-all ${
                      style === st.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold">{st.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Reference Image Upload */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Reference Image (Optional)
                </label>
                {referenceImage && (
                  <button
                    onClick={() => setReferenceImage(null)}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Remove
                  </button>
                )}
              </div>

              {referenceImage ? (
                <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950/60 p-2">
                  <img
                    src={referenceImage}
                    alt="Reference preview"
                    className="h-28 w-full object-cover rounded-lg"
                  />
                  <div className="mt-2 text-[11px] text-slate-400">
                    Image attached as reference frame for editing or stylization.
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-4 hover:border-slate-600 transition-all">
                  <Upload className="h-5 w-5 text-slate-400" />
                  <span className="mt-1 text-xs text-slate-400 font-medium">
                    Upload image for editing or variation
                  </span>
                  <span className="text-[10px] text-slate-500">PNG, JPG, WebP</span>
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
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Rendering Image with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Photo</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-xl border border-rose-800/40 bg-rose-950/30 p-3 text-xs text-rose-300">
                <p className="font-semibold">Generation notice:</p>
                <p className="mt-0.5 text-rose-300/80">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Preview & Gallery */}
        <div className="space-y-6 lg:col-span-7">
          {/* Active / Featured Image Display */}
          {selectedPhoto || photoHistory.length > 0 ? (
            (() => {
              const photo = selectedPhoto || photoHistory[0];
              return (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur shadow-xl">
                  <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black flex items-center justify-center min-h-[340px] max-h-[500px]">
                    <img
                      src={photo.url}
                      alt={photo.prompt}
                      className="max-h-[500px] w-auto max-w-full object-contain"
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-xs text-slate-300 font-medium line-clamp-2">
                        "{photo.prompt}"
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-indigo-400">
                          {photo.aspectRatio}
                        </span>
                        <span>•</span>
                        <span>{new Date(photo.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyPrompt(photo.prompt, photo.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                        title="Copy Prompt"
                      >
                        {copiedId === photo.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>{copiedId === photo.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => handleExport(photo.url, photo.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-all shadow-xs"
                        title="Export PNG to device"
                      >
                        {exportedId === photo.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Exported!</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Export</span>
                          </>
                        )}
                      </button>

                      {/* Bridge to Video Studio: Animate into Video */}
                      <button
                        onClick={() => {
                          onAnimateToVideo(photo.url, photo.prompt);
                          setActiveTab('videos');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:from-fuchsia-500 hover:to-indigo-500 transition-all"
                        title="Send this image as the starting frame to Video Studio to animate it"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Animate to Video</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
                <ImageIcon className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">
                No Photos Generated Yet
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                Type a prompt on the left or select a step diagram from the Problem Solver to generate your first AI photo.
              </p>
            </div>
          )}

          {/* History Gallery */}
          {photoHistory.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Generated Photos Gallery ({photoHistory.length})
                </h3>
                <span className="text-xs text-slate-500">Click to preview</span>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {photoHistory.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl border transition-all ${
                      selectedPhoto?.id === photo.id
                        ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.prompt}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(photo.url, photo.id);
                          }}
                          className="rounded-md bg-black/70 p-1 text-white hover:bg-black/90 hover:text-emerald-400 transition-colors"
                          title="Export"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-white truncate">{photo.prompt}</p>
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
