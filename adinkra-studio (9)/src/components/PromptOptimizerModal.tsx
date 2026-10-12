import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Layers, 
  ShieldCheck, 
  Check, 
  ArrowRight, 
  Copy, 
  Plus, 
  X,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { AdinkraGlyph } from './AdinkraGlyph';
import { api } from '../services/api';
import { TestCase } from '../types';

interface PromptOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrompt: string;
  currentSystemInstruction: string;
  onApplyOptimized: (prompt: string, systemInstruction?: string) => void;
  onAddTestCases: (cases: TestCase[]) => void;
}

export const PromptOptimizerModal: React.FC<PromptOptimizerModalProps> = ({
  isOpen,
  onClose,
  currentPrompt,
  currentSystemInstruction,
  onApplyOptimized,
  onAddTestCases,
}) => {
  const [activeTab, setActiveTab] = useState<'refine' | 'few-shot' | 'test-suite' | 'audit'>('refine');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleRunOptimization = async (action: 'refine' | 'few-shot' | 'test-suite' | 'audit') => {
    setActiveTab(action);
    setLoading(true);
    setResult(null);
    setApplied(false);
    try {
      const res = await api.optimize({
        action,
        prompt: currentPrompt,
        systemInstruction: currentSystemInstruction,
      });
      setResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRefined = () => {
    if (!result?.optimizedPrompt) return;
    onApplyOptimized(result.optimizedPrompt, result.suggestedSystemInstruction);
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleApplyTestCases = () => {
    if (!result?.testCases) return;
    const mapped: TestCase[] = result.testCases.map((tc: any, i: number) => ({
      id: `tc-gen-${Date.now()}-${i}`,
      category: tc.category || 'Generated Test',
      input: tc.input,
      expectedOutput: tc.evaluationCriteria || '',
    }));
    onAddTestCases(mapped);
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101422] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#131728] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <AdinkraGlyph name="nyansapo" size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>Nyansapo Prompt Intelligence Co-Pilot</span>
                <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded font-mono">
                  Wisdom Knot
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Enhance prompt engineering precision, edge-case coverage, and structural resilience
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

        {/* Feature Tabs */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-[#0e111a] flex gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => handleRunOptimization('refine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'refine'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 size={13} className="text-amber-400" />
            <span>Refine & Structure</span>
          </button>

          <button
            onClick={() => handleRunOptimization('few-shot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'few-shot'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={13} className="text-amber-400" />
            <span>Generate Few-Shot Pairs</span>
          </button>

          <button
            onClick={() => handleRunOptimization('test-suite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'test-suite'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={13} className="text-amber-400" />
            <span>Synthesize Test Cases</span>
          </button>

          <button
            onClick={() => handleRunOptimization('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'audit'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck size={13} className="text-amber-400" />
            <span>Security & Risk Audit</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 text-xs space-y-4 min-h-0 bg-[#0c0e14]">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <span className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs font-mono">Nyansapo AI analyzing prompt topology...</div>
            </div>
          ) : !result ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <AdinkraGlyph name="nyansapo" size={32} className="text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Select an intelligence action above</p>
              <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                Adinkra Studio uses Gemini 3.8 to iteratively refine prompts, formulate exemplars, and pressure-test edge cases.
              </p>
              <button
                onClick={() => handleRunOptimization(activeTab)}
                className="mt-4 px-4 py-1.5 bg-amber-500 text-slate-950 font-semibold rounded-lg text-xs"
              >
                Analyze Current Prompt
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* REFINE TAB RESULT */}
              {activeTab === 'refine' && (
                <div className="space-y-3">
                  {result.improvements && (
                    <div className="p-3 bg-[#131724] border border-slate-800 rounded-lg">
                      <div className="text-[11px] font-semibold text-amber-400 mb-1.5 flex items-center gap-1.5">
                        <Lightbulb size={12} />
                        <span>Key Improvements Applied</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                        {result.improvements.map((imp: string, i: number) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.suggestedSystemInstruction && (
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 mb-1">
                        Suggested System Instruction:
                      </div>
                      <div className="p-2.5 bg-[#090b10] border border-slate-800 rounded font-sans text-slate-200 text-xs">
                        {result.suggestedSystemInstruction}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 mb-1">
                      Optimized Prompt:
                    </div>
                    <div className="p-3 bg-[#090b10] border border-amber-500/30 rounded font-mono text-slate-200 text-xs whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                      {result.optimizedPrompt}
                    </div>
                  </div>
                </div>
              )}

              {/* FEW-SHOT TAB RESULT */}
              {activeTab === 'few-shot' && result.exemplars && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    High-quality few-shot exemplars synthesized for your task:
                  </div>
                  {result.exemplars.map((ex: any, idx: number) => (
                    <div key={idx} className="p-3 bg-[#131724] border border-slate-800 rounded-lg space-y-1.5">
                      <div className="font-semibold text-amber-400 text-[11px]">
                        Exemplar #{idx + 1} {ex.rationale ? `· ${ex.rationale}` : ''}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 bg-[#090b10] rounded border border-slate-800">
                          <span className="text-slate-500 block text-[9px] uppercase">Input</span>
                          <span className="text-slate-300">{ex.input}</span>
                        </div>
                        <div className="p-2 bg-[#090b10] rounded border border-slate-800">
                          <span className="text-slate-500 block text-[9px] uppercase">Output</span>
                          <span className="text-emerald-300">{ex.output}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TEST SUITE TAB RESULT */}
              {activeTab === 'test-suite' && result.testCases && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Generated evaluation test suite to audit edge cases and constraints:
                  </div>
                  <div className="space-y-2">
                    {result.testCases.map((tc: any, i: number) => (
                      <div key={i} className="p-2.5 bg-[#121622] border border-slate-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-amber-400 font-semibold text-[11px]">
                            {tc.category}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-200">{tc.input}</div>
                        {tc.evaluationCriteria && (
                          <div className="text-[10px] text-slate-400 italic">
                            Criteria: {tc.evaluationCriteria}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AUDIT TAB RESULT */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#131724] border border-slate-800 rounded-lg">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Robustness Score</div>
                      <div className="text-2xl font-bold font-mono text-amber-400">
                        {result.score || 90}/100
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Risk Assessment</div>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {result.riskLevel || 'Low'}
                      </span>
                    </div>
                  </div>

                  {result.findings && result.findings.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-300">Audit Findings:</div>
                      {result.findings.map((f: any, i: number) => (
                        <div key={i} className="p-2.5 bg-[#090b10] border border-slate-800 rounded text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase px-1 rounded bg-amber-950 text-amber-400 border border-amber-800">
                              {f.severity}
                            </span>
                            <span className="font-semibold text-slate-200">{f.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{f.description}</p>
                          {f.recommendation && (
                            <p className="text-[11px] text-emerald-400">Fix: {f.recommendation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#131728] flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {applied ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Check size={12} /> Successfully applied to active workspace!
              </span>
            ) : (
              <span>Adinkra Nyansapo Studio intelligence</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white rounded"
            >
              Close
            </button>
            {activeTab === 'refine' && result?.optimizedPrompt && (
              <button
                onClick={handleApplyRefined}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-lg text-xs shadow-md"
              >
                Apply to Working Prompt
              </button>
            )}
            {activeTab === 'test-suite' && result?.testCases && (
              <button
                onClick={handleApplyTestCases}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-lg text-xs shadow-md"
              >
                Add Cases to Test Matrix
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
