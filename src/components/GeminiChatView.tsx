import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Search,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Image as ImageIcon,
  Video,
  Lightbulb,
  Cpu,
  Zap,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { ChatMessage, ChatRole, TabType } from '../types';

interface GeminiChatViewProps {
  onSelectPromptForPhoto: (prompt: string) => void;
  onSelectPromptForVideo: (prompt: string) => void;
  setActiveTab: (tab: TabType) => void;
}

export const GeminiChatView: React.FC<GeminiChatViewProps> = ({
  onSelectPromptForPhoto,
  onSelectPromptForVideo,
  setActiveTab,
}) => {
  const roles: ChatRole[] = [
    {
      id: 'general-solver',
      name: 'Master Problem Solver',
      description: 'Systematic root-cause diagnosis & actionable solutions',
      icon: '🧠',
      model: 'gemini-3.8-flash',
      enableSearch: true,
      systemInstruction:
        'You are an expert diagnostic consultant and multi-disciplinary problem solver. Given any technical, physical, scientific, or personal challenge, provide clear root causes, actionable steps, and concrete recommendations. If web facts are relevant, ground your answer in verified search data.',
    },
    {
      id: 'visual-director',
      name: 'Creative Visual Director',
      description: 'Prompt crafting for ultra-detailed photos & videos',
      icon: '🎨',
      model: 'gemini-3.8-flash',
      enableSearch: false,
      systemInstruction:
        'You are a world-class prompt engineer and Hollywood visual effects cinematographer. Your task is to turn user concepts into hyper-detailed photo and video prompts. Specify focal length, lighting (volumetric, chiaroscuro, golden hour), composition, textures, camera movement, and artistic style. Format suggested prompts with clear [PHOTO PROMPT] and [VIDEO PROMPT] tags.',
    },
    {
      id: 'deep-reasoner',
      name: 'Deep Reasoner & Architect',
      description: 'Complex math, coding, architecture & engineering logic',
      icon: '🔬',
      model: 'gemini-4-argon',
      enableSearch: false,
      systemInstruction:
        'You are an elite software architect, mathematician, and scientific researcher powered by gemini-4-argon. Analyze difficult problems with rigorous chain-of-thought logic, robust code examples, and mathematical precision.',
    },
    {
      id: 'fast-assistant',
      name: 'Fast Assistant',
      description: 'Instant answers, rapid summaries, and quick syntax checks',
      icon: '⚡',
      model: 'gemini-3.1-flash-lite',
      enableSearch: false,
      systemInstruction:
        'You are an ultra-fast, concise assistant. Answer directly, provide quick bullet points, and eliminate conversational filler.',
    },
    {
      id: 'web-researcher',
      name: 'Search Grounded Researcher',
      description: 'Live web facts, recent news, prices, and specifications',
      icon: '🌐',
      model: 'gemini-3.8-flash',
      enableSearch: true,
      systemInstruction:
        'You are a real-time web researcher. Always use Google Search grounding to retrieve up-to-date facts, current events, software versions, and verified empirical data.',
    },
  ];

  const [selectedRole, setSelectedRole] = useState<ChatRole>(roles[0]);
  const [selectedModel, setSelectedModel] = useState<
    'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'
  >('gemini-3.8-flash');
  const [enableSearch, setEnableSearch] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initialize with welcoming role message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_initial',
      role: 'model',
      text: "Hello! I am your Gemini reasoning assistant. Ask me anything—troubleshoot broken appliances, debug complex software, unpack scientific phenomena, or ask me to generate high-fidelity photo and video prompts for your ideas.",
      timestamp: Date.now(),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleRoleChange = (role: ChatRole) => {
    setSelectedRole(role);
    setSelectedModel(role.model);
    if (role.enableSearch !== undefined) {
      setEnableSearch(role.enableSearch);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setLoading(true);

    try {
      // Send conversation history to server
      const payloadMessages = newHistory.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          model: selectedModel,
          systemInstruction: selectedRole.systemInstruction,
          enableSearch: enableSearch && selectedModel !== 'gemini-3.1-flash-lite',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch model response.');
      }

      const modelMsg: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: Date.now(),
        modelUsed: data.modelUsed || selectedModel,
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'model',
        text: `⚠️ Error: ${err?.message || 'Failed to communicate with Gemini.'}`,
        timestamp: Date.now(),
        modelUsed: selectedModel,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg_${Date.now()}`,
        role: 'model',
        text: `Chat reset. Selected role: ${selectedRole.name}. How can I assist you?`,
        timestamp: Date.now(),
        modelUsed: selectedModel,
      },
    ]);
  };

  const quickPrompts = [
    'How do I calibrate a 3D printer bed that is not sticking?',
    'Design a photorealistic prompt of a cyberpunk hydroponics garden',
    'Write a step-by-step diagnostic guide for a car battery drain',
    'Explain the math behind transformer attention mechanisms',
  ];

  return (
    <div className="mx-auto flex h-[calc(100vh-4.5rem)] max-w-7xl flex-col px-4 py-4 sm:px-6">
      {/* Header with Role & Model Selection */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Role Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleChange(role)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                selectedRole.id === role.id
                  ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span>{role.icon}</span>
              <span>{role.name}</span>
            </button>
          ))}
        </div>

        {/* Model & Search Toggles */}
        <div className="flex items-center gap-2">
          {/* Model selector */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 p-1 text-xs">
            <span className="px-2 text-slate-400 font-medium">Model:</span>
            {(['gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.1-flash-lite'] as const).map(
              (m) => (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
                    selectedModel === m
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m === 'gemini-3.8-flash'
                    ? '3.8 Flash'
                    : m === 'gemini-4-argon'
                    ? '4 Argon (Complex)'
                    : '3.1 Lite (Fast)'}
                </button>
              )
            )}
          </div>

          {/* Google Search Grounding toggle */}
          <button
            onClick={() => setEnableSearch(!enableSearch)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              enableSearch
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-800 bg-slate-900/40 text-slate-500 hover:text-slate-400'
            }`}
            title="Ground answers with live Google Search web results"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search Grounding</span>
          </button>

          {/* Clear chat */}
          <button
            onClick={handleClearChat}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-all"
            title="Clear Chat History"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`group relative max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                    : 'border border-slate-800 bg-slate-900/80 text-slate-200 backdrop-blur'
                }`}
              >
                {/* Message Header info for model */}
                {!isUser && msg.modelUsed && (
                  <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1">
                    <span className="font-semibold text-indigo-400">
                      {msg.modelUsed}
                    </span>
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 hover:text-white transition-opacity"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Grounding Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 mb-1.5">
                      <Search className="h-3 w-3" />
                      <span>Google Search Sources:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          <span className="truncate max-w-[140px]">{src.title}</span>
                          <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick actions for model messages: Send to Photo or Video Studio */}
                {!isUser && msg.text.length > 30 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-xs">
                    <span className="text-[10px] text-slate-500">Quick Visualizer:</span>
                    <button
                      onClick={() => {
                        onSelectPromptForPhoto(msg.text.slice(0, 300));
                        setActiveTab('photos');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                      title="Use this response as prompt in Photo Studio"
                    >
                      <ImageIcon className="h-3 w-3" />
                      <span>Create Photo</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={() => {
                        onSelectPromptForVideo(msg.text.slice(0, 300));
                        setActiveTab('videos');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-fuchsia-400 hover:text-fuchsia-300"
                      title="Use this response as prompt in Video Studio"
                    >
                      <Video className="h-3 w-3" />
                      <span>Create Video</span>
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Bot className="h-4 w-4 animate-spin" />
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                Thinking with {selectedModel}
                {enableSearch ? ' + Google Search' : ''}...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar (when chat is short) */}
      {messages.length <= 2 && (
        <div className="my-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500">Suggestions:</span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Composer */}
      <div className="mt-3 border-t border-slate-800 pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Message ${selectedRole.name} (${selectedModel})...`}
            disabled={loading}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 pr-24 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="absolute right-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span>Send</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
