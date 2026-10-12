import React, { useState } from 'react';
import { X, GitCommit, Tag, GitBranch, Check } from 'lucide-react';
import { AdinkraGlyph } from './AdinkraGlyph';

interface CommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: string;
  onCommit: (message: string, tag?: string) => void;
}

export const CommitModal: React.FC<CommitModalProps> = ({
  isOpen,
  onClose,
  branch,
  onCommit,
}) => {
  const [message, setMessage] = useState('');
  const [tag, setTag] = useState<'Golden' | 'Production' | 'Staging' | 'Draft' | 'Experiment'>('Draft');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onCommit(message.trim(), tag);
      setMessage('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101422] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-800 bg-[#131728] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AdinkraGlyph name="sankofa" size={18} className="text-amber-400" />
            <div>
              <div className="text-sm font-semibold text-slate-100">Commit Prompt Snapshot</div>
              <div className="text-[11px] text-slate-400">
                Record immutable version on branch <code className="text-amber-400">{branch}</code>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs bg-[#0c0e14]">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Commit Message / Changelog:
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Added few-shot examples for edge cases; locked temperature to 0.4 for deterministic JSON extraction..."
              className="w-full bg-[#090b10] border border-slate-800 focus:border-amber-500/50 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-sans resize-none"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Release Lifecycle Tag:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['Golden', 'Production', 'Staging', 'Experiment', 'Draft'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                    tag === t
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-[#121624] border border-slate-800 rounded-lg text-[11px] text-slate-400 leading-relaxed">
            Snapshots capture complete system instructions, chat history, prompt variables, test cases, and model parameters. You can restore or diff against this version at any time in Sankofa History.
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-semibold rounded-lg shadow-md"
            >
              Commit Snapshot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
