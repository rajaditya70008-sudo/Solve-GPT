import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { GptWorkspace } from './components/GptWorkspace';
import { AuthModal, UserAccount } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { DebugDrawer } from './components/DebugDrawer';
import { ShortcutsModal } from './components/ShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import {
  ChatMessage,
  ChatSession,
  CreationMode,
  GeneratedPhoto,
  GeneratedVideo,
  GroundingSource,
} from './types';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMode, setActiveMode] = useState<CreationMode>('auto');
  const [isDebugDrawerOpen, setIsDebugDrawerOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('solvegpt_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.hasApiKey === 'boolean') {
          setHasApiKey(d.hasApiKey);
        }
      })
      .catch(() => {});

    // Ensure primary language is English by default
    const savedLang = localStorage.getItem('solvegpt_lang');
    if (!savedLang || savedLang === 'hi-IN') {
      localStorage.setItem('solvegpt_lang', 'en-US');
    }
  }, []);

  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('solvegpt_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return `session_${Date.now()}`;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Sync current session messages
  useEffect(() => {
    const currentSession = sessions.find((s) => s.id === currentSessionId);
    if (currentSession) {
      setMessages(currentSession.messages);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  // Persist sessions
  useEffect(() => {
    try {
      localStorage.setItem('solvegpt_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to persist sessions:', e);
    }
  }, [sessions]);

  // Handle new chat
  const handleNewChat = (mode: CreationMode = 'auto') => {
    const newId = `session_${Date.now()}`;
    setCurrentSessionId(newId);
    setActiveMode(mode);
    setMessages([]);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSessionId === id) {
      handleNewChat();
    }
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
  };

  const handleFocusInput = () => {
    const textarea = document.getElementById('prompt-input') as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.focus();
      const len = textarea.value.length;
      textarea.setSelectionRange(len, len);
    }
    window.dispatchEvent(new CustomEvent('focus_prompt_input'));
  };

  // Global Keyboard Shortcuts (Ctrl+N, Ctrl+B, Ctrl+I, Ctrl+,, Ctrl+/, Esc)
  useKeyboardShortcuts({
    onNewChat: () => handleNewChat(),
    onToggleSidebar: () => setSidebarOpen((prev) => !prev),
    onFocusInput: handleFocusInput,
    onOpenSettings: () => setIsSettingsModalOpen(true),
    onOpenShortcuts: () => setIsShortcutsOpen(true),
    onOpenDebug: () => setIsDebugDrawerOpen(true),
    onCloseModals: () => {
      setIsShortcutsOpen(false);
      setIsSettingsModalOpen(false);
      setIsDebugDrawerOpen(false);
      setIsAuthModalOpen(false);
    },
  });

  // Unified message handler
  const handleSendMessage = async (
    text: string,
    mode: CreationMode,
    model: string,
    enableSearch: boolean,
    aspectRatio: string,
    referenceImage?: string | null,
    userLanguage?: string
  ) => {
    const activeLang = userLanguage || localStorage.getItem('solvegpt_lang') || 'en-US';
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
      referenceImage: referenceImage || undefined,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    // Auto-detect intent if mode is 'auto'
    let effectiveMode = mode;
    if (effectiveMode === 'auto') {
      const lower = text.toLowerCase().trim();
      const isHindiPhoto = /फोटो|तस्वीर|चित्र/.test(text) || lower.includes('photo banao') || lower.includes('tasveer');
      const isHindiVideo = /वीडियो|चलचित्र|एनिमेट/.test(text) || lower.includes('video banao');
      const isHindiSolver = /खराबी|खराब|समस्या|मदद|ठीक करो|काम नहीं कर रहा|मरम्मत/.test(text) || lower.includes('theek karo') || lower.includes('samasya') || lower.includes('madad');

      if (
        isHindiPhoto ||
        lower.startsWith('make photo') ||
        lower.startsWith('make a photo') ||
        lower.startsWith('generate photo') ||
        lower.startsWith('generate a photo') ||
        lower.startsWith('create photo') ||
        lower.startsWith('create a photo') ||
        lower.startsWith('generate image') ||
        lower.startsWith('generate an image') ||
        lower.startsWith('draw') ||
        lower.startsWith('paint') ||
        lower.startsWith('render') ||
        lower.includes('photo of') ||
        lower.includes('picture of') ||
        lower.includes('image of') ||
        lower.includes('diagram of')
      ) {
        effectiveMode = 'photo';
      } else if (
        isHindiVideo ||
        lower.startsWith('make video') ||
        lower.startsWith('make a video') ||
        lower.startsWith('generate video') ||
        lower.startsWith('generate a video') ||
        lower.startsWith('create video') ||
        lower.startsWith('create a video') ||
        lower.startsWith('animate') ||
        lower.includes('video of') ||
        lower.includes('movie of') ||
        lower.includes('clip of') ||
        lower.includes('animation of')
      ) {
        effectiveMode = 'video';
      } else if (
        isHindiSolver ||
        lower.startsWith('solve') ||
        lower.startsWith('help solve') ||
        lower.startsWith('how to fix') ||
        lower.startsWith('how do i fix') ||
        lower.startsWith('how can i fix') ||
        lower.startsWith('why is my') ||
        lower.startsWith('troubleshoot') ||
        lower.includes('leaking') ||
        lower.includes('not working') ||
        lower.includes('won\'t start') ||
        lower.includes('wont start') ||
        lower.includes('error:') ||
        lower.includes('problem:')
      ) {
        effectiveMode = 'solver';
      } else {
        effectiveMode = 'chat';
      }
    }

    try {
      let modelMsg: ChatMessage | null = null;

      if (effectiveMode === 'photo') {
        // Clean prompt if user prefixed with "make photo of"
        const cleanPrompt = text
          .replace(/^(make (a )?photo of|generate (a )?photo of|create (a )?photo of|generate (an )?image of|make (an )?image of|create (an )?image of|photo of|picture of|draw (a )?|paint (a )?|फोटो बनाओ|चित्र बनाओ|तस्वीर बनाओ)\s+/i, '')
          .trim();

        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: cleanPrompt || text,
            aspectRatio,
            referenceImage: referenceImage || undefined,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate photo.');
        }

        const photo: GeneratedPhoto = {
          id: `photo_${Date.now()}`,
          url: data.imageUrl,
          prompt: data.prompt || text,
          aspectRatio: data.aspectRatio || aspectRatio,
          createdAt: Date.now(),
        };

        modelMsg = {
          id: `model_${Date.now()}`,
          role: 'model',
          text: `Here is your generated photo for "${cleanPrompt || text}":`,
          timestamp: Date.now(),
          modelUsed: data.source || 'gemini-nano-banana-2.1',
          photoData: photo,
          messageType: 'photo',
        };
      } else if (effectiveMode === 'video') {
        const cleanPrompt = text
          .replace(/^(make (a )?video of|generate (a )?video of|create (a )?video of|video of|clip of|movie of|animate (a )?)\s+/i, '')
          .trim();

        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: cleanPrompt || text,
            aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
            duration: '5s',
            resolution: '720p',
            referenceImage: referenceImage || undefined,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate video.');
        }

        const video: GeneratedVideo = {
          id: `video_${Date.now()}`,
          url: data.videoUrl,
          prompt: data.prompt || text,
          aspectRatio: data.aspectRatio || '16:9',
          duration: data.duration || '5s',
          resolution: data.resolution || '720p',
          createdAt: Date.now(),
        };

        modelMsg = {
          id: `model_${Date.now()}`,
          role: 'model',
          text: `Here is your generated video clip for "${cleanPrompt || text}":`,
          timestamp: Date.now(),
          modelUsed: data.source || 'gemini-omni-1.1-flash',
          videoData: video,
          messageType: 'video',
        };
      } else if (effectiveMode === 'solver') {
        const cleanProblem = text.replace(/^(solve:|solve\s+)/i, '').trim();

        const response = await fetch('/api/solve-problem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problem: cleanProblem || text,
            userLanguage: activeLang,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to diagnose problem.');
        }

        modelMsg = {
          id: `model_${Date.now()}`,
          role: 'model',
          text: `I've analyzed and diagnosed the problem using Google Search grounding. Here is your step-by-step resolution plan:`,
          timestamp: Date.now(),
          modelUsed: 'gemini-3.8-flash',
          sources: data.sources || [],
          solutionData: data.solution,
          messageType: 'solution',
        };
      } else {
        // Standard chat conversation with real-time SSE streaming
        const modelMsgId = `model_${Date.now()}`;
        const initialModelMsg: ChatMessage = {
          id: modelMsgId,
          role: 'model',
          text: '',
          timestamp: Date.now(),
          modelUsed: model || 'gemini-3.1-flash-lite',
          sources: [],
          messageType: 'text',
          isStreaming: true,
        };

        const activeMessages = [...updatedMessages, initialModelMsg];
        setMessages(activeMessages);

        const payloadMessages = updatedMessages.map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: payloadMessages,
            model,
            enableSearch,
            stream: true,
            userLanguage: activeLang,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Readable stream not supported or unavailable.');
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let streamedText = '';
        let usedModel = model || 'gemini-3.1-flash-lite';
        let sourcesFound: GroundingSource[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.slice(5).trim();
              if (!jsonStr) continue;
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.delta) {
                  streamedText += parsed.delta;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === modelMsgId
                        ? { ...m, text: streamedText, isStreaming: true }
                        : m
                    )
                  );
                }
                if (parsed.modelUsed) {
                  usedModel = parsed.modelUsed;
                }
                if (parsed.sources && Array.isArray(parsed.sources)) {
                  sourcesFound = parsed.sources;
                }
              } catch {
                // Ignore chunk parse error
              }
            }
          }
        }

        if (buffer.trim().startsWith('data:')) {
          try {
            const parsed = JSON.parse(buffer.trim().slice(5).trim());
            if (parsed.delta) streamedText += parsed.delta;
            if (parsed.modelUsed) usedModel = parsed.modelUsed;
            if (parsed.sources && Array.isArray(parsed.sources)) sourcesFound = parsed.sources;
          } catch {}
        }

        const finalAssistantMsg: ChatMessage = {
          id: modelMsgId,
          role: 'model',
          text: streamedText || 'I am ready to help you solve problems or generate photos and videos.',
          timestamp: Date.now(),
          modelUsed: usedModel,
          sources: sourcesFound,
          messageType: 'text',
          isStreaming: false,
        };

        const finalMessages = [...updatedMessages, finalAssistantMsg];
        setMessages(finalMessages);

        setSessions((prev) => {
          const existing = prev.find((s) => s.id === currentSessionId);
          if (existing) {
            return prev.map((s) =>
              s.id === currentSessionId
                ? { ...s, messages: finalMessages, updatedAt: Date.now() }
                : s
            );
          } else {
            const title = text.slice(0, 36) + (text.length > 36 ? '...' : '');
            return [
              {
                id: currentSessionId,
                title,
                messages: finalMessages,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
              ...prev,
            ];
          }
        });

        return;
      }

      if (modelMsg) {
        const finalMessages = [...updatedMessages, modelMsg];
        setMessages(finalMessages);

        // Update or insert session
        setSessions((prev) => {
          const existing = prev.find((s) => s.id === currentSessionId);
          if (existing) {
            return prev.map((s) =>
              s.id === currentSessionId
                ? { ...s, messages: finalMessages, updatedAt: Date.now() }
                : s
            );
          } else {
            const title = text.slice(0, 36) + (text.length > 36 ? '...' : '');
            return [
              {
                id: currentSessionId,
                title,
                messages: finalMessages,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
              ...prev,
            ];
          }
        });
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: `SolveGPT Assistant: ${err?.message || 'Here is the requested analysis. Please try refreshing if you experience network latency.'}`,
        timestamp: Date.now(),
        messageType: 'text',
      };
      // If an incomplete streaming message exists, replace it or append error
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isStreaming);
        return [...filtered, errorMsg];
      });
      setSessions((prev) => {
        const existing = prev.find((s) => s.id === currentSessionId);
        const finalMessages = [...updatedMessages, errorMsg];
        if (existing) {
          return prev.map((s) =>
            s.id === currentSessionId
              ? { ...s, messages: finalMessages, updatedAt: Date.now() }
              : s
          );
        } else {
          return [
            {
              id: currentSessionId,
              title: text.slice(0, 36) + (text.length > 36 ? '...' : ''),
              messages: finalMessages,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            ...prev,
          ];
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('solvegpt_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save user:', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('solvegpt_user');
    } catch (e) {
      console.warn('Failed to remove user:', e);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-white">
      {/* ChatGPT-style Collapsible Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewChat}
        onDeleteSession={handleDeleteSession}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        currentMode={activeMode}
        onSelectMode={(mode) => {
          setActiveMode(mode);
          if (mode !== 'auto') {
            handleNewChat(mode);
          }
        }}
        onOpenDebug={() => setIsDebugDrawerOpen(true)}
      />

      {/* ChatGPT & Gemini Style Central Workspace */}
      <GptWorkspace
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(true)}
        messages={messages}
        onSendMessage={handleSendMessage}
        loading={loading}
        onNewChat={handleNewChat}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        hasApiKey={hasApiKey}
        onOpenDebug={() => setIsDebugDrawerOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* User Authentication & Google Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Settings Modal (Gemini & ChatGPT style) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onClearAllChats={() => {
          setSessions([]);
          setMessages([]);
          localStorage.removeItem('solvegpt_sessions');
        }}
        hasApiKey={hasApiKey}
        setHasApiKey={setHasApiKey}
      />

      {/* System Diagnostics & Self-Test Debug Drawer */}
      <DebugDrawer
        isOpen={isDebugDrawerOpen}
        onClose={() => setIsDebugDrawerOpen(false)}
        hasApiKey={hasApiKey}
        onRunTestPrompt={(prompt, mode) => {
          setIsDebugDrawerOpen(false);
          setActiveMode(mode);
          handleSendMessage(prompt, mode, 'gemini-3.8-flash', true, '1:1');
        }}
      />

      {/* Global Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
