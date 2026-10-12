import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  MessageSquare, 
  FileText, 
  Table2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PromptMode, ChatTurn, TestCase } from '../types';
import { AdinkraGlyph } from './AdinkraGlyph';

interface PromptEditorProps {
  mode: PromptMode;
  setMode: (mode: PromptMode) => void;
  userPrompt: string;
  setUserPrompt: (val: string) => void;
  turns: ChatTurn[];
  setTurns: React.Dispatch<React.SetStateAction<ChatTurn[]>>;
  testCases: TestCase[];
  setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
  variables: Record<string, string>;
  setVariables: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onRunTestCase: (tc: TestCase) => void;
  onRunAllTestCases: () => void;
  isEvaluatingBatch?: boolean;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  mode,
  setMode,
  userPrompt,
  setUserPrompt,
  turns,
  setTurns,
  testCases,
  setTestCases,
  variables,
  setVariables,
  onRunTestCase,
  onRunAllTestCases,
  isEvaluatingBatch = false,
}) => {
  // Extract {{variable}} matches from prompt
  const detectedVariables = Array.from(
    new Set((userPrompt.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) || []).map((m) => m.slice(2, -2)))
  );

  const tokenEstimate = Math.ceil((userPrompt?.length || 0) / 4);

  // Chat Turn operations
  const addTurn = (role: 'user' | 'model') => {
    setTurns((prev) => [
      ...prev,
      {
        id: `turn-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
        role,
        content: '',
      },
    ]);
  };

  const updateTurn = (id: string, content: string) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, content } : t)));
  };

  const toggleTurnRole = (id: string) => {
    setTurns((prev) =>
      prev.map((t) => (t.id === id ? { ...t, role: t.role === 'user' ? 'model' : 'user' } : t))
    );
  };

  const removeTurn = (id: string) => {
    setTurns((prev) => prev.filter((t) => t.id !== id));
  };

  // Test Case operations
  const addTestCase = () => {
    const newId = `tc-${Date.now().toString(36)}`;
    setTestCases((prev) => [
      ...prev,
      {
        id: newId,
        category: 'Custom Test',
        input: 'Sample query for prompt evaluation',
        expectedOutput: '',
      },
    ]);
  };

  const updateTestCase = (id: string, field: keyof TestCase, val: any) => {
    setTestCases((prev) => prev.map((tc) => (tc.id === id ? { ...tc, [field]: val } : tc)));
  };

  const removeTestCase = (id: string) => {
    setTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0c0e14]">
      {/* Mode Sub-Navigation Tabs */}
      <div className="h-10 px-4 border-b border-slate-800/80 bg-[#0e111a] flex items-center justify-between select-none">
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setMode('freeform')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === 'freeform'
                ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={13} />
            <span>Freeform</span>
          </button>

          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === 'chat'
                ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={13} />
            <span>Chat ({turns.length} turns)</span>
          </button>

          <button
            onClick={() => setMode('structured')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === 'structured'
                ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table2 size={13} />
            <span>Test Matrix ({testCases.length})</span>
          </button>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {mode === 'freeform' && (
            <div className="flex items-center gap-2">
              {detectedVariables.length > 0 && (
                <span className="text-[11px] font-mono text-amber-400/90 bg-amber-950/40 border border-amber-800/50 px-1.5 py-0.5 rounded">
                  {detectedVariables.length} variable{detectedVariables.length > 1 ? 's' : ''} detected
                </span>
              )}
              <span className="font-mono text-[11px] text-slate-400">
                ~{tokenEstimate} tokens
              </span>
            </div>
          )}

          {mode === 'structured' && (
            <button
              onClick={onRunAllTestCases}
              disabled={isEvaluatingBatch || testCases.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded text-xs font-medium transition-colors"
            >
              <Play size={11} className="fill-current" />
              <span>{isEvaluatingBatch ? 'Evaluating...' : 'Run All Test Cases'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Body based on selected Mode */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
        {/* FREEFORM MODE */}
        {mode === 'freeform' && (
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Enter your prompt here... Tip: use {{variable_name}} to inject dynamic test variables."
                className="flex-1 w-full bg-[#090b10] border border-slate-800/90 focus:border-amber-500/50 rounded-lg p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-mono leading-relaxed resize-none transition-colors"
              />
            </div>

            {/* Variable Substitutions Panel if {{variables}} present */}
            {detectedVariables.length > 0 && (
              <div className="bg-[#121521] border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-400" />
                    <span>Dynamic Prompt Variables</span>
                  </span>
                  <span className="text-[10px] text-slate-400 lowercase font-normal">
                    interpolated at execution time
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {detectedVariables.map((v) => (
                    <div key={v} className="flex items-center gap-2 bg-[#090b10] border border-slate-800 rounded px-2.5 py-1.5">
                      <span className="text-xs font-mono text-amber-400 select-none">
                        {'{{' + v + '}}'}
                      </span>
                      <ArrowRight size={11} className="text-slate-600" />
                      <input
                        type="text"
                        placeholder={`Value for ${v}...`}
                        value={variables[v] || ''}
                        onChange={(e) => setVariables((prev) => ({ ...prev, [v]: e.target.value }))}
                        className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHAT MODE */}
        {mode === 'chat' && (
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {turns.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-500">
                  <MessageSquare size={32} className="mb-2 text-slate-600" />
                  <p className="text-xs font-medium text-slate-400">No chat turns created yet</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                    Start a multi-turn conversation to test conversational grounding, role turns, and memory across messages.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => addTurn('user')}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-medium flex items-center gap-1.5"
                    >
                      <Plus size={12} />
                      <span>Add User Turn</span>
                    </button>
                  </div>
                </div>
              ) : (
                turns.map((turn, idx) => (
                  <div
                    key={turn.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      turn.role === 'user'
                        ? 'bg-[#101422] border-slate-800/90'
                        : 'bg-[#141824] border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleTurnRole(turn.id)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono transition-colors ${
                            turn.role === 'user'
                              ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                          }`}
                        >
                          {turn.role} (click to toggle)
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">Turn #{idx + 1}</span>
                      </div>
                      <button
                        onClick={() => removeTurn(turn.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Delete Turn"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <textarea
                      value={turn.content}
                      onChange={(e) => updateTurn(turn.id, e.target.value)}
                      placeholder={
                        turn.role === 'user'
                          ? 'What would the user say here?'
                          : 'Sample or expected model response...'
                      }
                      rows={2}
                      className="w-full bg-[#0a0c13] border border-slate-800 focus:border-amber-500/50 rounded p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500/30 font-sans leading-relaxed resize-y"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Chat Turn Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => addTurn('user')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
              >
                <Plus size={12} className="text-blue-400" />
                <span>Add User Turn</span>
              </button>
              <button
                onClick={() => addTurn('model')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
              >
                <Plus size={12} className="text-amber-400" />
                <span>Add Model Turn</span>
              </button>
            </div>
          </div>
        )}

        {/* STRUCTURED TEST MATRIX */}
        {mode === 'structured' && (
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Evaluate prompt resilience across diverse inputs and verify output schemas.
              </div>
              <button
                onClick={addTestCase}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded text-xs font-medium transition-colors"
              >
                <Plus size={12} className="text-amber-400" />
                <span>Add Test Case</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {testCases.map((tc, index) => (
                <div
                  key={tc.id}
                  className="bg-[#121622] border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold text-amber-400">
                        Case #{index + 1}
                      </span>
                      <input
                        type="text"
                        value={tc.category || ''}
                        onChange={(e) => updateTestCase(tc.id, 'category', e.target.value)}
                        placeholder="Category (e.g. Edge Case)"
                        className="bg-slate-900/80 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-300 font-mono w-36"
                      />
                      {tc.passed !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${
                            tc.passed
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {tc.passed ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {tc.passed ? 'Passed' : 'Failed'}
                        </span>
                      )}
                      {tc.latencyMs && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {tc.latencyMs}ms
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onRunTestCase(tc)}
                        disabled={tc.running}
                        className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
                        title="Run This Test Case"
                      >
                        <Play size={13} className={tc.running ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={() => removeTestCase(tc.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Delete Test Case"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Input & Expected Output Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">Test Input:</div>
                      <textarea
                        value={tc.input}
                        onChange={(e) => updateTestCase(tc.id, 'input', e.target.value)}
                        placeholder="Test input payload..."
                        rows={2}
                        className="w-full bg-[#090b10] border border-slate-800 focus:border-amber-500/50 rounded p-2 text-xs text-slate-200 focus:outline-none font-mono resize-none"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1">Expected Output (or validation criteria):</div>
                      <textarea
                        value={tc.expectedOutput || ''}
                        onChange={(e) => updateTestCase(tc.id, 'expectedOutput', e.target.value)}
                        placeholder="Expected string or regex pattern..."
                        rows={2}
                        className="w-full bg-[#090b10] border border-slate-800 focus:border-amber-500/50 rounded p-2 text-xs text-slate-200 focus:outline-none font-mono resize-none"
                      />
                    </div>
                  </div>

                  {/* Actual Output if evaluated */}
                  {tc.actualOutput && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80">
                      <div className="text-[10px] text-slate-400 mb-0.5">Actual Model Output:</div>
                      <div className="bg-[#090b10] border border-slate-800/80 rounded p-2 text-xs text-slate-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {tc.actualOutput}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
