import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  ExternalLink,
  ChevronRight,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ProblemSolution, GroundingSource, TabType } from '../types';

interface ProblemSolverViewProps {
  onSelectPromptForPhoto: (prompt: string) => void;
  onSelectPromptForVideo: (prompt: string) => void;
  setActiveTab: (tab: TabType) => void;
}

export const ProblemSolverView: React.FC<ProblemSolverViewProps> = ({
  onSelectPromptForPhoto,
  onSelectPromptForVideo,
  setActiveTab,
}) => {
  const [problemText, setProblemText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState<ProblemSolution | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sampleProblems = [
    {
      category: 'Home & DIY',
      text: 'Kitchen sink pipe is leaking at the slip joint under the basin',
      icon: '🚰',
    },
    {
      category: 'Automotive',
      text: 'Car engine will not crank and makes a rapid clicking sound when turning ignition',
      icon: '🚗',
    },
    {
      category: 'Tech & Code',
      text: 'Web app fetch request blocked by CORS policy with missing Access-Control-Allow-Origin header',
      icon: '💻',
    },
    {
      category: 'Everyday Life',
      text: 'How to safely remove a stubborn dark coffee stain from a white cotton shirt',
      icon: '☕',
    },
    {
      category: 'STEM & Science',
      text: 'Explain how CRISPR gene editing works step-by-step with clear analogies',
      icon: '🔬',
    },
    {
      category: 'Cycling & Gear',
      text: 'Bicycle chain slipping off the rear gear cassette when pedaling uphill under load',
      icon: '🚲',
    },
  ];

  const categories = ['All', 'Home & DIY', 'Automotive', 'Tech & Code', 'STEM & Science', 'Everyday Life'];

  const filteredSamples = selectedCategory === 'All'
    ? sampleProblems
    : sampleProblems.filter((p) => p.category === selectedCategory);

  const handleSolve = async (queryText?: string) => {
    const textToSubmit = queryText || problemText;
    if (!textToSubmit.trim()) return;

    setLoading(true);
    setError(null);
    setSolution(null);
    setSources([]);

    try {
      const response = await fetch('/api/solve-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: textToSubmit.trim(),
          domain: selectedCategory !== 'All' ? selectedCategory : 'General',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to solve problem.');
      }

      setSolution(data.solution);
      setSources(data.sources || []);
    } catch (err: any) {
      setError(err?.message || 'An error occurred while finding a solution.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePhoto = (prompt?: string) => {
    if (!prompt) return;
    onSelectPromptForPhoto(prompt);
    setActiveTab('photos');
  };

  const handleCreateVideo = (prompt?: string) => {
    if (!prompt) return;
    onSelectPromptForVideo(prompt);
    setActiveTab('videos');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-10 shadow-2xl">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <Search className="h-3.5 w-3.5" />
            <span>Google Search Grounded • Powered by Gemini 3.8 Flash</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Visual Problem Solver & Diagnostic Engine
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Describe any real-world challenge—from broken plumbing and engine trouble to coding bugs and scientific concepts.
            Gemini searches live Google web data to diagnose root causes and provides step-by-step action plans accompanied by AI photo diagrams and video prompts.
          </p>

          {/* Search / Input Box */}
          <div className="mt-6 flex flex-col gap-3">
            <div className="relative">
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSolve();
                  }
                }}
                rows={3}
                placeholder="What problem do you need to solve? (e.g., 'My refrigerator is humming loudly and coils are warm', or 'How to fix React useEffect infinite loop?')"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Ctrl+Enter to solve
                </span>
                <button
                  onClick={() => handleSolve()}
                  disabled={loading || !problemText.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-md hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Diagnosing with Google Search...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Solve Problem</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Quick Filters:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Quick Problems */}
      {!solution && !loading && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Try A Sample Problem
            </h3>
            <span className="text-xs text-slate-500">1-click diagnostic run</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSamples.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setProblemText(item.text);
                  handleSolve(item.text);
                }}
                className="group flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 text-left transition-all hover:border-indigo-500/50 hover:bg-slate-900/90 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2 group-hover:text-white">
                    {item.text}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Solve with visual guide</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-800/50 bg-rose-950/40 p-4 text-rose-300">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <span>Problem Solver Notice</span>
          </div>
          <p className="mt-1 text-xs text-rose-300/90">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 animate-pulse">
          <div className="h-6 w-1/3 rounded bg-slate-800" />
          <div className="h-4 w-2/3 rounded bg-slate-800/70" />
          <div className="h-20 w-full rounded bg-slate-800/50" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-10 rounded bg-slate-800" />
            <div className="h-10 rounded bg-slate-800" />
            <div className="h-10 rounded bg-slate-800" />
          </div>
        </div>
      )}

      {/* Diagnostic Solution Result */}
      {solution && !loading && (
        <div className="space-y-8 animate-fadeIn">
          {/* Diagnostic Card Header */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
              <div>
                <span className="inline-block rounded-md bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                  {solution.category || 'General'}
                </span>
                <h3 className="mt-2 text-xl sm:text-2xl font-bold text-white">
                  {solution.title}
                </h3>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{solution.estimatedTime || 'Approx. 20m'}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
                  <Wrench className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{solution.difficulty || 'Intermediate'}</span>
                </div>
              </div>
            </div>

            {/* Root Cause Analysis Summary */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Root Cause & Diagnostic Analysis
              </h4>
              <p className="mt-2 text-sm text-slate-200 leading-relaxed bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                {solution.summary}
              </p>
            </div>

            {/* Safety Warnings */}
            {solution.safetyPrecautions && solution.safetyPrecautions.length > 0 && (
              <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Safety Precautions</span>
                </div>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-amber-200/90">
                  {solution.safetyPrecautions.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Tools & Materials */}
            {solution.requiredTools && solution.requiredTools.length > 0 && (
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Tools & Materials Needed
                </h4>
                <div className="flex flex-wrap gap-2">
                  {solution.requiredTools.map((tool, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300"
                    >
                      <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Steps with Visual Triggers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Step-by-Step Resolution Plan</h3>
                <p className="text-xs text-slate-400">
                  Each step includes one-click visual generation for AI diagrams and cinematic demonstration clips.
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {solution.steps?.length || 0} Steps
              </span>
            </div>

            <div className="space-y-4">
              {solution.steps?.map((step) => (
                <div
                  key={step.stepNumber}
                  className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/20 font-bold text-indigo-400 border border-indigo-500/30 text-sm">
                      {step.stepNumber}
                    </div>

                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-white">
                        {step.title}
                      </h4>
                      <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                        {step.instruction}
                      </p>

                      {step.keyInsight && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 text-xs text-cyan-300">
                          <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Pro Tip: {step.keyInsight}</span>
                        </div>
                      )}

                      {/* Visual Generation Action Buttons for this Step */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/60">
                        {step.photoPrompt && (
                          <button
                            onClick={() => handleCreatePhoto(step.photoPrompt)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all shadow-sm"
                            title="Generate a high-detail visual diagram or photo illustrating this exact step"
                          >
                            <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Generate Step Diagram</span>
                            <ChevronRight className="h-3 w-3 opacity-60" />
                          </button>
                        )}

                        {step.videoPrompt && (
                          <button
                            onClick={() => handleCreateVideo(step.videoPrompt)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-300 hover:bg-fuchsia-500/20 hover:text-white transition-all shadow-sm"
                            title="Animate this step into a 5-second cinematic motion video demonstration"
                          >
                            <Video className="h-3.5 w-3.5 text-fuchsia-400" />
                            <span>Generate Video Demo</span>
                            <ChevronRight className="h-3 w-3 opacity-60" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prevention & Pro Tips */}
          {((solution.preventionTips && solution.preventionTips.length > 0) ||
            (solution.alternativeSolutions && solution.alternativeSolutions.length > 0)) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {solution.preventionTips && solution.preventionTips.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Long-Term Prevention Tips
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    {solution.preventionTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {solution.alternativeSolutions && solution.alternativeSolutions.length > 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Alternative Methods & Workarounds
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    {solution.alternativeSolutions.map((alt, i) => (
                      <li key={i}>{alt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Google Search Grounding Sources */}
          {sources.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Search className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Google Search Grounded Sources
                </h4>
                <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                  Verified Data
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                This diagnostic was corroborated with real-time web facts retrieved via Google Search:
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition-all group"
                  >
                    <span className="truncate pr-2">{src.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
