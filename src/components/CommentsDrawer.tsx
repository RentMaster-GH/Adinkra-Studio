import React, { useState } from 'react';
import { X, Send, MessageSquare, CheckCircle2, Circle, Clock, User, Sparkles } from 'lucide-react';
import { WorkspaceComment, Author } from '../types';
import { AdinkraGlyph } from './AdinkraGlyph';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comments: WorkspaceComment[];
  onAddComment: (text: string, target: 'system' | 'prompt' | 'config' | 'general') => void;
  onToggleResolve: (id: string) => void;
  collaborators: Author[];
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  comments,
  onAddComment,
  onToggleResolve,
  collaborators,
}) => {
  const [commentText, setCommentText] = useState('');
  const [target, setTarget] = useState<'general' | 'system' | 'prompt' | 'config'>('general');
  const [activeTab, setActiveTab] = useState<'all' | 'unresolved'>('all');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(commentText.trim(), target);
      setCommentText('');
    }
  };

  const filteredComments = activeTab === 'all'
    ? comments
    : comments.filter((c) => !c.resolved);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#111420] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-[#131728] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AdinkraGlyph name="akoma" size={16} className="text-amber-400" />
          <div>
            <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
              <span>Workspace Collaboration</span>
              <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 rounded border border-amber-800/60 font-mono">
                Akoma (Unity)
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {comments.filter((c) => !c.resolved).length} unresolved discussion threads
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

      {/* Active Team Strip */}
      <div className="px-4 py-2.5 bg-[#0e111a] border-b border-slate-800/80">
        <div className="text-[10px] uppercase font-mono text-slate-400 mb-1.5 flex items-center justify-between">
          <span>Active Teammates ({collaborators.length})</span>
          <span className="text-emerald-400 text-[9px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {collaborators.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-md px-2 py-1 shrink-0"
            >
              <div className="relative">
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                    c.status === 'editing'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
              </div>
              <div className="text-[10px] leading-tight">
                <div className="font-medium text-slate-200">{c.name.split(' ')[0]}</div>
                <div className="text-[9px] text-slate-400">{c.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-1.5 border-b border-slate-800 bg-[#0e111a] flex gap-2 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-amber-500/20 text-amber-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Threads ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab('unresolved')}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            activeTab === 'unresolved'
              ? 'bg-amber-500/20 text-amber-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Unresolved ({comments.filter((c) => !c.resolved).length})
        </button>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-[#0a0c13]">
        {filteredComments.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <MessageSquare size={24} className="mb-2 text-slate-600" />
            <p className="text-xs text-slate-400">No comment threads found</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Start a discussion on system instructions, prompt tokens, or parameter tuning.
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-xl border transition-colors ${
                comment.resolved
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  : 'bg-[#121624] border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200">
                      {comment.author.name}
                    </span>
                    <span className="text-[9px] text-slate-400 ml-1.5 font-mono">
                      {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-900 text-amber-400 border border-slate-800">
                    {comment.target}
                  </span>
                  <button
                    onClick={() => onToggleResolve(comment.id)}
                    title={comment.resolved ? 'Mark unresolved' : 'Mark resolved'}
                    className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5"
                  >
                    {comment.resolved ? (
                      <CheckCircle2 size={13} className="text-emerald-400" />
                    ) : (
                      <Circle size={13} />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {comment.text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-[#131728]">
        <div className="flex items-center gap-2 mb-2 text-[10px]">
          <span className="text-slate-400">Context:</span>
          {(['general', 'system', 'prompt', 'config'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTarget(t)}
              className={`px-2 py-0.5 rounded font-mono uppercase transition-colors ${
                target === t
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add collaborative note or prompt review..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center"
          >
            <Send size={13} />
          </button>
        </div>
      </form>
    </div>
  );
};
