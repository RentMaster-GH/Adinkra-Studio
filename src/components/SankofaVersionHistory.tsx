import React, { useState } from 'react';
import { 
  GitCommit, 
  RotateCcw, 
  GitBranch, 
  Tag, 
  Clock, 
  User, 
  ChevronRight, 
  Check, 
  ArrowLeftRight, 
  Play, 
  Sparkles, 
  FileText, 
  Sliders, 
  Copy,
  Plus
} from 'lucide-react';
import { VersionSnapshot, PromptState } from '../types';
import { AdinkraGlyph } from './AdinkraGlyph';

interface SankofaVersionHistoryProps {
  versions: VersionSnapshot[];
  currentPromptState: PromptState;
  onRestoreVersion: (version: VersionSnapshot) => void;
  onForkBranch: (version: VersionSnapshot, branchName: string) => void;
  onOpenCommitModal: () => void;
  onTestVersion: (version: VersionSnapshot) => void;
}

export const SankofaVersionHistory: React.FC<SankofaVersionHistoryProps> = ({
  versions,
  currentPromptState,
  onRestoreVersion,
  onForkBranch,
  onOpenCommitModal,
  onTestVersion,
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    versions[0]?.id || ''
  );
  const [compareMode, setCompareMode] = useState<'vsCurrent' | 'twoVersions'>('vsCurrent');
  const [secondVersionId, setSecondVersionId] = useState<string>(
    versions[1]?.id || versions[0]?.id || ''
  );
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [isForking, setIsForking] = useState(false);
  const [forkBranchName, setForkBranchName] = useState('');
  const [restoredSuccess, setRestoredSuccess] = useState(false);

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) || versions[0];
  const secondVersion = versions.find((v) => v.id === secondVersionId) || versions[0];

  const branches = Array.from(new Set(versions.map((v) => v.branch)));

  const filteredVersions = filterBranch === 'all'
    ? versions
    : versions.filter((v) => v.branch === filterBranch);

  const handleRestore = () => {
    if (!selectedVersion) return;
    onRestoreVersion(selectedVersion);
    setRestoredSuccess(true);
    setTimeout(() => setRestoredSuccess(false), 2500);
  };

  const handleForkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forkBranchName.trim() && selectedVersion) {
      onForkBranch(selectedVersion, forkBranchName.trim());
      setIsForking(false);
      setForkBranchName('');
    }
  };

  // Simple clean diff helper for lines
  const computeDiffLines = (oldText: string = '', newText: string = '') => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const result: Array<{ type: 'same' | 'added' | 'removed'; text: string }> = [];

    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      const o = oldLines[i];
      const n = newLines[i];
      if (o === n) {
        if (o !== undefined) result.push({ type: 'same', text: o });
      } else {
        if (o !== undefined) result.push({ type: 'removed', text: o });
        if (n !== undefined) result.push({ type: 'added', text: n });
      }
    }
    return result;
  };

  if (!selectedVersion) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
        <p>No version history recorded yet.</p>
      </div>
    );
  }

  // Target comparison data
  const baseData = selectedVersion.promptData;
  const compareData =
    compareMode === 'vsCurrent' ? currentPromptState : secondVersion.promptData;
  const compareLabel =
    compareMode === 'vsCurrent'
      ? 'Current Editor State'
      : `Version v${secondVersion.versionNumber}`;

  const systemDiff = computeDiffLines(baseData.systemInstruction, compareData.systemInstruction);
  const promptDiff = computeDiffLines(baseData.userPrompt, compareData.userPrompt);

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#0c0e14]">
      {/* LEFT: Timeline of Versions */}
      <div className="w-full md:w-96 border-r border-slate-800/80 bg-[#0e111a] flex flex-col min-h-0">
        {/* Timeline Header */}
        <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AdinkraGlyph name="sankofa" size={16} className="text-amber-400" />
            <div>
              <span className="font-semibold text-xs text-slate-200">Sankofa Timeline</span>
              <span className="text-[10px] text-slate-400 block font-normal">
                {versions.length} immutable snapshots
              </span>
            </div>
          </div>
          <button
            onClick={onOpenCommitModal}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded text-xs font-medium transition-colors"
          >
            <Plus size={11} />
            <span>Commit</span>
          </button>
        </div>

        {/* Branch Filter Tabs */}
        <div className="px-3 py-2 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 text-[10px] uppercase font-mono">Branch:</span>
          <button
            onClick={() => setFilterBranch('all')}
            className={`px-2 py-0.5 rounded font-mono transition-colors ${
              filterBranch === 'all'
                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            all ({versions.length})
          </button>
          {branches.map((b) => (
            <button
              key={b}
              onClick={() => setFilterBranch(b)}
              className={`px-2 py-0.5 rounded font-mono transition-colors ${
                filterBranch === b
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
          {filteredVersions.map((v) => {
            const isSelected = v.id === selectedVersionId;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVersionId(v.id)}
                className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border border-amber-500/40 shadow-sm'
                    : 'hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      v{v.versionNumber}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      {v.branch}
                    </span>
                    {v.tag && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                          v.tag === 'Golden'
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {v.tag}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-slate-200 font-medium line-clamp-2 mb-1.5">
                  {v.commitMessage}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={v.author.avatar}
                      alt={v.author.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{v.author.name}</span>
                  </div>
                  <span className="font-mono text-slate-400">{v.promptData.model}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Visual Diff & Inspection View */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#090b10]">
        {/* Top Action Toolbar */}
        <div className="p-3.5 border-b border-slate-800/80 bg-[#0e111a] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-100">
                  Version v{selectedVersion.versionNumber}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({selectedVersion.branch})
                </span>
              </div>
              <p className="text-xs text-amber-300/90 italic mt-0.5">
                "{selectedVersion.commitMessage}"
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Compare selector */}
            <div className="flex p-0.5 bg-slate-900 rounded border border-slate-800 text-xs">
              <button
                onClick={() => setCompareMode('vsCurrent')}
                className={`px-2 py-1 rounded transition-colors ${
                  compareMode === 'vsCurrent'
                    ? 'bg-amber-500/20 text-amber-300 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Diff vs Current
              </button>
              <button
                onClick={() => setCompareMode('twoVersions')}
                className={`px-2 py-1 rounded transition-colors ${
                  compareMode === 'twoVersions'
                    ? 'bg-amber-500/20 text-amber-300 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Diff vs Version...
              </button>
            </div>

            {compareMode === 'twoVersions' && (
              <select
                value={secondVersionId}
                onChange={(e) => setSecondVersionId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.versionNumber}: {v.commitMessage.slice(0, 24)}...
                  </option>
                ))}
              </select>
            )}

            {/* Fork Branch CTA */}
            <button
              onClick={() => setIsForking(!isForking)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
              title="Branch off from this version"
            >
              <GitBranch size={12} className="text-amber-400" />
              <span>Fork</span>
            </button>

            {/* Test Version CTA */}
            <button
              onClick={() => onTestVersion(selectedVersion)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
              title="Execute this historical version"
            >
              <Play size={11} className="text-emerald-400 fill-current" />
              <span>Run Snapshot</span>
            </button>

            {/* 1-Click Restore Version */}
            <button
              onClick={handleRestore}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded text-xs shadow-md transition-all active:scale-95"
            >
              <RotateCcw size={12} />
              <span>{restoredSuccess ? 'Restored to Editor!' : 'Restore Version'}</span>
            </button>
          </div>
        </div>

        {/* Fork Branch Dialog if active */}
        {isForking && (
          <form
            onSubmit={handleForkSubmit}
            className="p-3 bg-[#131722] border-b border-amber-500/30 flex items-center gap-2 text-xs"
          >
            <span className="text-amber-300 font-medium">Fork v{selectedVersion.versionNumber} to new branch:</span>
            <input
              type="text"
              placeholder="e.g. prompt-v2-experiment"
              value={forkBranchName}
              onChange={(e) => setForkBranchName(e.target.value)}
              autoFocus
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs w-60"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-amber-500 text-slate-950 font-semibold rounded text-xs"
            >
              Create Branch
            </button>
            <button
              type="button"
              onClick={() => setIsForking(false)}
              className="text-slate-400 hover:text-white px-2 py-1"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Diff Content Inspector */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {/* Comparison Legend */}
          <div className="flex items-center justify-between p-2.5 bg-[#121622] border border-slate-800 rounded-lg text-slate-300 font-mono text-[11px]">
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold">Base: v{selectedVersion.versionNumber}</span>
              <span className="text-slate-500">→</span>
              <span className="text-blue-400 font-bold">Comparing: {compareLabel}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 bg-rose-500 rounded-sm" /> Red: Removed
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 bg-emerald-500 rounded-sm" /> Green: Added
              </span>
            </div>
          </div>

          {/* Parameters Comparison Matrix */}
          <div className="bg-[#101420] border border-slate-800/90 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders size={12} className="text-amber-400" />
              <span>Parameters & Configuration Comparison</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="p-2 bg-[#090b10] rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Model</div>
                <div className="text-slate-300">{baseData.model}</div>
                {baseData.model !== compareData.model && (
                  <div className="text-emerald-400 font-semibold mt-0.5">→ {compareData.model}</div>
                )}
              </div>

              <div className="p-2 bg-[#090b10] rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Temperature</div>
                <div className="text-slate-300">{baseData.parameters.temperature}</div>
                {baseData.parameters.temperature !== compareData.parameters.temperature && (
                  <div className="text-emerald-400 font-semibold mt-0.5">
                    → {compareData.parameters.temperature}
                  </div>
                )}
              </div>

              <div className="p-2 bg-[#090b10] rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Thinking Level</div>
                <div className="text-slate-300">{baseData.parameters.thinkingLevel || 'LOW'}</div>
                {baseData.parameters.thinkingLevel !== compareData.parameters.thinkingLevel && (
                  <div className="text-emerald-400 font-semibold mt-0.5">
                    → {compareData.parameters.thinkingLevel}
                  </div>
                )}
              </div>

              <div className="p-2 bg-[#090b10] rounded border border-slate-800">
                <div className="text-[10px] text-slate-500">Search Grounding</div>
                <div className="text-slate-300">
                  {baseData.parameters.enableSearchGrounding ? 'Enabled' : 'Disabled'}
                </div>
                {baseData.parameters.enableSearchGrounding !== compareData.parameters.enableSearchGrounding && (
                  <div className="text-emerald-400 font-semibold mt-0.5">
                    → {compareData.parameters.enableSearchGrounding ? 'Enabled' : 'Disabled'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Instructions Diff */}
          <div className="bg-[#101420] border border-slate-800/90 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText size={12} className="text-amber-400" />
                <span>System Instructions Line Diff</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {baseData.systemInstruction === compareData.systemInstruction ? 'Identical' : 'Differences detected'}
              </span>
            </div>
            <div className="bg-[#090b10] border border-slate-800 rounded p-2.5 font-mono text-[11px] max-h-48 overflow-y-auto space-y-0.5 leading-relaxed">
              {systemDiff.map((line, i) => (
                <div
                  key={i}
                  className={`px-1.5 py-0.5 rounded ${
                    line.type === 'added'
                      ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500'
                      : line.type === 'removed'
                      ? 'bg-rose-950/60 text-rose-300 border-l-2 border-rose-500 line-through opacity-70'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="select-none text-slate-600 mr-2">
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                  </span>
                  {line.text || <span className="italic opacity-40">blank line</span>}
                </div>
              ))}
            </div>
          </div>

          {/* User Prompt Diff */}
          <div className="bg-[#101420] border border-slate-800/90 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText size={12} className="text-amber-400" />
                <span>User Prompt Content Line Diff</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {baseData.userPrompt === compareData.userPrompt ? 'Identical' : 'Differences detected'}
              </span>
            </div>
            <div className="bg-[#090b10] border border-slate-800 rounded p-2.5 font-mono text-[11px] max-h-60 overflow-y-auto space-y-0.5 leading-relaxed">
              {promptDiff.map((line, i) => (
                <div
                  key={i}
                  className={`px-1.5 py-0.5 rounded ${
                    line.type === 'added'
                      ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500'
                      : line.type === 'removed'
                      ? 'bg-rose-950/60 text-rose-300 border-l-2 border-rose-500 line-through opacity-70'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="select-none text-slate-600 mr-2">
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                  </span>
                  {line.text || <span className="italic opacity-40">blank line</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
