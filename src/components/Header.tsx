import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Code2, 
  GitCommit, 
  History, 
  Sparkles, 
  GitBranch, 
  MessageSquare, 
  Share2, 
  Layers, 
  Info,
  ChevronDown
} from 'lucide-react';
import { StudioMode, Author, DailyTokenQuota } from '../types';
import { AdinkraGlyph } from './AdinkraGlyph';

interface HeaderProps {
  mode: StudioMode;
  setMode: (mode: StudioMode) => void;
  title: string;
  setTitle: (title: string) => void;
  currentBranch: string;
  branches: string[];
  setBranch: (branch: string) => void;
  onCreateBranch: (branch: string) => void;
  collaborators: Author[];
  commentsCount: number;
  onToggleComments: () => void;
  onOpenGetCode: () => void;
  onOpenCommitModal: () => void;
  onOpenPhilosophyModal: () => void;
  onOpenShareModal: () => void;
  onRun: () => void;
  onStop?: () => void;
  isRunning: boolean;
  versionCount: number;
  dailyQuota: DailyTokenQuota;
  onResetDailyQuota?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  title,
  setTitle,
  currentBranch,
  branches,
  setBranch,
  onCreateBranch,
  collaborators,
  commentsCount,
  onToggleComments,
  onOpenGetCode,
  onOpenCommitModal,
  onOpenPhilosophyModal,
  onOpenShareModal,
  onRun,
  isRunning,
  versionCount,
  dailyQuota,
  onResetDailyQuota,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [newBranchInput, setNewBranchInput] = useState('');
  const [showQuotaPopover, setShowQuotaPopover] = useState(false);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      setTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBranchInput.trim()) {
      onCreateBranch(newBranchInput.trim());
      setNewBranchInput('');
      setShowBranchMenu(false);
    }
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-[#0e111a]/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Prompt Title */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Brand Icon & Name */}
        <div className="flex items-center gap-2.5 pr-2 border-r border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-amber-950/40 border border-amber-500/40 flex items-center justify-center shadow-inner shadow-amber-500/10">
            <AdinkraGlyph name="adinkrahene" size={20} className="text-amber-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-slate-100 flex items-center gap-1">
                Adinkra <span className="text-amber-400">Studio</span>
              </span>
              <button 
                onClick={onOpenPhilosophyModal}
                title="Explore Adinkra studio principles & symbolism"
                className="text-slate-500 hover:text-amber-400 transition-colors p-0.5"
              >
                <Info size={13} />
              </button>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">GEMINI 3 · SANKOFA V.C.</span>
          </div>
        </div>

        {/* Title & Branch Selector */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="bg-slate-900 border border-amber-500/50 rounded px-2 py-1 text-xs text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-amber-400 w-64"
            />
          ) : (
            <button
              onClick={() => {
                setTempTitle(title);
                setIsEditingTitle(true);
              }}
              title="Click to rename prompt"
              className="text-xs font-semibold text-slate-200 hover:text-white truncate max-w-[200px] md:max-w-[260px] text-left transition-colors flex items-center gap-1 group"
            >
              <span className="truncate">{title}</span>
              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
            </button>
          )}

          {/* Branch Pill Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/90 border border-slate-700/60 rounded text-[11px] font-mono text-slate-300 hover:border-slate-600 transition-colors"
            >
              <GitBranch size={11} className="text-amber-400" />
              <span>{currentBranch}</span>
              <ChevronDown size={11} className="text-slate-500" />
            </button>

            {showBranchMenu && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#131722] border border-slate-800 rounded-lg shadow-2xl p-2 z-50">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Active Branches
                </div>
                <div className="space-y-0.5 max-h-40 overflow-y-auto mb-2">
                  {branches.map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        setBranch(b);
                        setShowBranchMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between font-mono transition-colors ${
                        b === currentBranch
                          ? 'bg-amber-500/20 text-amber-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{b}</span>
                      {b === currentBranch && <span className="text-[10px] text-amber-400">current</span>}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleCreateBranch} className="pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400 mb-1 px-1">Create new branch:</div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="e.g. experimental-v2"
                      value={newBranchInput}
                      onChange={(e) => setNewBranchInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[11px] font-medium"
                    >
                      +
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Studio Navigation Modes */}
      <nav className="hidden lg:flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800/80 shadow-inner">
        <button
          onClick={() => setMode('playground')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'playground'
              ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AdinkraGlyph name="nyansapo" size={13} className={mode === 'playground' ? 'text-amber-400' : 'text-slate-400'} />
          <span>Playground</span>
        </button>

        <button
          onClick={() => setMode('sankofa')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'sankofa'
              ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AdinkraGlyph name="sankofa" size={13} className={mode === 'sankofa' ? 'text-amber-400' : 'text-slate-400'} />
          <span>Sankofa History</span>
          <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-300">
            {versionCount}
          </span>
        </button>

        <button
          onClick={() => setMode('compare')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'compare'
              ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AdinkraGlyph name="dame-dame" size={13} className={mode === 'compare' ? 'text-amber-400' : 'text-slate-400'} />
          <span>Model Arena</span>
        </button>

        <button
          onClick={() => setMode('optimizer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'optimizer'
              ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles size={13} className={mode === 'optimizer' ? 'text-amber-400' : 'text-slate-400'} />
          <span>Co-Pilot</span>
        </button>
      </nav>

      {/* Right Actions: Team Presence, Comments, Get Code, Commit, Run */}
      <div className="flex items-center gap-2">
        {/* Daily Token Allowance Meter (3x Google AI Studio Capacity) */}
        <div className="relative">
          <button
            onClick={() => setShowQuotaPopover(!showQuotaPopover)}
            className="flex items-center gap-2 px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500/60 rounded-md transition-all text-xs"
            title="View 3x Daily Token Quota (Adinkra Studio vs Google AI Studio)"
          >
            <AdinkraGlyph name="dono" size={13} className="text-amber-400" />
            <div className="flex flex-col text-left leading-none">
              <div className="flex items-center gap-1 font-mono text-[10px] text-slate-300">
                <span className="text-amber-400 font-bold">
                  {(dailyQuota.usedToday / 1000).toFixed(1)}k
                </span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-400">
                  {(dailyQuota.dailyLimit / 1_000_000).toFixed(1)}M
                </span>
              </div>
              <div className="w-16 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(3, (dailyQuota.usedToday / dailyQuota.dailyLimit) * 100))}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold tracking-tight">
              3× TIER
            </span>
          </button>

          {/* Quota Popover Details */}
          {showQuotaPopover && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#121624] border border-slate-700/80 rounded-xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <AdinkraGlyph name="dono" size={16} className="text-amber-400" />
                  <span className="font-semibold text-xs text-slate-100">Daily Token Quota</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  3× Supercharged
                </span>
              </div>

              <div className="py-2.5 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] font-mono mb-1">
                    <span className="text-slate-400">Today's Consumption:</span>
                    <span className="text-amber-300 font-bold">
                      {dailyQuota.usedToday.toLocaleString()} / {dailyQuota.dailyLimit.toLocaleString()} tokens
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (dailyQuota.usedToday / dailyQuota.dailyLimit) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>{((dailyQuota.usedToday / dailyQuota.dailyLimit) * 100).toFixed(2)}% consumed</span>
                    <span>{(dailyQuota.dailyLimit - dailyQuota.usedToday).toLocaleString()} tokens remaining</span>
                  </div>
                </div>

                {/* Comparison Matrix Table */}
                <div className="p-2 bg-[#090b10] border border-slate-800/80 rounded-lg space-y-1.5 font-mono text-[10px]">
                  <div className="text-[10px] text-slate-400 font-sans font-semibold uppercase tracking-wider pb-1 border-b border-slate-800">
                    Tier Comparison
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily Quota:</span>
                    <div className="space-x-1">
                      <span className="line-through text-slate-600">1.0M</span>
                      <span className="text-amber-400 font-bold">3.0M tokens (3×)</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Per Turn:</span>
                    <div className="space-x-1">
                      <span className="line-through text-slate-600">8,192</span>
                      <span className="text-amber-400 font-bold">24,576 tokens (3×)</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rate Limit:</span>
                    <div className="space-x-1">
                      <span className="line-through text-slate-600">15 RPM</span>
                      <span className="text-amber-400 font-bold">45 RPM (3×)</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 leading-snug">
                  Adinkra Studio gives prompt engineers 3× higher headroom for multi-turn evaluations, structured JSON schemas, and large context synthesis.
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Resets daily at 00:00 UTC</span>
                {onResetDailyQuota && (
                  <button
                    onClick={onResetDailyQuota}
                    className="text-[10px] font-mono text-slate-400 hover:text-amber-300 underline"
                  >
                    Reset Counter
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Active Collaborators Presence */}
        <div className="flex items-center gap-1.5 pl-1 pr-2 border-r border-slate-800/80">
          <div className="flex -space-x-1.5 items-center">
            {collaborators.map((c) => (
              <div
                key={c.name}
                className="relative group cursor-pointer"
                title={`${c.name} (${c.role})${c.currentAction ? ` · ${c.currentAction}` : ''}`}
              >
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="w-6 h-6 rounded-full border border-slate-900 object-cover"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${
                    c.status === 'editing'
                      ? 'bg-amber-400 animate-pulse'
                      : c.status === 'active'
                      ? 'bg-emerald-400'
                      : 'bg-slate-500'
                  }`}
                />
              </div>
            ))}
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden xl:inline">
            {collaborators.length} active
          </span>
        </div>

        {/* Comments Drawer Button */}
        <button
          onClick={onToggleComments}
          className="relative p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors"
          title="Team Comments & Discussion"
        >
          <MessageSquare size={16} />
          {commentsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-slate-950 font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
              {commentsCount}
            </span>
          )}
        </button>

        {/* Share Button */}
        <button
          onClick={onOpenShareModal}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors"
          title="Share or Export Workspace"
        >
          <Share2 size={16} />
        </button>

        {/* Get Code Modal CTA */}
        <button
          onClick={onOpenGetCode}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-700/80 hover:border-slate-600 hover:text-white rounded-md transition-colors font-medium shadow-sm"
          title="Export prompt code in Python, TypeScript, cURL, JSON"
        >
          <Code2 size={13} className="text-amber-400" />
          <span className="hidden sm:inline">Get Code</span>
        </button>

        {/* Commit / Save Snapshot Button */}
        <button
          onClick={onOpenCommitModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-700/80 hover:border-amber-500/50 hover:text-amber-300 rounded-md transition-colors font-medium shadow-sm"
          title="Commit prompt version to Sankofa timeline"
        >
          <GitCommit size={13} className="text-amber-400" />
          <span className="hidden md:inline">Save Version</span>
        </button>

        {/* Run Prompt CTA */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-md transition-all ${
            isRunning
              ? 'bg-amber-600/60 text-slate-200 cursor-not-allowed animate-pulse'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/10 active:scale-95'
          }`}
          title="Run prompt (Ctrl+Enter / Cmd+Enter)"
        >
          {isRunning ? (
            <>
              <Square size={13} className="fill-current" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Play size={13} className="fill-current" />
              <span>Run</span>
              <kbd className="hidden sm:inline text-[9px] bg-amber-400/30 text-slate-950 px-1 py-0.2 rounded font-mono">
                ⌘↵
              </kbd>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
