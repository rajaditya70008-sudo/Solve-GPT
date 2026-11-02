import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Key,
  Cpu,
  Volume2,
  User,
  Shield,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Sliders,
  Moon,
  Sun,
  Globe,
  Sparkles,
  LogOut,
  Eye,
  EyeOff,
  Check,
  Radio,
} from 'lucide-react';
import { UserAccount, GoogleGIcon } from './AuthModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLogin: (user: UserAccount) => void;
  onLogout: () => void;
  onClearAllChats: () => void;
  hasApiKey: boolean;
  setHasApiKey: (hasKey: boolean) => void;
}

type SettingsTab = 'general' | 'apikey' | 'models' | 'voice' | 'account' | 'data';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  onClearAllChats,
  hasApiKey,
  setHasApiKey,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const [theme, setTheme] = useState<'dark' | 'light' | 'oled'>(() => {
    return (localStorage.getItem('solvegpt_theme') as any) || 'dark';
  });
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('solvegpt_lang') || 'en-US';
  });

  useEffect(() => {
    const handleSync = (e: any) => {
      const val = e.detail || localStorage.getItem('solvegpt_lang');
      if (val && val !== language) {
        setLanguage(val);
      }
    };
    window.addEventListener('solvegpt_lang_changed', handleSync);
    return () => window.removeEventListener('solvegpt_lang_changed', handleSync);
  }, [language]);

  // Gemini API Key State
  const [inputApiKey, setInputApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyStatusMessage, setKeyStatusMessage] = useState<string | null>(null);
  const [keyStatusType, setKeyStatusType] = useState<'success' | 'error' | 'info' | null>(null);
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [isCustomKey, setIsCustomKey] = useState(false);

  // Model & Reasoning Settings
  const [defaultModel, setDefaultModel] = useState<'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'gemini-4-argon'>(() => {
    return (localStorage.getItem('solvegpt_default_model') as any) || 'gemini-3.1-flash-lite';
  });
  const [enableGrounding, setEnableGrounding] = useState<boolean>(() => {
    return localStorage.getItem('solvegpt_grounding') !== 'false';
  });
  const [enableStreaming, setEnableStreaming] = useState<boolean>(() => {
    return localStorage.getItem('solvegpt_streaming') !== 'false';
  });
  const [temperature, setTemperature] = useState<number>(() => {
    const val = localStorage.getItem('solvegpt_temp');
    return val ? parseFloat(val) : 0.7;
  });

  // Voice Settings
  const [voiceSpeed, setVoiceSpeed] = useState<number>(() => {
    const val = localStorage.getItem('solvegpt_voice_speed');
    return val ? parseFloat(val) : 1.0;
  });
  const [voiceLang, setVoiceLang] = useState<string>(() => {
    return localStorage.getItem('solvegpt_voice_lang') || 'hi-IN';
  });
  const [autoReadResponses, setAutoReadResponses] = useState<boolean>(() => {
    return localStorage.getItem('solvegpt_auto_read') === 'true';
  });
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false);

  // Clear confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Fetch API status on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/status')
        .then((r) => r.json())
        .then((d) => {
          if (d) {
            setHasApiKey(!!d.hasApiKey);
            setMaskedKey(d.maskedKey || null);
            setIsCustomKey(!!d.isCustomKey);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, setHasApiKey]);

  if (!isOpen) return null;

  // Save Gemini API Key Handler
  const handleSaveApiKey = async () => {
    if (!inputApiKey.trim()) return;
    setIsVerifyingKey(true);
    setKeyStatusMessage(null);

    try {
      const res = await fetch('/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputApiKey.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setHasApiKey(true);
        setMaskedKey(data.maskedKey || null);
        setIsCustomKey(true);
        setKeyStatusType('success');
        setKeyStatusMessage(data.message || 'Gemini API Key successfully verified and active!');
        setInputApiKey('');
      } else {
        setKeyStatusType('error');
        setKeyStatusMessage(data.error || 'Verification failed. Please check your key.');
      }
    } catch (e: any) {
      setKeyStatusType('error');
      setKeyStatusMessage(e?.message || 'Could not verify API key with server.');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  // Test Connection Handler
  const handleTestConnection = async () => {
    setIsVerifyingKey(true);
    setKeyStatusMessage(null);

    try {
      const res = await fetch('/api/test-key', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.ok && data.connected) {
        setKeyStatusType('success');
        setKeyStatusMessage(data.message || 'Gemini connection is live and verified!');
      } else {
        setKeyStatusType('error');
        setKeyStatusMessage(data.message || data.error || 'Gemini connection test failed.');
      }
    } catch (e: any) {
      setKeyStatusType('error');
      setKeyStatusMessage('Failed to connect to Gemini API endpoint.');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  // Clear Custom API Key
  const handleClearApiKey = async () => {
    try {
      await fetch('/api/clear-api-key', { method: 'POST' });
      setIsCustomKey(false);
      setMaskedKey(null);
      setKeyStatusType('info');
      setKeyStatusMessage('Custom key cleared. SolveGPT Fast Multilingual engine will be used.');
      const st = await fetch('/api/status').then((r) => r.json());
      setHasApiKey(!!st.hasApiKey);
    } catch (e) {}
  };

  // Test Voice Sample
  const handleTestVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const sampleText =
      voiceLang === 'hi-IN'
        ? 'नमस्ते! मैं SolveGPT हूँ। आपकी आवाज़ की सेटिंग बिल्कुल ठीक काम कर रही है।'
        : 'Hello! I am SolveGPT. Your voice settings are configured and sounding great.';

    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.lang = voiceLang;
    utterance.rate = voiceSpeed;

    const voices = window.speechSynthesis.getVoices();
    const matched = voices.find(
      (v) =>
        v.lang === voiceLang ||
        v.lang.startsWith(voiceLang.slice(0, 2)) ||
        (voiceLang === 'hi-IN' && v.name.toLowerCase().includes('hindi'))
    );
    if (matched) utterance.voice = matched;

    setIsPlayingTestAudio(true);
    utterance.onend = () => setIsPlayingTestAudio(false);
    utterance.onerror = () => setIsPlayingTestAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  // Google Login Handler
  const handleGoogleSignIn = () => {
    const user: UserAccount = {
      id: `google_${Date.now()}`,
      name: 'Raj Aditya',
      email: 'rajaditya70008@gmail.com',
      isGuest: false,
      provider: 'google',
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Raj%20Aditya&backgroundColor=4285f4&textColor=ffffff',
    };
    onLogin(user);
    setKeyStatusType('success');
  };

  // Export Chat History
  const handleExportData = () => {
    try {
      const saved = localStorage.getItem('solvegpt_sessions') || '[]';
      const blob = new Blob([saved], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `solvegpt_history_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Failed to export:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md animate-fadeIn">
      <div className="relative flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl sm:flex-row">
        {/* Left Navigation Sidebar (ChatGPT & Gemini Style) */}
        <div className="w-full sm:w-60 border-b sm:border-b-0 sm:border-r border-slate-800/80 bg-slate-900/60 p-3 sm:p-4 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5 px-2 py-2 mb-3">
              <Settings className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Settings</h3>
            </div>

            <nav className="space-y-1">
              {[
                { id: 'general' as SettingsTab, label: 'General', icon: Sliders },
                { id: 'apikey' as SettingsTab, label: 'Gemini API Key', icon: Key, badge: hasApiKey ? 'Active' : 'Setup' },
                { id: 'models' as SettingsTab, label: 'Model & Logic', icon: Cpu },
                { id: 'voice' as SettingsTab, label: 'Voice & Speech', icon: Volume2 },
                { id: 'account' as SettingsTab, label: 'Google Account', icon: User },
                { id: 'data' as SettingsTab, label: 'Data Controls', icon: Shield },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.badge === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User badge at bottom of sidebar */}
          <div className="hidden sm:block border-t border-slate-800/80 pt-3">
            <div className="flex items-center gap-2.5 px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-semibold text-white truncate max-w-[120px]">
                  {currentUser ? currentUser.name : 'Guest User'}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentUser?.email || 'Not signed in'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Settings Content Area */}
        <div className="relative flex flex-1 flex-col overflow-y-auto p-5 sm:p-7">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors z-10"
            title="Close Settings"
          >
            <X className="h-5 w-5" />
          </button>

          {/* 1. GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h4 className="text-lg font-bold text-white">General Preferences</h4>
                <p className="text-xs text-slate-400 mt-0.5">Customize theme, interface language, and workspace layout.</p>
              </div>

              {/* Theme Selector */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <label className="text-xs font-semibold text-white block">Appearance Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'dark', label: 'Dark Charcoal', icon: Moon },
                    { id: 'oled', label: 'OLED Black', icon: Sparkles },
                    { id: 'light', label: 'Daylight', icon: Sun },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id as any);
                        localStorage.setItem('solvegpt_theme', t.id);
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                        theme === t.id
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-sm'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <t.icon className="h-4 w-4" />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selector */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white block">Default Interface & AI Language</label>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    Live Sync
                  </span>
                </div>
                <select
                  value={language}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLanguage(val);
                    localStorage.setItem('solvegpt_lang', val);
                    window.dispatchEvent(new CustomEvent('solvegpt_lang_changed', { detail: val }));
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="en-US">🇺🇸 English (US) — Strict English responses (Hinglish questions answered in English)</option>
                  <option value="auto">🌐 Auto-Detect — Matches the language you type (Devanagari / Hinglish / English)</option>
                  <option value="hi-IN">🇮🇳 हिन्दी (Hindi) — Pure Devanagari Hindi responses</option>
                  <option value="hi-Latn">🇮🇳 Hinglish — Conversational Hindi in English alphabet</option>
                  <option value="es-ES">🇪🇸 Español</option>
                  <option value="fr-FR">🇫🇷 Français</option>
                  <option value="de-DE">🇩🇪 Deutsch</option>
                  <option value="ar-SA">🇸🇦 العربية</option>
                  <option value="ja-JP">🇯🇵 日本語</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Tip:</span> When set to <span className="text-emerald-400 font-semibold">English (US)</span>, SolveGPT guarantees responses stay in English even if you ask questions in Hinglish (e.g. <span className="italic">"car start nahi ho rahi hai"</span>).
                </p>
              </div>

              {/* Clear History */}
              <div className="rounded-2xl border border-rose-900/30 bg-rose-950/10 p-4 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-rose-300">Clear All Chat History</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Delete all local chat sessions and cached photos.</p>
                </div>
                {showClearConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onClearAllChats();
                        setShowClearConfirm(false);
                      }}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 shadow-sm"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
                  >
                    Clear History
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. GEMINI API KEY & ENGINE TAB (USER SPECIFIC REQUEST) */}
          {activeTab === 'apikey' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h4 className="text-lg font-bold text-white">Gemini API Key & Configuration</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure and verify your Google Gemini API Key for Gemini 3.8 Flash, Gemini 4 Argon, and Imagen 3.
                </p>
              </div>

              {/* Current Status Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Active Connection Status</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        hasApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        hasApiKey ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {hasApiKey ? 'Gemini API Connected' : 'Built-in Multilingual Engine Active'}
                    </span>
                  </div>
                </div>

                {hasApiKey && maskedKey && (
                  <div className="rounded-xl bg-slate-950 p-2.5 text-xs text-slate-300 flex items-center justify-between font-mono">
                    <span>Key: {maskedKey}</span>
                    <span className="text-[10px] text-emerald-400 font-sans font-semibold">
                      {isCustomKey ? 'Custom User Key' : 'AI Studio System Key'}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleTestConnection}
                    disabled={isVerifyingKey}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-all shadow-xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isVerifyingKey ? 'animate-spin' : ''}`} />
                    <span>Test Gemini Connection</span>
                  </button>

                  {isCustomKey && (
                    <button
                      onClick={handleClearApiKey}
                      className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Remove Custom Key
                    </button>
                  )}

                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all ml-auto"
                  >
                    <span>Get Free Gemini Key</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Status feedback message */}
              {keyStatusMessage && (
                <div
                  className={`rounded-2xl border p-3.5 text-xs leading-relaxed flex items-start gap-2.5 ${
                    keyStatusType === 'success'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : keyStatusType === 'error'
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                      : 'border-slate-700 bg-slate-900 text-slate-300'
                  }`}
                >
                  {keyStatusType === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : keyStatusType === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <Key className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <span>{keyStatusMessage}</span>
                </div>
              )}

              {/* Enter / Update API Key Form */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <label className="text-xs font-semibold text-white block">
                  Enter / Update Gemini API Key (starts with AIza...)
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={inputApiKey}
                    onChange={(e) => setInputApiKey(e.target.value)}
                    placeholder="Paste your Gemini API key (AIzaSy...)"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-3 pr-10 text-xs text-white placeholder-slate-500 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  onClick={handleSaveApiKey}
                  disabled={isVerifyingKey || !inputApiKey.trim()}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all shadow-md ${
                    inputApiKey.trim()
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isVerifyingKey ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Verifying with Google Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Verify & Activate API Key</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Your key is validated on the backend server proxy and used for multimodal generation. It is never exposed publicly to browser clients.
                </p>
              </div>
            </div>
          )}

          {/* 3. MODEL & REASONING TAB */}
          {activeTab === 'models' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h4 className="text-lg font-bold text-white">Model & Reasoning Controls</h4>
                <p className="text-xs text-slate-400 mt-0.5">Tune intelligence parameters, search grounding, and response velocity.</p>
              </div>

              {/* Model Selection */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <label className="text-xs font-semibold text-white block">Default Chat Engine</label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'gemini-3.1-flash-lite',
                      title: '⚡ SolveGPT Fast Multilingual',
                      desc: 'Instant streaming, Hindi Devanagari & Hinglish fluency, minimal latency',
                    },
                    {
                      id: 'gemini-3.8-flash',
                      title: '✨ SolveGPT 3.8 Flash',
                      desc: 'Balanced multimodal problem solving with Google Search grounding',
                    },
                    {
                      id: 'gemini-4-argon',
                      title: '🧠 SolveGPT 4 Argon',
                      desc: 'Deep STEM reasoning, complex diagnostic checklists, and architecture code',
                    },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setDefaultModel(m.id as any);
                        localStorage.setItem('solvegpt_default_model', m.id);
                      }}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        defaultModel === m.id
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-white shadow-xs'
                          : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="mt-0.5">
                        <Radio className={`h-4 w-4 ${defaultModel === m.id ? 'text-emerald-400' : 'text-slate-600'}`} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{m.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{m.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Google Search Grounding</div>
                    <div className="text-[11px] text-slate-400">Fetch live web facts and citations for troubleshooting.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableGrounding}
                    onChange={(e) => {
                      setEnableGrounding(e.target.checked);
                      localStorage.setItem('solvegpt_grounding', String(e.target.checked));
                    }}
                    className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Real-Time Streaming SSE</div>
                    <div className="text-[11px] text-slate-400">Stream words progressively like ChatGPT for fast replies.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableStreaming}
                    onChange={(e) => {
                      setEnableStreaming(e.target.checked);
                      localStorage.setItem('solvegpt_streaming', String(e.target.checked));
                    }}
                    className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">Creativity & Temperature</span>
                  <span className="text-emerald-400 font-mono">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setTemperature(v);
                    localStorage.setItem('solvegpt_temp', String(v));
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Precise / Strict</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. VOICE & SPEECH TAB */}
          {activeTab === 'voice' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h4 className="text-lg font-bold text-white">Voice & Audio Settings</h4>
                <p className="text-xs text-slate-400 mt-0.5">Control speech synthesis speed, preferred accent, and read-aloud options.</p>
              </div>

              {/* Voice Language */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <label className="text-xs font-semibold text-white block">Preferred Speech Voice</label>
                <select
                  value={voiceLang}
                  onChange={(e) => {
                    setVoiceLang(e.target.value);
                    localStorage.setItem('solvegpt_voice_lang', e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="hi-IN">🇮🇳 हिन्दी Voice (Hindi)</option>
                  <option value="en-US">🌐 Natural English (US)</option>
                  <option value="es-ES">🇪🇸 Español</option>
                  <option value="fr-FR">🇫🇷 Français</option>
                  <option value="de-DE">🇩🇪 Deutsch</option>
                  <option value="ar-SA">🇸🇦 العربية</option>
                  <option value="ja-JP">🇯🇵 日本語</option>
                </select>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleTestVoice}
                    disabled={isPlayingTestAudio}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 shadow-xs transition-all"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>{isPlayingTestAudio ? 'Playing Sample...' : 'Test Voice Audio'}</span>
                  </button>
                </div>
              </div>

              {/* Speech Rate Slider */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-white">Speech Playback Speed</span>
                  <span className="text-emerald-400 font-mono">{voiceSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={voiceSpeed}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVoiceSpeed(v);
                    localStorage.setItem('solvegpt_voice_speed', String(v));
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0.75x (Slower)</span>
                  <span>1.0x (Standard)</span>
                  <span>1.5x (Faster)</span>
                </div>
              </div>

              {/* Auto Read Aloud Toggle */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Auto-read Responses Aloud</div>
                  <div className="text-[11px] text-slate-400">Automatically speak replies as soon as they finish generating.</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoReadResponses}
                  onChange={(e) => {
                    setAutoReadResponses(e.target.checked);
                    localStorage.setItem('solvegpt_auto_read', String(e.target.checked));
                  }}
                  className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 5. GOOGLE ACCOUNT & PROFILE TAB (USER SPECIFIC REQUEST) */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h4 className="text-lg font-bold text-white">Google Account & Identity</h4>
                <p className="text-xs text-slate-400 mt-0.5">Manage your sign-in credentials, profile avatar, and synced data.</p>
              </div>

              {currentUser ? (
                /* Signed-in Card */
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 border-2 border-emerald-500/30 overflow-hidden shadow-md">
                      {currentUser.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {currentUser.provider === 'google' && (
                        <div className="absolute bottom-0 right-0 rounded-full bg-white p-0.5 shadow">
                          <GoogleGIcon className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h5 className="text-base font-bold text-white">{currentUser.name}</h5>
                      <p className="text-xs text-slate-400">{currentUser.email}</p>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Google Identity Active</span>
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-3 flex gap-2">
                    <button
                      onClick={onLogout}
                      className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all shadow-xs"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Google Login Action */
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg">
                    <GoogleGIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-white">Sign in with Google</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Connect your Google Account to save history across devices, access Gemini models, and manage custom preferences.
                    </p>
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    className="mx-auto flex items-center justify-center gap-3 rounded-2xl border border-slate-700 bg-white py-3 px-6 text-xs font-semibold text-slate-900 shadow-md hover:bg-slate-100 transition-all"
                  >
                    <GoogleGIcon className="h-4 w-4" />
                    <span>Continue with Google</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 6. DATA CONTROLS TAB */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h4 className="text-lg font-bold text-white">Data Controls & Export</h4>
                <p className="text-xs text-slate-400 mt-0.5">Download your data, backup chat logs, or wipe device cache.</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Export Conversations (JSON)</div>
                    <div className="text-[11px] text-slate-400">Download complete session history, messages, and photos.</div>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 shadow-xs transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
