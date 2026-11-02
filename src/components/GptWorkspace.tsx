import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Plus,
  Sparkles,
  Search,
  Globe,
  PanelLeftOpen,
  Image as ImageIcon,
  Video,
  Lightbulb,
  Copy,
  Check,
  Download,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  Play,
  Pause,
  Square,
  Wrench,
  Clock,
  BookOpen,
  X,
  Maximize2,
  Activity,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Languages,
  Wand2,
  Settings,
  Keyboard,
} from 'lucide-react';
import {
  ChatMessage,
  CreationMode,
  GeneratedPhoto,
  GeneratedVideo,
  ProblemSolution,
} from '../types';
import { GptLogo } from './GptLogo';
import { exportAsset } from '../utils/exportUtils';
import { UserAccount, GoogleGIcon } from './AuthModal';

interface GptWorkspaceProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  messages: ChatMessage[];
  onSendMessage: (
    text: string,
    mode: CreationMode,
    model: string,
    enableSearch: boolean,
    aspectRatio: string,
    referenceImage?: string | null,
    userLanguage?: string
  ) => Promise<void>;
  loading: boolean;
  onNewChat: () => void;
  activeMode: CreationMode;
  setActiveMode: (mode: CreationMode) => void;
  hasApiKey?: boolean;
  onOpenDebug?: () => void;
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
  currentUser?: UserAccount | null;
  onOpenAuth?: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (US)', native: 'English', flag: '🇺🇸', desc: 'Strict English responses' },
  { code: 'auto', label: 'Auto-Detect', native: 'Auto', flag: '🌐', desc: 'Replies in the language you type' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)', native: 'हिन्दी', flag: '🇮🇳', desc: 'Pure Devanagari Hindi responses' },
  { code: 'hi-Latn', label: 'Hinglish (Hindi in Latin)', native: 'Hinglish', flag: '🇮🇳', desc: 'Conversational Hindi in English alphabet' },
  { code: 'es-ES', label: 'Español', native: 'Español', flag: '🇪🇸', desc: 'Spanish' },
  { code: 'fr-FR', label: 'Français', native: 'Français', flag: '🇫🇷', desc: 'French' },
  { code: 'de-DE', label: 'Deutsch', native: 'Deutsch', flag: '🇩🇪', desc: 'German' },
  { code: 'ar-SA', label: 'العربية (Arabic)', native: 'العربية', flag: '🇸🇦', desc: 'Arabic' },
  { code: 'ja-JP', label: '日本語 (Japanese)', native: '日本語', flag: '🇯🇵', desc: 'Japanese' },
];

export const GptWorkspace: React.FC<GptWorkspaceProps> = ({
  sidebarOpen,
  onToggleSidebar,
  messages,
  onSendMessage,
  loading,
  onNewChat,
  activeMode,
  setActiveMode,
  hasApiKey = true,
  onOpenDebug,
  onOpenSettings,
  onOpenShortcuts,
  currentUser,
  onOpenAuth,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'>('gemini-3.1-flash-lite');
  const [enableSearch, setEnableSearch] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('16:9');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportedId, setExportedId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<GeneratedPhoto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Language & Speech Recognition (Voice Dictation / STT)
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>(() => {
    const saved = localStorage.getItem('solvegpt_lang');
    if (saved && saved !== 'hi-IN') return saved;
    return 'en-US';
  });
  const [speechSupported, setSpeechSupported] = useState(false);
  const [autoSendOnSpeech, setAutoSendOnSpeech] = useState<boolean>(() => {
    return localStorage.getItem('solvegpt_auto_send_voice') === 'true';
  });
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // Speech Synthesis (Audio Read-Aloud / TTS)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isSpeakingPaused, setIsSpeakingPaused] = useState(false);
  const [speakingTextSnippet, setSpeakingTextSnippet] = useState('');
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const val = localStorage.getItem('solvegpt_voice_speed');
    return val ? parseFloat(val) : 1.0;
  });
  const [autoReadResponses, setAutoReadResponses] = useState<boolean>(() => {
    return localStorage.getItem('solvegpt_auto_read') === 'true';
  });
  const lastSpokenMessageIdRef = useRef<string | null>(null);

  // Prompt Enhancer
  const [isEnhancing, setIsEnhancing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Listen for focus input event (Ctrl+I shortcut)
  useEffect(() => {
    const handleFocusInputEvent = () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    };
    window.addEventListener('focus_prompt_input', handleFocusInputEvent);
    return () => {
      window.removeEventListener('focus_prompt_input', handleFocusInputEvent);
    };
  }, []);

  // Sync language with localStorage & settings changes
  useEffect(() => {
    const handleSync = (e: any) => {
      const code = e.detail || localStorage.getItem('solvegpt_lang');
      if (code && code !== selectedLang) {
        setSelectedLang(code);
      }
    };
    window.addEventListener('solvegpt_lang_changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('solvegpt_lang_changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [selectedLang]);

  const handleLanguageSelect = (code: string) => {
    setSelectedLang(code);
    localStorage.setItem('solvegpt_lang', code);
    window.dispatchEvent(new CustomEvent('solvegpt_lang_changed', { detail: code }));
    setLangDropdownOpen(false);
  };

  // Check speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
    }
  }, []);

  // Ensure speech synthesis voices load
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Auto-Read Aloud on model response arrival
  useEffect(() => {
    if (!autoReadResponses || loading || messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (latest.role === 'model' && !latest.isStreaming && latest.text.trim()) {
      if (lastSpokenMessageIdRef.current !== latest.id) {
        lastSpokenMessageIdRef.current = latest.id;
        handleSpeak(latest.text, latest.id);
      }
    }
  }, [messages, loading, autoReadResponses]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea like ChatGPT
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (textOverride?: string, modeOverride?: CreationMode) => {
    const textToSubmit = textOverride !== undefined ? textOverride : inputText;
    const modeToUse = modeOverride || activeMode;

    if (!textToSubmit.trim() || loading) return;

    // If listening, stop microphone
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    onSendMessage(
      textToSubmit.trim(),
      modeToUse,
      selectedModel,
      enableSearch,
      aspectRatio,
      referenceImage,
      selectedLang
    );

    setInputText('');
    setReferenceImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = async (url: string, filename: string, id: string) => {
    const success = await exportAsset(url, filename);
    if (success) {
      setExportedId(id);
      setTimeout(() => setExportedId(null), 2500);
    }
  };

  // -------------------------------------------------------------
  // Voice Input (Speech-to-Text) Implementation
  // -------------------------------------------------------------
  const toggleListening = () => {
    if (isListening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      const speechLang = selectedLang === 'auto'
        ? 'en-US'
        : selectedLang === 'hi-Latn'
        ? 'en-IN'
        : selectedLang;
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += trans;
          } else {
            interimStr += trans;
          }
        }

        if (finalStr.trim()) {
          setInputText((prev) => (prev ? `${prev.trim()} ${finalStr.trim()}` : finalStr.trim()));
          setInterimTranscript('');
        } else if (interimStr.trim()) {
          setInterimTranscript(interimStr.trim());
        }

        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
        }

        // Auto-send on silence detection
        if (autoSendOnSpeech) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            const currentText = textareaRef.current?.value || '';
            if (currentText.trim() && recognitionRef.current) {
              recognitionRef.current.stop();
              setIsListening(false);
              setInterimTranscript('');
              handleSubmit(currentText.trim());
            }
          }, 1800);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e?.error);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
      setInterimTranscript('');
    }
  };

  // -------------------------------------------------------------
  // Voice Output (Text-to-Speech / Read Aloud) Implementation
  // -------------------------------------------------------------
  const keepAliveTimerRef = useRef<any>(null);

  const cleanMarkdownForVoice = (rawText: string): string => {
    return rawText
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  };

  const handleSpeak = (text: string, msgId: string, customRate?: number) => {
    if (!('speechSynthesis' in window)) {
      showToast('Speech audio playback is not supported in this browser.');
      return;
    }

    // Toggle pause/resume if already speaking this message
    if (speakingMsgId === msgId && customRate === undefined) {
      if (window.speechSynthesis.speaking) {
        if (isSpeakingPaused) {
          window.speechSynthesis.resume();
          setIsSpeakingPaused(false);
        } else {
          window.speechSynthesis.pause();
          setIsSpeakingPaused(true);
        }
        return;
      }
    }

    // Stop existing speech and clear timer
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    window.speechSynthesis.cancel();
    setSpeakingMsgId(null);
    setIsSpeakingPaused(false);

    const cleanText = cleanMarkdownForVoice(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Auto-detect Devanagari Hindi or user-selected language
    const isDevanagari = /[\u0900-\u097F]/.test(text);
    const targetLang = isDevanagari
      ? 'hi-IN'
      : selectedLang === 'auto' || selectedLang.startsWith('en') || selectedLang === 'hi-Latn'
      ? 'en-US'
      : selectedLang;
    utterance.lang = targetLang;
    const rateToUse = customRate !== undefined ? customRate : speechRate;
    utterance.rate = isDevanagari ? rateToUse * 0.95 : rateToUse;
    utterance.pitch = 1.0;

    // Pick best matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(
      (v) =>
        v.lang === targetLang ||
        v.lang.startsWith(targetLang.slice(0, 2)) ||
        (isDevanagari && (v.name.toLowerCase().includes('hindi') || v.lang.includes('hi')))
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
      setSpeakingMsgId(null);
      setIsSpeakingPaused(false);
      setSpeakingTextSnippet('');
    };

    utterance.onerror = () => {
      if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
      setSpeakingMsgId(null);
      setIsSpeakingPaused(false);
      setSpeakingTextSnippet('');
    };

    setSpeakingMsgId(msgId);
    setSpeakingTextSnippet(cleanText.slice(0, 80));
    window.speechSynthesis.speak(utterance);

    // Chrome 15-second speech keep-alive ping
    keepAliveTimerRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(keepAliveTimerRef.current);
      } else {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  };

  const handleStopSpeech = () => {
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    setIsSpeakingPaused(false);
    setSpeakingTextSnippet('');
  };

  // -------------------------------------------------------------
  // Prompt Enhancer (Magic Wand)
  // -------------------------------------------------------------
  const handleEnhancePrompt = async () => {
    if (!inputText.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputText,
          type: activeMode === 'video' ? 'video' : 'photo',
        }),
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        setInputText(data.enhancedPrompt);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
        }
      }
    } catch (e) {
      console.warn('Enhance failed:', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Suggestion cards
  const suggestionCards = [
    {
      title: '🚗 Car Troubleshooting & Fix',
      desc: 'Rapid clicking sound when turning the key and engine will not start',
      mode: 'solver' as CreationMode,
      prompt: 'My car will not start and makes a rapid clicking sound when turning the key, diagnose the root cause and provide step-by-step fix',
      icon: Lightbulb,
      color: 'text-amber-400',
    },
    {
      title: '🎨 8K Photorealistic Photo',
      desc: 'Red modern sports car driving on coastal highway at sunset',
      mode: 'photo' as CreationMode,
      prompt: 'Red modern sports car driving on coastal highway at sunset, high quality photograph, 8k resolution, cinematic lighting',
      icon: ImageIcon,
      color: 'text-indigo-400',
    },
    {
      title: '🎬 Cinematic Motion Video',
      desc: 'Cinematic drone flyover shot of pine forests and snowy mountains',
      mode: 'video' as CreationMode,
      prompt: 'Cinematic drone flyover shot of pine forests and snowy mountains during golden hour, 4k 60fps',
      icon: Video,
      color: 'text-fuchsia-400',
    },
    {
      title: '💻 Code Diagnosis & Bug Fix',
      desc: 'Diagnose and resolve CORS preflight errors in Express and TypeScript',
      mode: 'chat' as CreationMode,
      prompt: 'Why does CORS error happen? Show production Express.js and TypeScript middleware to fix preflight OPTIONS requests',
      icon: Sparkles,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="flex h-screen flex-1 flex-col bg-slate-900 text-slate-100 relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-slate-700 bg-slate-950/95 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-md animate-fadeIn flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header - ChatGPT & Gemini Hybrid Aesthetic */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-800/80 bg-slate-900/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title={`Open sidebar (${modKey}+B)`}
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          )}

          {/* Model Selector Dropdown (ChatGPT / Gemini pill) */}
          <div className="relative">
            <button
              onClick={() => {
                setModelDropdownOpen(!modelDropdownOpen);
                setLangDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:border-slate-600 hover:bg-slate-800/80 transition-all shadow-xs"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {selectedModel === 'gemini-3.1-flash-lite'
                  ? '⚡ SolveGPT Fast Multilingual'
                  : selectedModel === 'gemini-3.8-flash'
                  ? '✨ SolveGPT 3.8 Flash'
                  : '🧠 SolveGPT 4 Argon'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-2xl z-50 animate-fadeIn">
                <button
                  onClick={() => {
                    setSelectedModel('gemini-3.1-flash-lite');
                    setModelDropdownOpen(false);
                  }}
                  className={`flex w-full flex-col rounded-xl p-2.5 text-left text-xs transition-colors ${
                    selectedModel === 'gemini-3.1-flash-lite'
                      ? 'bg-slate-800/90 text-white border border-emerald-500/30'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>⚡ SolveGPT Fast Multilingual</span>
                    </span>
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300 font-bold">Ultra Fast</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Instant streaming, rapid responses & multilingual reasoning
                  </span>
                </button>

                <button
                  onClick={() => {
                    setSelectedModel('gemini-3.8-flash');
                    setModelDropdownOpen(false);
                  }}
                  className={`flex w-full flex-col rounded-xl p-2.5 text-left text-xs transition-colors mt-1 ${
                    selectedModel === 'gemini-3.8-flash'
                      ? 'bg-slate-800/90 text-white border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span>✨ SolveGPT 3.8 Flash</span>
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] text-indigo-300 font-bold">Google Grounded</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Multimodal reasoning with live web search facts
                  </span>
                </button>

                <button
                  onClick={() => {
                    setSelectedModel('gemini-4-argon');
                    setModelDropdownOpen(false);
                  }}
                  className={`flex w-full flex-col rounded-xl p-2.5 text-left text-xs transition-colors mt-1 ${
                    selectedModel === 'gemini-4-argon'
                      ? 'bg-slate-800/90 text-white border border-purple-500/30'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span>🧠 SolveGPT 4 Argon</span>
                    <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-300 font-bold">Deep Thinker</span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Advanced complex STEM logic, math, and code architecture
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Header: Speech Language Selector, Search Grounding & Debug */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setLangDropdownOpen(!langDropdownOpen);
                setModelDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-all shadow-xs"
              title="Primary AI Response & Voice Language"
            >
              <Languages className="h-3.5 w-3.5 text-indigo-400" />
              <span>
                {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.native || 'English'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-slate-950 p-1.5 shadow-2xl z-50 animate-fadeIn">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  AI Language Preference
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors ${
                      selectedLang === lang.code
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 ml-6">{lang.desc}</span>
                    </div>
                    {selectedLang === lang.code && (
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auto Read Toggle */}
          <button
            onClick={() => {
              const nextVal = !autoReadResponses;
              setAutoReadResponses(nextVal);
              localStorage.setItem('solvegpt_auto_read', String(nextVal));
            }}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
              autoReadResponses
                ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-xs'
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Auto-read model responses aloud when generated"
          >
            {autoReadResponses ? (
              <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span className="hidden xl:inline">Auto Read: {autoReadResponses ? 'ON' : 'OFF'}</span>
          </button>

          {/* Active Speaking Indicator with Stop Button */}
          {speakingMsgId && (
            <button
              onClick={handleStopSpeech}
              className="flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300 hover:bg-red-500/20 transition-all shadow-xs animate-pulse"
              title="Stop voice playback"
            >
              <Square className="h-3 w-3 fill-red-400 text-red-400" />
              <span>Stop Audio</span>
            </button>
          )}

          {/* Google Search Grounding Badge */}
          <button
            onClick={() => setEnableSearch(!enableSearch)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
              enableSearch
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-xs'
                : 'border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Google Search Grounding for live web facts"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search Grounded</span>
          </button>

          {onOpenDebug && (
            <button
              onClick={onOpenDebug}
              className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="System Diagnostics & Self-Test Panel"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden md:inline">Debug</span>
            </button>
          )}

          {/* Global Keyboard Shortcuts Modal Trigger */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors shadow-xs"
              title={`Keyboard Shortcuts (${modKey}+/ or ?)`}
            >
              <Keyboard className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden xl:inline">Shortcuts</span>
              <kbd className="hidden sm:inline-block rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[10px] text-slate-400">
                {modKey}+/
              </kbd>
            </button>
          )}

          {/* Settings Button (ChatGPT / Gemini style) */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-all shadow-xs"
              title={`Settings: Gemini API Key, Voice, Models, Theme (${modKey}+,)`}
            >
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          )}

          {/* User Account / Google Sign In */}
          {currentUser ? (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950 p-1 pr-2.5 hover:border-slate-700 transition-all"
              title={`Logged in as ${currentUser.name}`}
            >
              <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white overflow-hidden">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-full w-full object-cover" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-xs font-medium text-slate-200 hidden md:inline max-w-[90px] truncate">
                {currentUser.name}
              </span>
            </button>
          ) : (
            onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-100 shadow-xs transition-all"
                title="Sign in with Google"
              >
                <GoogleGIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )
          )}
        </div>
      </header>

      {/* API Key Status Notice */}
      {!hasApiKey && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <span>Notice: Running in Fast Multilingual built-in mode.</span>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="underline font-semibold hover:text-white text-amber-300"
            >
              Configure Gemini API Key in Settings
            </button>
          )}
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Empty State: ChatGPT + Gemini Hybrid Look */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-8 sm:pt-14 text-center">
              <div className="mb-4">
                <GptLogo size={68} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                What would you like to solve or create?
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-lg">
                Ask anything or speak with your voice. Generate 8K photorealistic photos, cinematic motion videos, and solve real-world problems with Google Search grounded intelligence.
              </p>

              {/* 4 Bilingual Suggestion Cards */}
              <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 text-left">
                {suggestionCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setActiveMode(card.mode);
                        handleSubmit(card.prompt, card.mode);
                      }}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4 hover:border-slate-700 hover:bg-slate-950 transition-all text-left shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className={`h-4 w-4 ${card.color}`} />
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                          {card.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {card.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Message List */
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isThisSpeaking = speakingMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="mt-0.5 shrink-0">
                      <GptLogo size={30} />
                    </div>
                  )}

                  <div
                    className={`group relative max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-slate-800 text-white rounded-br-xs'
                        : 'bg-slate-950/40 border border-slate-800/60 text-slate-100'
                    }`}
                  >
                    {/* User Reference Image (if attached) */}
                    {isUser && msg.referenceImage && (
                      <div className="mb-2 overflow-hidden rounded-lg border border-slate-700 max-w-xs">
                        <img
                          src={msg.referenceImage}
                          alt="Attachment"
                          className="max-h-48 w-full object-cover"
                        />
                      </div>
                    )}

                    {/* Standard Text Body */}
                    <div className="whitespace-pre-wrap">
                      {msg.text}
                      {msg.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1.5 align-middle bg-emerald-400 animate-pulse rounded-xs shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      )}
                    </div>

                    {/* PHOTO OUTPUT CARD */}
                    {msg.photoData && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
                        <div
                          className="group/photo relative cursor-pointer bg-black flex items-center justify-center max-h-[440px]"
                          onClick={() => setPreviewPhoto(msg.photoData!)}
                        >
                          <img
                            src={msg.photoData.url}
                            alt={msg.photoData.prompt}
                            className="max-h-[440px] w-auto max-w-full object-contain"
                          />
                          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/photo:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExport(msg.photoData!.url, `solvegpt_photo_${msg.id}.png`, msg.id);
                              }}
                              className="flex items-center gap-1.5 rounded-lg bg-black/80 hover:bg-black border border-white/20 px-2.5 py-1 text-xs font-medium text-white backdrop-blur shadow-md transition-all"
                              title="Export Photo"
                            >
                              <Download className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Export</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-800/80 p-3 bg-slate-900/90">
                          <span className="text-[11px] text-slate-400 truncate max-w-[220px]">
                            {msg.photoData.aspectRatio} • {msg.photoData.style || 'Photorealistic 8K'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopy(msg.photoData!.prompt, msg.id)}
                              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white"
                              title="Copy prompt"
                            >
                              {copiedId === msg.id ? 'Copied' : 'Copy'}
                            </button>
                            <button
                              onClick={() => handleExport(msg.photoData!.url, `solvegpt_photo_${msg.id}.png`, msg.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-all shadow-xs"
                              title="Export photo to device"
                            >
                              {exportedId === msg.id ? (
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
                            <button
                              onClick={() => {
                                onSendMessage(
                                  `Cinematic motion animation of this scene: ${msg.photoData!.prompt}`,
                                  'video',
                                  selectedModel,
                                  enableSearch,
                                  '16:9',
                                  msg.photoData!.url
                                );
                              }}
                              className="rounded-lg bg-fuchsia-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-fuchsia-500 transition-colors flex items-center gap-1"
                              title="Animate this photo into an AI video"
                            >
                              <Video className="h-3.5 w-3.5" />
                              <span>Animate</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VIDEO OUTPUT CARD */}
                    {msg.videoData && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
                        <div className="bg-black flex items-center justify-center max-h-[440px]">
                          <video
                            src={msg.videoData.url}
                            controls
                            autoPlay
                            loop
                            playsInline
                            className="max-h-[440px] w-auto max-w-full rounded-t-xl"
                          />
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-800/80 p-3 bg-slate-900/90">
                          <span className="text-[11px] text-slate-400">
                            {msg.videoData.aspectRatio} • {msg.videoData.duration} • {msg.videoData.resolution}
                          </span>
                          <button
                            onClick={() => handleExport(msg.videoData!.url, `solvegpt_video_${msg.id}.mp4`, msg.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold text-fuchsia-300 hover:bg-fuchsia-500/20 hover:text-white transition-all shadow-xs"
                            title="Export video to device"
                          >
                            {exportedId === msg.id ? (
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
                    )}

                    {/* PROBLEM SOLVER OUTPUT CARD */}
                    {msg.solutionData && (
                      <div className="mt-3 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 sm:p-5 shadow-xl">
                        <div className="border-b border-slate-800 pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
                              {msg.solutionData.category || 'Diagnostic Plan'}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {msg.solutionData.estimatedTime}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Wrench className="h-3 w-3" />
                                {msg.solutionData.difficulty}
                              </span>
                            </div>
                          </div>
                          <h4 className="mt-2 text-base font-bold text-white">
                            {msg.solutionData.title}
                          </h4>
                          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                            {msg.solutionData.summary}
                          </p>
                        </div>

                        {/* Safety warnings if present */}
                        {msg.solutionData.safetyPrecautions && msg.solutionData.safetyPrecautions.length > 0 && (
                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                            <div className="font-semibold flex items-center gap-1 text-amber-300 mb-1">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>सुरक्षा सावधानी (Safety Precaution)</span>
                            </div>
                            <ul className="list-disc list-inside space-y-0.5">
                              {msg.solutionData.safetyPrecautions.map((p, idx) => (
                                <li key={idx}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action Steps */}
                        <div className="space-y-3">
                          {msg.solutionData.steps?.map((step) => (
                            <div
                              key={step.stepNumber}
                              className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5"
                            >
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                                  {step.stepNumber}
                                </span>
                                <h5 className="font-semibold text-white text-xs sm:text-sm">
                                  {step.title}
                                </h5>
                              </div>
                              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                                {step.instruction}
                              </p>
                              {step.keyInsight && (
                                <div className="mt-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 p-2 text-[11px] text-indigo-300">
                                  💡 <strong>Key Insight:</strong> {step.keyInsight}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ACTION TOOLBAR: Copy + Listen (सुनो / Speak Aloud) */}
                    {!isUser && (
                      <div className="mt-3 flex items-center gap-2 border-t border-slate-800/40 pt-2 text-xs">
                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-[11px] text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>

                        {/* Read Aloud Voice Button */}
                        <button
                          onClick={() => handleSpeak(msg.text, msg.id)}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                            isThisSpeaking
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                          title="Listen to this response aloud"
                        >
                          {isThisSpeaking ? (
                            isSpeakingPaused ? (
                              <>
                                <Play className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Resume</span>
                              </>
                            ) : (
                              <>
                                <span className="flex items-center gap-0.5">
                                  <span className="h-2 w-1 bg-emerald-400 animate-pulse rounded-xs" />
                                  <span className="h-3.5 w-1 bg-emerald-400 animate-pulse delay-75 rounded-xs" />
                                  <span className="h-2.5 w-1 bg-emerald-400 animate-pulse delay-150 rounded-xs" />
                                </span>
                                <span>Pause</span>
                              </>
                            )
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        {/* Stop Voice button if currently reading this message */}
                        {isThisSpeaking && (
                          <button
                            onClick={handleStopSpeech}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                            title="Stop audio playback"
                          >
                            <Square className="h-3 w-3 fill-current" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {loading && !messages.some((m) => m.isStreaming) && (
            <div className="flex gap-3 items-center">
              <GptLogo size={30} />
              <div className="flex items-center gap-2 rounded-2xl bg-slate-800/80 px-4 py-2.5 text-xs text-slate-300 shadow-sm">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                <span>
                  {activeMode === 'photo'
                    ? 'Creating 8K photo...'
                    : activeMode === 'video'
                    ? 'Creating cinematic video clip...'
                    : activeMode === 'solver'
                    ? 'Searching Google & diagnosing solution...'
                    : 'Thinking...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Bottom Prompt Bar (ChatGPT / Gemini Curved Aesthetic) */}
      <div className="p-4 pt-0">
        <div className="mx-auto max-w-3xl">
          {/* Mode Pill Switcher */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'auto' as CreationMode, label: '✨ Auto', tip: 'Auto-detects photo, video, or problem' },
                { id: 'solver' as CreationMode, label: '💡 Solve Problem', tip: 'Diagnose real-world issue with Google Search' },
                { id: 'photo' as CreationMode, label: '🎨 Make Photo', tip: 'Generate 8K photorealistic image' },
                { id: 'video' as CreationMode, label: '🎬 Make Video', tip: 'Generate motion video' },
                { id: 'chat' as CreationMode, label: '💬 Chat', tip: 'Direct conversation' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMode(m.id)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    activeMode === m.id
                      ? 'bg-slate-700 text-white font-semibold shadow-xs'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                  title={m.tip}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Aspect Ratio (if in photo/video mode) */}
            {(activeMode === 'photo' || activeMode === 'video' || activeMode === 'auto') && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>Ratio:</span>
                {(['1:1', '16:9', '9:16'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      aspectRatio === r
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reference Image preview if attached */}
          {referenceImage && (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 p-2 max-w-sm shadow-md">
              <img
                src={referenceImage}
                alt="Preview"
                className="h-12 w-12 rounded object-cover"
              />
              <div className="flex-1 text-[11px] text-slate-300 truncate">
                Reference image attached for image-to-image or video animation
              </div>
              <button
                onClick={() => setReferenceImage(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Floating Voice Player Dock (when speaking model responses aloud) */}
          {speakingMsgId && (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md animate-fadeIn">
              <div className="flex items-center gap-3">
                {/* 5 animated equalizer bars */}
                <div className="flex items-end gap-1 h-5 px-1">
                  <span className={`w-1 bg-emerald-400 rounded-full transition-all ${!isSpeakingPaused ? 'animate-bounce [animation-delay:-0.3s] h-4' : 'h-2'}`} />
                  <span className={`w-1 bg-emerald-400 rounded-full transition-all ${!isSpeakingPaused ? 'animate-bounce [animation-delay:-0.15s] h-5' : 'h-3'}`} />
                  <span className={`w-1 bg-emerald-400 rounded-full transition-all ${!isSpeakingPaused ? 'animate-bounce h-2' : 'h-1'}`} />
                  <span className={`w-1 bg-emerald-400 rounded-full transition-all ${!isSpeakingPaused ? 'animate-bounce [animation-delay:-0.2s] h-4' : 'h-2'}`} />
                  <span className={`w-1 bg-emerald-400 rounded-full transition-all ${!isSpeakingPaused ? 'animate-bounce [animation-delay:-0.4s] h-3' : 'h-1'}`} />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <span>Speaking Response</span>
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[10px] text-indigo-300">
                      {selectedLang.startsWith('hi') ? 'Hindi Voice' : selectedLang}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                    "{speakingTextSnippet || 'Reading response aloud'}..."
                  </div>
                </div>
              </div>

              {/* Player Controls */}
              <div className="flex items-center gap-2 ml-auto">
                {/* Play/Pause */}
                <button
                  onClick={() => {
                    if (speakingMsgId) {
                      const cur = messages.find(m => m.id === speakingMsgId);
                      if (cur) handleSpeak(cur.text, cur.id);
                    }
                  }}
                  className="flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 shadow-xs transition-all"
                >
                  {isSpeakingPaused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-amber-400" />}
                  <span>{isSpeakingPaused ? 'Resume' : 'Pause'}</span>
                </button>

                {/* Speed Multiplier */}
                <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-[10px]">
                  {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setSpeechRate(rate);
                        localStorage.setItem('solvegpt_voice_speed', String(rate));
                        const cur = messages.find(m => m.id === speakingMsgId);
                        if (cur) handleSpeak(cur.text, cur.id, rate);
                      }}
                      className={`px-1.5 py-0.5 rounded-lg font-mono ${
                        speechRate === rate
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* Stop button */}
                <button
                  onClick={handleStopSpeech}
                  className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-all"
                  title="Stop audio playback"
                >
                  <Square className="h-3 w-3 fill-red-400 text-red-400" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Voice Listening Banner with Auto-Send & Equalizer */}
          {isListening && (
            <div className="mb-2 rounded-2xl border border-red-500/50 bg-red-950/30 p-3 text-xs text-red-200 shadow-xl backdrop-blur-md animate-fadeIn">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-3 w-3 rounded-full bg-red-500 animate-ping" />
                  <span className="font-bold text-white text-xs sm:text-sm">
                    🎙️ Listening... speak your prompt ({SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.native || 'English'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Auto Send Toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-700">
                    <input
                      type="checkbox"
                      checked={autoSendOnSpeech}
                      onChange={(e) => {
                        setAutoSendOnSpeech(e.target.checked);
                        localStorage.setItem('solvegpt_auto_send_voice', String(e.target.checked));
                      }}
                      className="accent-emerald-500 rounded"
                    />
                    <span className="font-semibold text-emerald-400">⚡ Auto-Send</span>
                  </label>

                  {/* Send Voice Prompt Button */}
                  <button
                    onClick={() => {
                      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                      if (recognitionRef.current) recognitionRef.current.stop();
                      setIsListening(false);
                      const fullText = (inputText.trim() + ' ' + interimTranscript.trim()).trim();
                      if (fullText) {
                        handleSubmit(fullText);
                      }
                    }}
                    disabled={!inputText.trim() && !interimTranscript.trim()}
                    className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm transition-all"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send Voice</span>
                  </button>

                  {/* Stop Mic */}
                  <button
                    onClick={toggleListening}
                    className="rounded-xl bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* Live audio equalizer bars + interim transcript */}
              <div className="flex items-center gap-2 bg-slate-950/80 rounded-xl p-2.5 border border-red-500/20">
                <div className="flex items-end gap-0.5 h-4 shrink-0">
                  <span className="w-1 bg-red-400 rounded-full animate-bounce h-2" />
                  <span className="w-1 bg-red-400 rounded-full animate-bounce [animation-delay:-0.2s] h-4" />
                  <span className="w-1 bg-red-400 rounded-full animate-bounce [animation-delay:-0.4s] h-3" />
                  <span className="w-1 bg-red-400 rounded-full animate-bounce [animation-delay:-0.1s] h-4" />
                  <span className="w-1 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s] h-2" />
                </div>
                <div className="text-xs text-white truncate flex-1 font-medium">
                  {interimTranscript ? (
                    <span className="text-emerald-300 animate-pulse">{interimTranscript}</span>
                  ) : inputText.trim() ? (
                    <span>{inputText.slice(-90)}</span>
                  ) : (
                    <span className="text-slate-400 italic">Speak now to dictate your prompt...</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ChatGPT Curved Input Box */}
          <div className="relative flex items-end rounded-2xl border border-slate-700/80 bg-slate-950 p-2 shadow-2xl focus-within:border-slate-500 focus-within:ring-1 focus-within:ring-slate-500">
            {/* Attachment Button */}
            <label className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-colors" title="Attach reference image">
              <Plus className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Prompt Enhancer Magic Wand Button */}
            {inputText.trim().length > 3 && (
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-amber-400 hover:bg-slate-900 transition-colors ${
                  isEnhancing ? 'animate-spin' : ''
                }`}
                title="✨ Enhance prompt into 8K photorealistic detail"
              >
                <Wand2 className="h-4 w-4" />
              </button>
            )}

            {/* Input Textarea */}
            <textarea
              id="prompt-input"
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                activeMode === 'solver'
                  ? 'Describe any real-world problem or error (e.g. "car engine clicking sound won\'t start", "kitchen sink leaking")...'
                  : activeMode === 'photo'
                  ? 'Describe an 8K photo to create (e.g. "modern glass villa on cliffside at sunset, 8k resolution")...'
                  : activeMode === 'video'
                  ? 'Describe cinematic video motion (e.g. "drone flying over snowy mountain ridge at golden hour")...'
                  : 'Ask anything, solve problems, or generate 8K photos and videos...'
              }
              className="max-h-44 w-full resize-none bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
            />

            {/* Quick Focus Hint Badge */}
            {!inputText && (
              <span
                className="hidden lg:inline-flex items-center self-center px-1.5 py-0.5 rounded bg-slate-800/60 border border-slate-700/40 text-[10px] text-slate-500 font-mono select-none shrink-0 mr-1"
                title={`Press ${modKey}+I to focus prompt from anywhere`}
              >
                {modKey}+I
              </span>
            )}

            {/* Speech-to-Text Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                isListening
                  ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`}
              title={isListening ? 'Stop listening' : `Voice input (Dictate prompt in ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLang)?.native || 'English'})`}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleSubmit()}
              disabled={loading || (!inputText.trim() && !referenceImage)}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ml-1 ${
                inputText.trim() || referenceImage
                  ? 'bg-white text-black hover:bg-slate-200 shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
            <span>SolveGPT Multimodal Engine</span>
            <span>•</span>
            <span>Fast streaming, 8K photos & cinematic videos</span>
            <span>•</span>
            <button
              onClick={onOpenShortcuts}
              className="text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1 underline-offset-2 hover:underline"
              title="View all keyboard shortcuts"
            >
              <span>Shortcuts:</span>
              <kbd className="font-mono text-[10px] bg-slate-800/90 px-1 py-0.2 rounded border border-slate-700 text-slate-300">{modKey}+/</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Photo Preview */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-2"
          >
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
              <button
                onClick={() => handleExport(previewPhoto.url, `solvegpt_photo_${previewPhoto.id}.png`, previewPhoto.id)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md transition-all"
                title="Export this photo to device"
              >
                {exportedId === previewPhoto.id ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Exported!</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Photo</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="rounded-full bg-black/60 p-2 text-white hover:bg-black/90 transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={previewPhoto.url}
              alt={previewPhoto.prompt}
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain"
            />
            <div className="p-3 text-xs text-slate-300">
              "{previewPhoto.prompt}"
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
