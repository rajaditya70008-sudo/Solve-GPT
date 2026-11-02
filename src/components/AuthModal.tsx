import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, CheckCircle2, ArrowRight, LogOut } from 'lucide-react';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isGuest?: boolean;
  provider?: 'google' | 'email' | 'guest';
}

export const GoogleGIcon: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLogin: (user: UserAccount) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [googleSelecting, setGoogleSelecting] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  if (!isOpen) return null;

  // Google Sign-In Handler
  const handleGoogleSignIn = (selectedEmail?: string) => {
    const targetEmail = selectedEmail || 'rajaditya70008@gmail.com';
    const displayName = targetEmail.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    const user: UserAccount = {
      id: `google_${Date.now()}`,
      name: formattedName,
      email: targetEmail,
      isGuest: false,
      provider: 'google',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}&backgroundColor=4285f4&textColor=ffffff`,
    };

    onLogin(user);
    setGoogleSelecting(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide email and password.');
      return;
    }

    const displayName = mode === 'signup' && name.trim() ? name.trim() : email.split('@')[0];
    const user: UserAccount = {
      id: `user_${Date.now()}`,
      name: displayName,
      email: email.trim(),
      isGuest: false,
      provider: 'email',
    };

    onLogin(user);
    onClose();
  };

  const handleGuestSignIn = () => {
    const guestUser: UserAccount = {
      id: `guest_${Date.now()}`,
      name: 'Guest Explorer',
      email: 'guest@solvegpt.local',
      isGuest: true,
      provider: 'guest',
    };
    onLogin(guestUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Accent background glows */}
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute left-0 bottom-0 -ml-12 -mb-12 h-36 w-36 rounded-full bg-blue-500/10 blur-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8">
          {currentUser ? (
            /* Logged in state */
            <div className="text-center">
              <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-slate-900 shadow-xl overflow-hidden">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
                {currentUser.provider === 'google' && (
                  <div className="absolute bottom-0 right-0 rounded-full bg-white p-1 shadow-md">
                    <GoogleGIcon className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-white">{currentUser.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{currentUser.email}</p>

              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  {currentUser.provider === 'google'
                    ? 'Google Account Connected'
                    : currentUser.isGuest
                    ? 'Guest Mode'
                    : 'Active SolveGPT Account'}
                </span>
              </div>

              <div className="mt-8 flex flex-col gap-2.5">
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all shadow-xs"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
                <button
                  onClick={onClose}
                  className="rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Auth Modal (ChatGPT / Gemini style) */
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white shadow-md">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  {mode === 'signin' ? 'Welcome to SolveGPT' : 'Create your account'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Log in to sync your conversations, photo studio generations, and voice reasoning preferences.
              </p>

              {error && (
                <div className="mb-4 rounded-xl border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-300">
                  {error}
                </div>
              )}

              {/* 1. PRIMARY GOOGLE SIGN-IN BUTTON (GEMINI & CHATGPT STYLE) */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn()}
                className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-white py-3 px-4 text-xs font-semibold text-slate-900 shadow-md hover:bg-slate-100 hover:border-slate-500 transition-all"
              >
                <GoogleGIcon className="h-4 w-4 shrink-0" />
                <span>Continue with Google</span>
              </button>

              {/* Option to choose different Google email */}
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => setGoogleSelecting(!googleSelecting)}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {googleSelecting ? 'Hide custom Google email' : 'Use a different Google email...'}
                </button>
              </div>

              {googleSelecting && (
                <div className="mt-2 p-3 rounded-xl border border-slate-800 bg-slate-900/80 space-y-2 animate-fadeIn">
                  <label className="text-[11px] font-medium text-slate-400 block">
                    Google Account Email:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      placeholder="user@gmail.com"
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleGoogleSignIn(customGoogleEmail || undefined)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      Login
                    </button>
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-950 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    or with email
                  </span>
                </div>
              </div>

              {/* Standard Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="text-xs font-medium text-slate-300 mb-1 block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Raj Aditya"
                        className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rajaditya70008@gmail.com"
                      required
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-all shadow-xs"
                >
                  <span>{mode === 'signin' ? 'Sign In with Email' : 'Create Account'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Guest option */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleGuestSignIn}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2 text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                >
                  Continue as Guest
                </button>
              </div>

              {/* Toggle mode */}
              <div className="mt-4 text-center text-xs text-slate-400">
                {mode === 'signin' ? (
                  <p>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="font-semibold text-emerald-400 hover:text-emerald-300 ml-1"
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="font-semibold text-emerald-400 hover:text-emerald-300 ml-1"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
