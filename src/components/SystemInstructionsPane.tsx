import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Wand2, BookOpen, MessageSquare } from 'lucide-react';
import { AdinkraGlyph } from './AdinkraGlyph';

interface SystemInstructionsPaneProps {
  systemInstruction: string;
  setSystemInstruction: (val: string) => void;
  onOpenCommentForSystem?: () => void;
  commentCount?: number;
}

const PRESETS = [
  {
    name: 'Cultural & Cognitive Synthesizer',
    symbol: 'nyansapo',
    instruction:
      'You are an insightful cultural analyst and senior research assistant grounded in the philosophical traditions of West African Adinkra symbolism and modern cognitive science. Provide analytical, structured, and culturally nuanced answers. Maintain scholarly rigor, concise prose, and highlight systemic connections.',
  },
  {
    name: 'Senior Software Architect',
    symbol: 'adinkrahene',
    instruction:
      'You are a staff software architect with deep expertise in distributed systems, clean architecture, and type safety. Provide concise, production-ready code with actionable tradeoffs, minimal boilerplate, and strict adherence to modern idioms.',
  },
  {
    name: 'Structured JSON & Entity Extractor',
    symbol: 'sepow',
    instruction:
      'You are a high-precision data extraction engine. Always output strict, valid JSON conforming exactly to the user specification. Never add markdown wrapping, commentary, or conversational preludes.',
  },
  {
    name: 'Concise Executive Strategist',
    symbol: 'dame-dame',
    instruction:
      'You are a trusted strategic advisor to senior leadership. Prioritize high-signal synthesis, 3-point action plans, risk matrices, and bottom-line implications. Avoid filler prose and buzzwords.',
  },
];

export const SystemInstructionsPane: React.FC<SystemInstructionsPaneProps> = ({
  systemInstruction,
  setSystemInstruction,
  onOpenCommentForSystem,
  commentCount = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showPresets, setShowPresets] = useState(false);

  const tokenEstimate = Math.ceil((systemInstruction?.length || 0) / 4);

  return (
    <div className="border-b border-slate-800/80 bg-[#10131d]/60">
      {/* Header bar */}
      <div className="px-4 py-2 flex items-center justify-between text-xs select-none">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group font-medium"
        >
          {isExpanded ? (
            <ChevronDown size={14} className="text-amber-400" />
          ) : (
            <ChevronRight size={14} className="text-slate-400 group-hover:text-amber-400" />
          )}
          <span className="flex items-center gap-1.5">
            <AdinkraGlyph name="adinkrahene" size={13} className="text-amber-400/80" />
            <span className="font-semibold text-slate-200">System Instructions</span>
          </span>
          {tokenEstimate > 0 && (
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
              ~{tokenEstimate} tokens
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Preset templates dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-300 transition-colors px-2 py-0.5 rounded hover:bg-slate-800/60"
            >
              <Wand2 size={11} className="text-amber-400" />
              <span>Presets</span>
            </button>

            {showPresets && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-[#141824] border border-slate-700/80 rounded-lg shadow-2xl p-2 z-40">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 flex items-center gap-1">
                  <BookOpen size={11} />
                  <span>Curated System Presets</span>
                </div>
                <div className="space-y-1 mt-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        setSystemInstruction(p.instruction);
                        setShowPresets(false);
                      }}
                      className="w-full text-left p-2 rounded hover:bg-slate-800/80 transition-colors text-xs text-slate-200 group"
                    >
                      <div className="font-medium text-slate-200 group-hover:text-amber-300 flex items-center gap-1.5">
                        <AdinkraGlyph name={p.symbol} size={11} className="text-amber-400" />
                        <span>{p.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                        {p.instruction}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comment button */}
          {onOpenCommentForSystem && (
            <button
              onClick={onOpenCommentForSystem}
              title="Add feedback or discussion on System Instructions"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-800/60 transition-colors"
            >
              <MessageSquare size={12} className={commentCount > 0 ? 'text-amber-400' : 'text-slate-500'} />
              {commentCount > 0 && <span className="text-amber-400 font-mono">{commentCount}</span>}
            </button>
          )}

          {systemInstruction && (
            <button
              onClick={() => setSystemInstruction('')}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Editor Body */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-1">
          <textarea
            value={systemInstruction}
            onChange={(e) => setSystemInstruction(e.target.value)}
            placeholder="Optional context or instructions for how the model should behave, persona, output format, or behavioral guardrails..."
            rows={3}
            className="w-full bg-[#0a0c13] border border-slate-800/90 focus:border-amber-500/50 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-sans leading-relaxed resize-y transition-colors"
          />
        </div>
      )}
    </div>
  );
};
