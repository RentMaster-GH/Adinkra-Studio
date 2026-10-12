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
  Code
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
}

export const OutputView: React.FC<OutputViewProps> = ({
  output,
  isGenerating,
  metrics,
  groundingSources = [],
  onClearOutput,
  error,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewFormat, setViewFormat] = useState<'formatted' | 'raw'>('formatted');

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
                <Clock size={11} className="text-amber-400" />
                <span>{metrics.latencyMs}ms</span>
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
                <button
                  onClick={() => setViewFormat(viewFormat === 'formatted' ? 'raw' : 'formatted')}
                  className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded font-mono"
                >
                  {viewFormat === 'formatted' ? 'Pretty JSON' : 'Raw'}
                </button>
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

      {/* Output Content */}
      <div className="flex-1 overflow-y-auto p-4 font-sans text-xs min-h-0">
        {error ? (
          <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-200 space-y-1">
            <div className="font-semibold text-xs flex items-center gap-1.5">
              <span>Execution Error</span>
            </div>
            <p className="text-[11px] font-mono text-rose-300/90 leading-relaxed">{error}</p>
          </div>
        ) : !output && !isGenerating ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-3">
              <AdinkraGlyph name="dono" size={24} className="text-slate-600" />
            </div>
            <p className="text-xs font-medium text-slate-400">Ready for Execution</p>
            <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">
              Click <kbd className="px-1 py-0.5 bg-slate-800 rounded text-amber-300 font-mono">Run</kbd> or press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-amber-300 font-mono">⌘+Enter</kbd> to execute your prompt against Gemini with your active configuration.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* The main text */}
            {isJson && viewFormat === 'formatted' ? (
              <pre className="p-3 bg-[#0e111a] border border-slate-800/80 rounded-lg text-emerald-300/90 font-mono text-[11px] overflow-x-auto leading-relaxed shadow-inner">
                {JSON.stringify(parsedJson, null, 2)}
              </pre>
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
