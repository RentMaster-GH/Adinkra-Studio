import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Flame,
  Clock,
  Zap,
  TrendingDown,
  Download,
  ShieldCheck
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
  onOpenGuardrailsModal?: () => void;
  onOpenSelfAmendingModal?: () => void;
  onExportWorkspace?: () => void;
  onRun: () => void;
  onStop?: () => void;
  isRunning: boolean;
  versionCount: number;
  dailyQuota: DailyTokenQuota;
  onResetDailyQuota?: () => void;
  onBurnTokens?: (amount: number) => void;
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
  onOpenGuardrailsModal,
  onOpenSelfAmendingModal,
  onExportWorkspace,
  onRun,
  isRunning,
  versionCount,
  dailyQuota,
  onResetDailyQuota,
  onBurnTokens,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [newBranchInput, setNewBranchInput] = useState('');
  const [showQuotaPopover, setShowQuotaPopover] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Live countdown to midnight UTC reset
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0, 0
      ));
      const diff = Math.max(0, nextMidnight.getTime() - now.getTime());
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeUntilReset(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingTokens = Math.max(0, dailyQuota.dailyLimit - dailyQuota.usedToday);
  const remainingPct = Math.max(0, Math.min(100, (remainingTokens / dailyQuota.dailyLimit) * 100));
  const burnedPct = Math.max(0, Math.min(100, (dailyQuota.usedToday / dailyQuota.dailyLimit) * 100));

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
        {/* Visual 'Token Burner' Indicator with Progress Bar */}
        <div className="relative">
          <button
            onClick={() => setShowQuotaPopover(!showQuotaPopover)}
            className="flex items-center gap-2.5 px-3 py-1.5 bg-[#111422] hover:bg-[#161a2c] border border-amber-500/40 hover:border-amber-400 rounded-lg transition-all text-xs shadow-sm group"
            title="Token Burner: Countdown of remaining daily token quota relative to 3,000,000 limit"
          >
            {/* Animated Flame Icon */}
            <div className="relative flex items-center justify-center">
              <Flame
                size={16}
                className={`transition-colors ${
                  remainingPct > 50
                    ? 'text-amber-400 fill-amber-500/30 group-hover:text-amber-300 animate-pulse'
                    : remainingPct > 20
                    ? 'text-orange-400 fill-orange-500/30 group-hover:text-orange-300 animate-pulse'
                    : 'text-rose-500 fill-rose-500/40 animate-bounce'
                }`}
              />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping" />
            </div>

            {/* Token Burner Countdown Label & Value */}
            <div className="flex flex-col text-left leading-none gap-1">
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="text-amber-300 font-sans font-bold text-[9px] uppercase tracking-wider">
                  Token Burner
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-200 font-bold font-mono">
                  {(remainingTokens / 1_000_000).toFixed(2)}M
                </span>
                <span className="text-slate-500 font-mono text-[9px]">rem. / 3.0M</span>
              </div>

              {/* Progress Bar in the Header */}
              <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 shadow-inner">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    remainingPct > 50
                      ? 'bg-gradient-to-r from-emerald-400 via-amber-400 to-amber-500'
                      : remainingPct > 20
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                  }`}
                  style={{ width: `${remainingPct}%` }}
                />
              </div>
            </div>

            {/* Remaining Percentage Badge */}
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                remainingPct > 50
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : remainingPct > 20
                  ? 'bg-orange-500/10 text-orange-300 border-orange-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
              }`}
            >
              {remainingPct.toFixed(1)}%
            </span>
          </button>

          {/* Token Burner HUD Details Popover */}
          {showQuotaPopover && (
            <div className="absolute right-0 top-full mt-2 w-88 bg-[#121624] border border-amber-500/40 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Flame size={15} className="text-amber-400 fill-amber-500/30" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-100">Token Burner HUD</span>
                    <span className="block text-[9px] text-amber-400/90 font-mono">
                      3,000,000 Daily Quota (3× AI Studio Limit)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  3× Headroom Active
                </span>
              </div>

              {/* Big Countdown Ticker */}
              <div className="my-3 p-3.5 bg-[#090b10] border border-slate-800 rounded-xl text-center space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                  Remaining Daily Token Headroom
                </div>
                <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight flex items-center justify-center gap-1.5">
                  <span>{remainingTokens.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 font-normal">/ 3,000,000</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {dailyQuota.usedToday.toLocaleString()} tokens burned today ({burnedPct.toFixed(2)}% consumed)
                </div>

                {/* Progress bar with 1M threshold mark */}
                <div className="pt-2 px-1">
                  <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        remainingPct > 50
                          ? 'bg-gradient-to-r from-emerald-400 via-amber-400 to-amber-500'
                          : remainingPct > 20
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                          : 'bg-gradient-to-r from-rose-500 to-red-600'
                      }`}
                      style={{ width: `${remainingPct}%` }}
                    />
                    {/* Visual marker at 33.3% where Google AI Studio's 1M limit would end */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white/70 shadow-sm"
                      style={{ left: '33.33%' }}
                      title="Google AI Studio Standard 1,000,000 Limit Marker"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                    <span>0</span>
                    <span className="text-slate-400 font-semibold">1.0M (Standard AI Studio Cap)</span>
                    <span className="text-amber-400 font-semibold">3.0M (Adinkra 3× Cap)</span>
                  </div>
                </div>
              </div>

              {/* Reset Countdown Timer */}
              <div className="p-2.5 bg-[#141826] border border-slate-800 rounded-lg flex items-center justify-between text-xs mb-3 font-mono">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock size={13} className="text-amber-400" />
                  <span className="text-[11px]">Midnight UTC Reset:</span>
                </div>
                <span className="text-amber-300 font-bold text-xs">{timeUntilReset || 'Calculating...'}</span>
              </div>

              {/* Capacity Comparison Table */}
              <div className="p-2.5 bg-[#090b10] border border-slate-800 rounded-lg space-y-1.5 font-mono text-[10px] mb-3">
                <div className="text-[10px] text-slate-400 font-sans font-semibold uppercase tracking-wider pb-1 border-b border-slate-800">
                  Capacity Comparison
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Daily Quota:</span>
                  <div className="space-x-1">
                    <span className="line-through text-slate-600">1,000,000</span>
                    <span className="text-amber-400 font-bold">3,000,000 tokens (3×)</span>
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

              {/* Simulation and Reset Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {onBurnTokens && (
                    <button
                      onClick={() => onBurnTokens(5000)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono transition-colors"
                      title="Simulate burning 5,000 tokens to test countdown"
                    >
                      +5k Burn
                    </button>
                  )}
                  {onBurnTokens && (
                    <button
                      onClick={() => onBurnTokens(25000)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-mono transition-colors"
                      title="Simulate burning 25,000 tokens to test countdown"
                    >
                      +25k Burn
                    </button>
                  )}
                </div>

                {onResetDailyQuota && (
                  <button
                    onClick={onResetDailyQuota}
                    className="text-[10px] font-mono text-slate-400 hover:text-amber-300 underline"
                  >
                    Reset to 3.0M
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
          title="Share or Collaborate Workspace"
        >
          <Share2 size={16} />
        </button>

        {/* Shield & Cache Architecture Modal CTA */}
        {onOpenGuardrailsModal && (
          <button
            onClick={onOpenGuardrailsModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 hover:text-emerald-300 rounded-md transition-colors font-medium shadow-sm group"
            title="Inspect Prompt Caching (sub-10ms) & LLM Guardrails (Zero Error Output)"
          >
            <ShieldCheck size={13} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="hidden xl:inline">Shield & Cache</span>
          </button>
        )}

        {/* Self-Amending Meta-Programming Engine CTA (Aya) */}
        {onOpenSelfAmendingModal && (
          <button
            onClick={onOpenSelfAmendingModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 hover:border-amber-400 rounded-md transition-colors font-medium shadow-sm group"
            title="Aya Meta-Programming: Amend Adinkra Studio programming at developer command via Unique Identifier (UID)"
          >
            <AdinkraGlyph name="aya" size={13} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden xl:inline">Self-Amend Engine</span>
            <span className="xl:hidden hidden sm:inline">Self-Amend</span>
          </button>
        )}

        {/* Export Workspace Button */}
        {onExportWorkspace && (
          <button
            onClick={onExportWorkspace}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-700/80 hover:border-amber-500/50 hover:text-amber-300 rounded-md transition-colors font-medium shadow-sm group"
            title="Export Workspace: Download promptState, versions, and comments as a local JSON file"
          >
            <Download size={13} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden xl:inline">Export Workspace</span>
            <span className="xl:hidden hidden sm:inline">Export</span>
          </button>
        )}

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

        {/* Run / Send Prompt CTA in Header */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all ${
            isRunning
              ? 'bg-amber-600/60 text-slate-200 cursor-not-allowed animate-pulse'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 active:scale-95 ring-1 ring-amber-400/50'
          }`}
          title="Send prompt to Gemini AI (⌘↵ or Ctrl+Enter)"
        >
          {isRunning ? (
            <>
              <Square size={13} className="fill-current" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Play size={13} className="fill-current" />
              <span>Send Prompt</span>
              <kbd className="hidden sm:inline text-[9px] bg-slate-950/20 text-slate-950 px-1 py-0.2 rounded font-mono">
                ⌘↵
              </kbd>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
