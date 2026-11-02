import React from 'react';
import {
  Plus,
  MessageSquare,
  Lightbulb,
  Image as ImageIcon,
  Video,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  User as UserIcon,
  LogIn,
  Settings,
  Sparkles,
  ExternalLink,
  Activity,
  Keyboard,
} from 'lucide-react';
import { ChatSession, CreationMode } from '../types';
import { UserAccount, GoogleGIcon } from './AuthModal';
import { GptLogo } from './GptLogo';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: (mode?: CreationMode) => void;
  onDeleteSession: (id: string) => void;
  currentUser: UserAccount | null;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts?: () => void;
  currentMode: CreationMode;
  onSelectMode: (mode: CreationMode) => void;
  onOpenDebug: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  currentUser,
  onOpenAuth,
  onOpenSettings,
  onOpenShortcuts,
  currentMode,
  onSelectMode,
  onOpenDebug,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 ease-in-out md:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
        }`}
      >
        {/* Top Header: Logo & New Chat */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-900">
          <div className="flex items-center gap-2.5">
            <GptLogo size={28} />
            <span className="font-bold tracking-tight text-white text-base">SolveGPT</span>
          </div>
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
            title={`Toggle sidebar (${modKey}+B)`}
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => onNewSession('auto')}
            title={`New chat (${modKey}+N or ${modKey}+K)`}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-xs font-semibold text-white shadow-xs hover:border-slate-700 hover:bg-slate-900 transition-all"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-400" />
              <span>New chat</span>
            </span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-mono">
              {modKey}+N
            </span>
          </button>
        </div>

        {/* Studio Modes Shortcuts */}
        <div className="px-3 pb-2 space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Modes
          </div>
          <button
            onClick={() => onSelectMode('solver')}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
              currentMode === 'solver'
                ? 'bg-slate-800/90 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            <span>Problem Solver</span>
          </button>

          <button
            onClick={() => onSelectMode('photo')}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
              currentMode === 'photo'
                ? 'bg-slate-800/90 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
            <span>Make Photos</span>
          </button>

          <button
            onClick={() => onSelectMode('video')}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
              currentMode === 'video'
                ? 'bg-slate-800/90 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Video className="h-3.5 w-3.5 text-fuchsia-400" />
            <span>Make Videos</span>
          </button>

          <button
            onClick={() => onSelectMode('chat')}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
              currentMode === 'chat'
                ? 'bg-slate-800/90 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
            <span>Standard Chat</span>
          </button>
        </div>

        {/* History of Recent Chats */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Recent
          </div>
          {sessions.length === 0 ? (
            <div className="px-2 py-4 text-center text-xs text-slate-600">
              No previous chats yet
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-all cursor-pointer ${
                  sess.id === currentSessionId
                    ? 'bg-slate-800/80 text-white font-medium'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                onClick={() => onSelectSession(sess.id)}
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  <MessageSquare className="h-3 w-3 shrink-0 text-slate-500" />
                  <span className="truncate">{sess.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(sess.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Settings, Debug & Google Account at Bottom */}
        <div className="border-t border-slate-900 p-3 space-y-1.5">
          {/* Keyboard Shortcuts Trigger */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="flex w-full items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/40 p-2 text-left hover:bg-slate-900 hover:border-slate-700 transition-colors group"
              title={`Keyboard shortcuts (${modKey}+/ or ?)`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
                  <Keyboard className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                  Shortcuts
                </span>
              </div>
              <span className="rounded border border-slate-800 bg-slate-850 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                {modKey}+/
              </span>
            </button>
          )}

          {/* Settings Button (ChatGPT / Gemini style) */}
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/40 p-2 text-left hover:bg-slate-900 hover:border-slate-700 transition-colors group"
            title="Open SolveGPT Settings (API Key, Models, Voice, Theme)"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-slate-300 group-hover:text-white">
                <Settings className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                Settings
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Preferences</span>
          </button>

          {/* Diagnostics & Debug Drawer */}
          <button
            onClick={onOpenDebug}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/40 p-2 text-left hover:bg-slate-900 hover:border-slate-700 transition-colors group"
            title="Open Diagnostics, Self-Tests, and Engine Status"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                <Activity className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                Diagnostics & Debug
              </span>
            </div>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
          </button>

          {/* Google Account / Sign-In Button */}
          <button
            onClick={onOpenAuth}
            className="flex w-full items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/50 p-2 text-left hover:bg-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {currentUser ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white overflow-hidden">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-full w-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-xs">
                  <GoogleGIcon className="h-4 w-4" />
                </div>
              )}
              <div className="truncate">
                <div className="text-xs font-medium text-white truncate max-w-[120px]">
                  {currentUser ? currentUser.name : 'Login with Google'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {currentUser?.provider === 'google'
                    ? 'Google Account'
                    : currentUser?.isGuest
                    ? 'Guest User'
                    : currentUser
                    ? 'SolveGPT Account'
                    : 'Click to Sign In'}
                </div>
              </div>
            </div>
            {currentUser && currentUser.provider === 'google' ? (
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            ) : null}
          </button>
        </div>
      </aside>
    </>
  );
};
