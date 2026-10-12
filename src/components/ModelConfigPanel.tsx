import React, { useState } from 'react';
import { 
  Sliders, 
  Cpu, 
  Brain, 
  Globe, 
  Code, 
  ChevronDown, 
  Plus, 
  X, 
  Sparkles,
  Info,
  Layers,
  MessageSquare
} from 'lucide-react';
import { ModelParameters, ModelInfo, ThinkingLevelType } from '../types';
import { AdinkraGlyph } from './AdinkraGlyph';

interface ModelConfigPanelProps {
  model: string;
  setModel: (m: string) => void;
  modelsList: ModelInfo[];
  parameters: ModelParameters;
  setParameters: React.Dispatch<React.SetStateAction<ModelParameters>>;
  onOpenCommentForConfig?: () => void;
  commentCount?: number;
}

const SCHEMA_PRESETS = [
  {
    name: 'Cultural Synthesis & Entity Analysis',
    schema: JSON.stringify(
      {
        type: 'OBJECT',
        properties: {
          conceptName: { type: 'STRING' },
          philosophicalRoot: { type: 'STRING' },
          adinkraAnalogy: { type: 'STRING' },
          actionableTakeaways: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
        },
        required: ['conceptName', 'philosophicalRoot', 'actionableTakeaways'],
      },
      null,
      2
    ),
  },
  {
    name: 'Technical Specification',
    schema: JSON.stringify(
      {
        type: 'OBJECT',
        properties: {
          featureName: { type: 'STRING' },
          architectureTier: { type: 'STRING' },
          complexity: { type: 'STRING', enum: ['Low', 'Medium', 'High'] },
          risks: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
        },
        required: ['featureName', 'architectureTier'],
      },
      null,
      2
    ),
  },
  {
    name: 'Sentiment & Categorization',
    schema: JSON.stringify(
      {
        type: 'OBJECT',
        properties: {
          sentiment: { type: 'STRING', enum: ['Positive', 'Neutral', 'Negative'] },
          confidenceScore: { type: 'NUMBER' },
          keyEntities: {
            type: 'ARRAY',
            items: { type: 'STRING' },
          },
        },
        required: ['sentiment', 'confidenceScore'],
      },
      null,
      2
    ),
  },
];

export const ModelConfigPanel: React.FC<ModelConfigPanelProps> = ({
  model,
  setModel,
  modelsList,
  parameters,
  setParameters,
  onOpenCommentForConfig,
  commentCount = 0,
}) => {
  const [stopSeqInput, setStopSeqInput] = useState('');
  const [showSchemaPresets, setShowSchemaPresets] = useState(false);

  const selectedModelInfo = modelsList.find((m) => m.id === model) || {
    id: model,
    name: model,
    adinkraSymbol: 'nyansapo',
    symbolMeaning: 'Wisdom Knot',
    contextWindow: '1M tokens',
    pricingTier: 'Standard',
  };

  const handleAddStopSequence = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && stopSeqInput.trim()) {
      if (!parameters.stopSequences.includes(stopSeqInput.trim())) {
        setParameters((prev) => ({
          ...prev,
          stopSequences: [...prev.stopSequences, stopSeqInput.trim()],
        }));
      }
      setStopSeqInput('');
    }
  };

  const handleRemoveStopSequence = (seq: string) => {
    setParameters((prev) => ({
      ...prev,
      stopSequences: prev.stopSequences.filter((s) => s !== seq),
    }));
  };

  return (
    <div className="w-80 border-l border-slate-800/80 bg-[#0f121b] flex flex-col h-full overflow-y-auto text-xs select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-amber-400" />
          <span className="font-semibold text-slate-200">Model Parameters</span>
        </div>
        {onOpenCommentForConfig && (
          <button
            onClick={onOpenCommentForConfig}
            title="Feedback on model configuration"
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-300 transition-colors"
          >
            <MessageSquare size={12} className={commentCount > 0 ? 'text-amber-400' : 'text-slate-500'} />
            {commentCount > 0 && <span className="font-mono text-amber-400">{commentCount}</span>}
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Model Selector */}
        <div>
          <label className="text-[11px] font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu size={12} className="text-amber-400" />
              <span>Gemini Model</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {selectedModelInfo.contextWindow}
            </span>
          </label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#090b10] border border-slate-700/80 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
            >
              {modelsList.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#121622]">
                  {m.name} {m.isDefault ? '(Default)' : ''} {m.requiresPaidKey ? '🔑' : ''}
                </option>
              ))}
            </select>
          </div>
          {/* Model info banner */}
          <div className="mt-2 p-2 bg-[#121624] border border-slate-800 rounded-lg flex items-start gap-2">
            <AdinkraGlyph
              name={selectedModelInfo.adinkraSymbol || 'nyansapo'}
              size={14}
              className="text-amber-400 shrink-0 mt-0.5"
            />
            <div className="text-[10px] text-slate-400 leading-snug">
              <span className="text-slate-200 font-medium">{selectedModelInfo.adinkraSymbol}: </span>
              {selectedModelInfo.symbolMeaning}
            </div>
          </div>
        </div>

        {/* Thinking Level (Gemini 3 feature) */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Brain size={12} className="text-amber-400" />
              <span>Thinking Level</span>
            </label>
            <span className="text-[10px] text-amber-400 font-mono">
              Gemini 3
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
            Controls internal reasoning depth before output generation.
          </p>
          <div className="grid grid-cols-3 gap-1 bg-[#090b10] p-1 rounded-lg border border-slate-800">
            {(['MINIMAL', 'LOW', 'HIGH'] as ThinkingLevelType[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setParameters((prev) => ({ ...prev, thinkingLevel: lvl }))}
                className={`py-1 rounded text-[11px] font-mono transition-colors ${
                  parameters.thinkingLevel === lvl
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Temperature */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-300">Temperature</label>
            <span className="font-mono text-slate-300 text-[11px]">{parameters.temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={parameters.temperature}
            onChange={(e) =>
              setParameters((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))
            }
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-400 mt-1">
            <span>Deterministic (0.0)</span>
            <span>Creative (2.0)</span>
          </div>
        </div>

        {/* Top P & Top K */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300">Top P</label>
              <span className="font-mono text-slate-300 text-[11px]">{parameters.topP.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={parameters.topP}
              onChange={(e) =>
                setParameters((prev) => ({ ...prev, topP: parseFloat(e.target.value) }))
              }
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300">Top K</label>
              <span className="font-mono text-slate-300 text-[11px]">{parameters.topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={parameters.topK}
              onChange={(e) =>
                setParameters((prev) => ({ ...prev, topK: parseInt(e.target.value, 10) }))
              }
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        {/* Max Output Tokens - 3x Google AI Studio Capacity */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Max Output Tokens</label>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                3× AI Studio
              </span>
            </div>
            <span className="font-mono text-amber-300 font-semibold text-[11px]">
              {parameters.maxOutputTokens.toLocaleString()} tokens
            </span>
          </div>

          <input
            type="range"
            min="64"
            max="24576"
            step="128"
            value={parameters.maxOutputTokens}
            onChange={(e) =>
              setParameters((prev) => ({ ...prev, maxOutputTokens: parseInt(e.target.value, 10) }))
            }
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />

          {/* Presets buttons */}
          <div className="flex items-center justify-between gap-1 mt-2">
            {[
              { label: '2k', val: 2048, desc: 'Compact' },
              { label: '8k', val: 8192, desc: '1× AI Studio' },
              { label: '16k', val: 16384, desc: '2× Extended' },
              { label: '24.5k', val: 24576, desc: '3× Max' },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => setParameters((prev) => ({ ...prev, maxOutputTokens: preset.val }))}
                className={`flex-1 py-1 rounded text-[10px] font-mono transition-colors text-center ${
                  parameters.maxOutputTokens === preset.val
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title={`${preset.desc} (${preset.val.toLocaleString()} tokens)`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-2 p-2 bg-[#121624] border border-amber-500/20 rounded-lg text-[10px] text-slate-400 leading-snug">
            <span className="text-amber-300 font-semibold">3× Allowance Enabled: </span>
            Google AI Studio caps output tokens at <span className="font-mono text-slate-300">8,192</span>. Adinkra Studio extends your maximum response ceiling to <span className="font-mono text-amber-300 font-semibold">24,576 tokens</span> per request.
          </div>
        </div>

        {/* Stop Sequences */}
        <div className="pt-2 border-t border-slate-800/80">
          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
            Stop Sequences
          </label>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {parameters.stopSequences.map((seq) => (
              <span
                key={seq}
                className="bg-slate-900 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1"
              >
                <span>{seq}</span>
                <button
                  onClick={() => handleRemoveStopSequence(seq)}
                  className="hover:text-rose-400"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Type and press Enter to add..."
            value={stopSeqInput}
            onChange={(e) => setStopSeqInput(e.target.value)}
            onKeyDown={handleAddStopSequence}
            className="w-full bg-[#090b10] border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        {/* Google Search Grounding */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Globe size={13} className="text-amber-400" />
              <div>
                <div className="text-[11px] font-semibold text-slate-300">Search Grounding</div>
                <div className="text-[9px] text-slate-400">Live web sources via Google Search</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={parameters.enableSearchGrounding}
                onChange={(e) =>
                  setParameters((prev) => ({ ...prev, enableSearchGrounding: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* Response Format & JSON Schema */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <AdinkraGlyph name="sepow" size={12} className="text-amber-400" />
              <span>Structured Output</span>
            </label>
            <div className="flex p-0.5 bg-slate-900 rounded border border-slate-800">
              <button
                onClick={() => setParameters((prev) => ({ ...prev, responseFormat: 'text' }))}
                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                  parameters.responseFormat === 'text'
                    ? 'bg-amber-500/20 text-amber-300 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setParameters((prev) => ({ ...prev, responseFormat: 'json' }))}
                className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                  parameters.responseFormat === 'json'
                    ? 'bg-amber-500/20 text-amber-300 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                JSON
              </button>
            </div>
          </div>

          {parameters.responseFormat === 'json' && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Response Schema (JSON):</span>
                <button
                  onClick={() => setShowSchemaPresets(!showSchemaPresets)}
                  className="text-amber-400 hover:underline"
                >
                  Presets
                </button>
              </div>

              {showSchemaPresets && (
                <div className="p-2 bg-[#141824] border border-slate-700 rounded space-y-1">
                  {SCHEMA_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        setParameters((prev) => ({ ...prev, responseSchema: p.schema }));
                        setShowSchemaPresets(false);
                      }}
                      className="w-full text-left p-1 text-[10px] text-slate-300 hover:bg-slate-800 rounded"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={parameters.responseSchema || ''}
                onChange={(e) =>
                  setParameters((prev) => ({ ...prev, responseSchema: e.target.value }))
                }
                placeholder="Optional JSON schema definition..."
                rows={4}
                className="w-full bg-[#090b10] border border-slate-800 focus:border-amber-500/50 rounded p-2 text-[10px] text-slate-200 focus:outline-none font-mono resize-y"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
