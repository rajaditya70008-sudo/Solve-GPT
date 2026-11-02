import React from 'react';
import { X, Keyboard, Command, Sparkles } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutSections = [
    {
      category: 'General & Navigation',
      items: [
        { label: 'New Chat session', keys: [modKey, 'N'], hint: 'Also supports ' + modKey + '+K' },
        { label: 'Toggle Sidebar', keys: [modKey, 'B'] },
        { label: 'Focus prompt input', keys: [modKey, 'I'] },
        { label: 'Open Settings modal', keys: [modKey, ','] },
        { label: 'Keyboard Shortcuts sheet', keys: [modKey, '/'], hint: 'Or press ?' },
        { label: 'Close open dialog / modal', keys: ['Esc'] },
      ],
    },
    {
      category: 'Chat & Prompting',
      items: [
        { label: 'Send message / prompt', keys: ['Enter'] },
        { label: 'Insert new line in prompt', keys: ['Shift', 'Enter'] },
        { label: 'Open Diagnostics drawer', keys: [modKey, 'Shift', 'D'] },
      ],
    },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Keyboard Shortcuts</span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                  Global
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Trigger high-efficiency workflow actions instantly from anywhere
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="mt-5 space-y-6 max-h-[65vh] overflow-y-auto pr-1">
          {shortcutSections.map((section) => (
            <div key={section.category}>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                {section.category}
              </h4>
              <div className="divide-y divide-slate-850 rounded-xl border border-slate-800/80 bg-slate-900/60 overflow-hidden">
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 text-xs transition-colors hover:bg-slate-850/50"
                  >
                    <div>
                      <span className="font-medium text-slate-200">{item.label}</span>
                      {item.hint && (
                        <span className="block text-[10px] text-slate-500">{item.hint}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <React.Fragment key={kIdx}>
                          {kIdx > 0 && <span className="text-[10px] text-slate-500">+</span>}
                          <kbd className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-slate-700 bg-slate-800 px-2 py-1 font-mono text-[11px] font-semibold text-slate-200 shadow-xs">
                            {k}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="mt-5 border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Shortcuts work across all views and models</span>
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
