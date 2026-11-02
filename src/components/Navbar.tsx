import React from 'react';
import { Sparkles, Lightbulb, Image as ImageIcon, Video, MessageSquare, ShieldCheck, Zap, User as UserIcon, LogIn } from 'lucide-react';
import { TabType } from '../types';
import { UserAccount } from './AuthModal';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasApiKey: boolean;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onOpenQuickPrompt?: (prompt: string, targetTab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hasApiKey,
  currentUser,
  onOpenAuth,
}) => {
  const tabs = [
    {
      id: 'solver' as TabType,
      label: 'Problem Solver',
      badge: 'Search Grounded',
      icon: Lightbulb,
      description: 'Solve any real-world problem with step-by-step visual guides',
    },
    {
      id: 'photos' as TabType,
      label: 'Photo Studio',
      badge: 'Gemini Image',
      icon: ImageIcon,
      description: 'Generate high-res photos and diagrams from text',
    },
    {
      id: 'videos' as TabType,
      label: 'Video Studio',
      badge: 'Omni Flash',
      icon: Video,
      description: 'Create & animate cinematic videos from prompts',
    },
    {
      id: 'chat' as TabType,
      label: 'Gemini Chat',
      badge: 'Multi-Role',
      icon: MessageSquare,
      description: 'Multi-turn reasoning with gemini-4-argon & 3.8-flash',
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                SolveGPT
              </h1>
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                AI Plus
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Photos, Videos & Search-Grounded Problem Solving
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
                title={tab.description}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`hidden md:inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status & Auth Indicators */}
        <div className="flex items-center gap-2">
          {hasApiKey ? (
            <div
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400"
              title="Gemini API Connected"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-medium">Ready</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400"
              title="API Key Managed Externally"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-medium">Online</span>
            </div>
          )}

          {/* User Authentication Trigger */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              currentUser
                ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
                : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white shadow-sm'
            }`}
          >
            {currentUser ? (
              <>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[90px] truncate">{currentUser.name}</span>
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5 text-indigo-400" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
