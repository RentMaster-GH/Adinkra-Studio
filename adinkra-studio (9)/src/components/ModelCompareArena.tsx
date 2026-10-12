import React, { useState } from 'react';
import { Play, Clock, Sparkles, Check, ThumbsUp, ThumbsDown, Copy } from 'lucide-react';
import { PromptState, ModelInfo } from '../types';
import { AdinkraGlyph } from './AdinkraGlyph';
import { api } from '../services/api';

interface ModelCompareArenaProps {
  promptState: PromptState;
  modelsList: ModelInfo[];
}

interface ComparisonResult {
  modelId: string;
  modelName: string;
  output: string;
  latencyMs: number;
  tokens: { inputTokens: number; outputTokens: number; totalTokens: number };
  status: 'idle' | 'running' | 'done' | 'error';
  error?: string;
  rating?: 'up' | 'down';
}

export const ModelCompareArena: React.FC<ModelCompareArenaProps> = ({
  promptState,
  modelsList,
}) => {
  const [modelA, setModelA] = useState('gemini-3.8-flash');
  const [modelB, setModelB] = useState('gemini-3.1-flash-lite');
  const [results, setResults] = useState<Record<string, ComparisonResult>>({
    [modelA]: {
      modelId: modelA,
      modelName: 'Gemini 3.8 Flash',
      output: '',
      latencyMs: 0,
      tokens: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      status: 'idle',
    },
    [modelB]: {
      modelId: modelB,
      modelName: 'Gemini 3.1 Flash Lite',
      output: '',
      latencyMs: 0,
      tokens: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      status: 'idle',
    },
  });
  const [isRunning, setIsRunning] = useState(false);

  const handleRunComparison = async () => {
    setIsRunning(true);
    const targetModels = [modelA, modelB];

    // Reset status
    setResults({
      [modelA]: {
        modelId: modelA,
        modelName: modelsList.find((m) => m.id === modelA)?.name || modelA,
        output: '',
        latencyMs: 0,
        tokens: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        status: 'running',
      },
      [modelB]: {
        modelId: modelB,
        modelName: modelsList.find((m) => m.id === modelB)?.name || modelB,
        output: '',
        latencyMs: 0,
        tokens: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        status: 'running',
      },
    });

    // Run parallel calls
    await Promise.all(
      targetModels.map(async (mId) => {
        try {
          const res = await api.generate({
            model: mId,
            systemInstruction: promptState.systemInstruction,
            prompt: promptState.userPrompt,
            parameters: promptState.parameters,
          });

          setResults((prev) => ({
            ...prev,
            [mId]: {
              modelId: mId,
              modelName: modelsList.find((m) => m.id === mId)?.name || mId,
              output: res.text,
              latencyMs: res.latencyMs,
              tokens: res.usage,
              status: 'done',
            },
          }));
        } catch (err: any) {
          setResults((prev) => ({
            ...prev,
            [mId]: {
              modelId: mId,
              modelName: modelsList.find((m) => m.id === mId)?.name || mId,
              output: '',
              latencyMs: 0,
              tokens: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
              status: 'error',
              error: err.message || 'Model execution failed',
            },
          }));
        }
      })
    );

    setIsRunning(false);
  };

  const handleRate = (modelId: string, rating: 'up' | 'down') => {
    setResults((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        rating: prev[modelId]?.rating === rating ? undefined : rating,
      },
    }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0c0e14]">
      {/* Top Banner */}
      <div className="h-14 px-4 border-b border-slate-800/80 bg-[#0e111a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AdinkraGlyph name="dame-dame" size={18} className="text-amber-400" />
          <div>
            <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
              <span>Dame-Dame Multi-Model Arena</span>
              <span className="text-[10px] text-amber-400/90 bg-amber-950/60 px-1.5 rounded border border-amber-800/60 font-mono">
                Side-by-Side Eval
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Benchmark prompt quality, latency, and token consumption across Gemini models
            </div>
          </div>
        </div>

        <button
          onClick={handleRunComparison}
          disabled={isRunning || !promptState.userPrompt.trim()}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all shadow-md ${
            isRunning
              ? 'bg-amber-600/50 text-slate-300 animate-pulse cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
          }`}
        >
          <Play size={13} className="fill-current" />
          <span>{isRunning ? 'Benchmarking Models...' : 'Run Arena Comparison'}</span>
        </button>
      </div>

      {/* Comparison Grid */}
      <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {/* Model A Card */}
        <div className="bg-[#101420] border border-slate-800/90 rounded-xl flex flex-col min-h-[400px]">
          <div className="p-3 border-b border-slate-800 bg-[#131724] rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <select
                value={modelA}
                onChange={(e) => setModelA(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
              >
                {modelsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {results[modelA]?.status === 'done' && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock size={11} className="text-amber-400" />
                  <span>{results[modelA].latencyMs}ms</span>
                </span>
                <span className="text-slate-600">·</span>
                <span>{results[modelA].tokens.totalTokens} tokens</span>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto font-sans text-xs min-h-0">
            {results[modelA]?.status === 'running' ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <span className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono">Generating response...</span>
              </div>
            ) : results[modelA]?.status === 'error' ? (
              <div className="text-rose-400 font-mono text-xs p-3 bg-rose-950/30 rounded border border-rose-900">
                {results[modelA]?.error}
              </div>
            ) : results[modelA]?.output ? (
              <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
                {results[modelA]?.output}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                Run arena to view output
              </div>
            )}
          </div>

          {results[modelA]?.status === 'done' && (
            <div className="p-2.5 border-t border-slate-800/80 bg-[#121622] rounded-b-xl flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 font-mono">Evaluate Quality:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRate(modelA, 'up')}
                  className={`p-1.5 rounded transition-colors ${
                    results[modelA]?.rating === 'up'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  onClick={() => handleRate(modelA, 'down')}
                  className={`p-1.5 rounded transition-colors ${
                    results[modelA]?.rating === 'down'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <ThumbsDown size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Model B Card */}
        <div className="bg-[#101420] border border-slate-800/90 rounded-xl flex flex-col min-h-[400px]">
          <div className="p-3 border-b border-slate-800 bg-[#131724] rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <select
                value={modelB}
                onChange={(e) => setModelB(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono"
              >
                {modelsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {results[modelB]?.status === 'done' && (
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock size={11} className="text-blue-400" />
                  <span>{results[modelB].latencyMs}ms</span>
                </span>
                <span className="text-slate-600">·</span>
                <span>{results[modelB].tokens.totalTokens} tokens</span>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto font-sans text-xs min-h-0">
            {results[modelB]?.status === 'running' ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <span className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono">Generating response...</span>
              </div>
            ) : results[modelB]?.status === 'error' ? (
              <div className="text-rose-400 font-mono text-xs p-3 bg-rose-950/30 rounded border border-rose-900">
                {results[modelB]?.error}
              </div>
            ) : results[modelB]?.output ? (
              <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
                {results[modelB]?.output}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                Run arena to view output
              </div>
            )}
          </div>

          {results[modelB]?.status === 'done' && (
            <div className="p-2.5 border-t border-slate-800/80 bg-[#121622] rounded-b-xl flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 font-mono">Evaluate Quality:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRate(modelB, 'up')}
                  className={`p-1.5 rounded transition-colors ${
                    results[modelB]?.rating === 'up'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  onClick={() => handleRate(modelB, 'down')}
                  className={`p-1.5 rounded transition-colors ${
                    results[modelB]?.rating === 'down'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <ThumbsDown size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
