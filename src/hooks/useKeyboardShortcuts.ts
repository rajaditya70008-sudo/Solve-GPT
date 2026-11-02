import { useEffect } from 'react';

export interface ShortcutHandlers {
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onFocusInput: () => void;
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
  onOpenDebug?: () => void;
  onCloseModals?: () => void;
}

/**
 * Global Keyboard Shortcut Manager
 * Listens for system-wide shortcuts across Windows, macOS, and Linux:
 * - Ctrl+N / Cmd+N (and Ctrl+K / Cmd+K): Start a New Chat
 * - Ctrl+B / Cmd+B: Toggle Navigation Sidebar
 * - Ctrl+I / Cmd+I: Focus Prompt Input
 * - Ctrl+, / Cmd+,: Open Settings Modal
 * - Ctrl+/ / Cmd+/: Open Shortcuts Reference
 * - Escape: Close any open modal / stop speech
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // 1. Escape key: Close modals / cancel
      if (e.key === 'Escape') {
        handlers.onCloseModals?.();
        return;
      }

      // 2. Shortcuts with Ctrl / Cmd modifier
      if (isModifier) {
        const key = e.key.toLowerCase();

        // Ctrl+N or Ctrl+K -> New Chat
        if (key === 'n' || key === 'k') {
          e.preventDefault();
          e.stopPropagation();
          handlers.onNewChat();
          // Focus input right after starting new chat
          setTimeout(() => {
            handlers.onFocusInput();
          }, 50);
          return;
        }

        // Ctrl+B -> Toggle Sidebar
        if (key === 'b') {
          e.preventDefault();
          e.stopPropagation();
          handlers.onToggleSidebar();
          return;
        }

        // Ctrl+I -> Focus Input Textarea
        if (key === 'i') {
          e.preventDefault();
          e.stopPropagation();
          handlers.onFocusInput();
          return;
        }

        // Ctrl+, -> Open Settings
        if (e.key === ',') {
          e.preventDefault();
          e.stopPropagation();
          handlers.onOpenSettings?.();
          return;
        }

        // Ctrl+/ -> Open Keyboard Shortcuts modal
        if (e.key === '/' || e.key === '?') {
          e.preventDefault();
          e.stopPropagation();
          handlers.onOpenShortcuts?.();
          return;
        }

        // Ctrl+Shift+D -> Open Debug
        if (e.shiftKey && key === 'd') {
          e.preventDefault();
          e.stopPropagation();
          handlers.onOpenDebug?.();
          return;
        }
      } else {
        // Without modifier: '?' when not in an input field opens shortcuts sheet
        if (e.key === '?' && !isInputFocused) {
          e.preventDefault();
          handlers.onOpenShortcuts?.();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handlers]);
}
