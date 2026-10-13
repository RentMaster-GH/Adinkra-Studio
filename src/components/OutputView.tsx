import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  Coins, 
  FileCheck2, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  Search,
  Code,
  Zap,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  Table
} from 'lucide-react';
import { ExecutionMetrics } from '../types';
import { AdinkraGlyph } from './AdinkraGlyph';

interface OutputViewProps {
  output: string;
  isGenerating: boolean;
  metrics: ExecutionMetrics | null;
  groundingSources?: Array<{ title?: string; url?: string; snippet?: string }>;
  onClearOutput?: () => void;
  error?: string | null;
  onRetry?: () => void;
  onOpenGuardrailsModal?: () => void;
}

export const OutputView: React.FC<OutputViewProps> = ({
  output,
  isGenerating,
  metrics,
  groundingSources = [],
  onClearOutput,
  error,
  onRetry,
  onOpenGuardrailsModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewFormat, setViewFormat] = useState<'formatted' | 'cards' | 'raw'>('formatted');
  const [showGuardrailDetails, setShowGuardrailDetails] = useState(false);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if output is JSON
  let isJson = false;
  let parsedJson: any = null;
  if (output && (output.trim().startsWith('{') || output.trim().startsWith('['))) {
    try {
      parsedJson = JSON.parse(output.trim());
      isJson = true;
    } catch {
      isJson = false;
    }
  }

  return (
    <div className="flex-1 border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-[#0a0c13] flex flex-col min-h-0">
      {/* Header bar */}
      <div className="h-10 px-4 border-b border-slate-800/80 bg-[#0e111a] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <AdinkraGlyph name="dono" size={14} className="text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">Execution Output</span>
          {isGenerating && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Streaming tokens...
            </span>
          )}
        </div>

        {/* Metrics & Actions */}
        <div className="flex items-center gap-3">
          {metrics && !isGenerating && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Clock size={11} className={metrics.cacheHit ? 'text-emerald-400' : 'text-amber-400'} />
                <span className={metrics.cacheHit ? 'text-emerald-300 font-bold' : ''}>
                  {metrics.latencyMs}ms
                </span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-200">
                {metrics.totalTokens.toLocaleString()} tokens
                <span className="text-[10px] text-slate-500 ml-1">
                  ({metrics.inputTokens} in / {metrics.outputTokens} out)
                </span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 font-medium">
                ${metrics.estimatedCost.toFixed(5)}
              </span>
            </div>
          )}

          {output && (
            <div className="flex items-center gap-1">
              {isJson && (
                <div className="flex p-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[10px]">
                  <button
                    onClick={() => setViewFormat('formatted')}
                    className={`px-1.5 py-0.5 rounded transition-colors ${
                      viewFormat === 'formatted' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setViewFormat('cards')}
                    className={`px-1.5 py-0.5 rounded transition-colors ${
                      viewFormat === 'cards' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setViewFormat('raw')}
                    className={`px-1.5 py-0.5 rounded transition-colors ${
                      viewFormat === 'raw' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Raw
                  </button>
                </div>
              )}
              <button
                onClick={handleCopy}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Copy output to clipboard"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Capability HUD Bar (Cache Hit & Guardrails Status) */}
      {metrics && !isGenerating && (metrics.cacheHit || metrics.guardrailStatus) && (
        <div className="px-4 py-2 border-b border-slate-800/80 bg-[#0c101b] flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Cache Status Badge */}
          <div className="flex items-center gap-2">
            {metrics.cacheHit ? (
              <div 
                onClick={onOpenGuardrailsModal}
                className="cursor-pointer flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] shadow-sm hover:bg-emerald-900/60 transition-colors"
                title="Served from high-speed cache layer without LLM round trip"
              >
                <Zap size={12} className="text-emerald-400 fill-emerald-400 animate-pulse" />
                <span className="font-bold">
                  ⚡ {metrics.cacheType === 'semantic' ? 'Semantic' : 'Exact'} Cache Hit: {metrics.latencyMs}ms
                </span>
                <span className="text-emerald-400/80 text-[10px]">
                  (Saved ~{metrics.savedLatencyMs || 1200}ms · 100% tokens)
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <span>Inference: Fresh Compute</span>
              </span>
            )}
          </div>

          {/* Guardrails Status Badge */}
          <div className="flex items-center gap-2">
            {metrics.guardrailStatus === 'blocked' ? (
              <button
                onClick={() => setShowGuardrailDetails(!showGuardrailDetails)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-600/70 text-rose-200 font-mono text-[11px] font-bold"
              >
                <ShieldAlert size={12} className="text-rose-400" />
                <span>🛡️ Intercepted by Guardrails</span>
                {showGuardrailDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            ) : metrics.guardrailStatus === 'repaired' ? (
              <button
                onClick={() => setShowGuardrailDetails(!showGuardrailDetails)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/60 text-amber-300 font-mono text-[11px]"
              >
                <ShieldCheck size={12} className="text-amber-400" />
                <span>🛡️ Self-Healing JSON Auto-Repaired</span>
                {showGuardrailDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            ) : (
              <button
                onClick={() => setShowGuardrailDetails(!showGuardrailDetails)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-mono text-[11px] transition-colors"
              >
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>🛡️ Guardrails: Passed</span>
                {showGuardrailDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}

            {onOpenGuardrailsModal && (
              <button
                onClick={onOpenGuardrailsModal}
                className="text-[10px] text-amber-400 hover:underline font-mono"
              >
                Manage Policy
              </button>
            )}
          </div>
        </div>
      )}

      {/* Expandable Guardrail Violations / Actions Log */}
      {showGuardrailDetails && metrics?.guardrailViolations && metrics.guardrailViolations.length > 0 && (
        <div className="p-3 bg-[#111422] border-b border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Guardrail Safety Interventions ({metrics.guardrailViolations.length})
          </div>
          <div className="space-y-1">
            {metrics.guardrailViolations.map((v, i) => (
              <div
                key={i}
                className="p-1.5 bg-[#090b10] border border-slate-800 rounded flex items-center justify-between text-[11px]"
              >
                <span className="text-amber-300 font-semibold">[{v.rule}]</span>
                <span className="text-slate-300 truncate max-w-sm">{v.message}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {v.actionTaken}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output Content */}
      <div className="flex-1 overflow-y-auto p-4 font-sans text-xs min-h-0">
        {error ? (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-200 space-y-2.5">
            <div className="font-semibold text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                <span>Execution Error</span>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  disabled={isGenerating}
                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-600/70 rounded text-[11px] font-semibold transition-all shadow-sm active:scale-95"
                >
                  <RotateCcw size={11} className={isGenerating ? 'animate-spin' : ''} />
                  <span>Retry Prompt</span>
                </button>
              )}
            </div>
            <p className="text-[11px] font-mono text-rose-300/90 leading-relaxed bg-black/30 p-2 rounded border border-rose-900/50">
              {error}
            </p>
            <p className="text-[10px] text-rose-300/70">
              💡 Tip: If Google AI Studio servers are experiencing temporary high demand, clicking <strong className="text-rose-200">Retry Prompt</strong> will automatically retry your request.
            </p>
          </div>
        ) : !output && !isGenerating ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-3">
              <AdinkraGlyph name="dono" size={24} className="text-slate-600" />
            </div>
            <p className="text-xs font-medium text-slate-400">Ready for Execution</p>
            <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">
              Click <kbd className="px-1 py-0.5 bg-slate-800 rounded text-amber-300 font-mono">Run</kbd> or press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-amber-300 font-mono">⌘+Enter</kbd> to execute your prompt against Gemini with active Semantic Caching & NeMo Guardrails.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* The main text */}
            {isJson && viewFormat === 'formatted' ? (
              <pre className="p-3 bg-[#0e111a] border border-slate-800/80 rounded-lg text-emerald-300/90 font-mono text-[11px] overflow-x-auto leading-relaxed shadow-inner">
                {JSON.stringify(parsedJson, null, 2)}
              </pre>
            ) : isJson && viewFormat === 'cards' && parsedJson && typeof parsedJson === 'object' ? (
              <div className="space-y-3">
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                  <FileCheck2 size={13} className="text-emerald-400" />
                  <span>Structured Output Entity Cards (Parsed without Error)</span>
                </div>
                {Array.isArray(parsedJson) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {parsedJson.map((item, idx) => (
                      <div key={idx} className="p-3 bg-[#0e111a] border border-slate-800 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono text-amber-400 font-bold">Item #{idx + 1}</span>
                        {typeof item === 'object' && item !== null ? (
                          Object.entries(item).map(([k, v]) => (
                            <div key={k} className="text-[11px]">
                              <span className="text-slate-400 font-mono">{k}: </span>
                              <span className="text-slate-200">{String(v)}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-200">{String(item)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(parsedJson).map(([k, v]) => (
                      <div key={k} className="p-3 bg-[#0e111a] border border-slate-800 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">{k}</span>
                        <div className="text-slate-200 text-xs whitespace-pre-wrap">
                          {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-200 font-sans leading-relaxed whitespace-pre-wrap selection:bg-amber-500/30">
                {output}
              </div>
            )}

            {/* Grounding Citations if present */}
            {groundingSources && groundingSources.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Search size={12} className="text-amber-400" />
                  <span>Google Search Grounding Sources ({groundingSources.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groundingSources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-[#121622] hover:bg-[#161c2c] border border-slate-800 rounded text-[11px] flex items-center justify-between group transition-colors"
                    >
                      <div className="truncate mr-2">
                        <div className="text-slate-200 font-medium truncate group-hover:text-amber-300">
                          {source.title || source.url}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">
                          {source.url}
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-slate-500 group-hover:text-amber-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
