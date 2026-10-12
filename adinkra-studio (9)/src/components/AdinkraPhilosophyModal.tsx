import React from 'react';
import { X, BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import { AdinkraGlyph } from './AdinkraGlyph';

interface AdinkraPhilosophyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SYMBOLS = [
  {
    name: 'Sankofa',
    symbol: 'sankofa',
    meaning: 'Retrieve the Past / Go Back and Fetch It',
    proverb: '“Se wo were fi na wosankofa a yenkyi” — It is not taboo to go back and fetch that which you forgot.',
    studioRole: 'Real-Time Version History & Time Travel',
    description:
      'In prompt engineering, breakthroughs occur through disciplined iteration. Sankofa powers our immutable snapshot engine, line-by-line visual diffs, and 1-click rollback, allowing teams to fearlessly experiment and retrieve golden states.',
  },
  {
    name: 'Nyansapo',
    symbol: 'nyansapo',
    meaning: 'The Wisdom Knot',
    proverb: '“Nyansapo wɔsane no badwemma” — The knot of wisdom is untied only by the wise.',
    studioRole: 'Prompt Engineering & AI Optimization Co-Pilot',
    description:
      'Intelligent prompting is an intricate craft requiring cognitive nuance, role anchoring, and structural constraint. Nyansapo drives our prompt analysis engine, synthesizing exemplars, clarifying intent, and auditing edge-case vulnerabilities.',
  },
  {
    name: 'Adinkrahene',
    symbol: 'adinkrahene',
    meaning: 'Chief of Symbols / Foundational Authority',
    proverb: 'Symbol of charisma, leadership, and foundational greatness.',
    studioRole: 'System Instructions & Governance',
    description:
      'Composed of three concentric circles, Adinkrahene anchors the system-level guardrails, model persona, and foundational governance that guides every subsequent prompt turn.',
  },
  {
    name: 'Akoma',
    symbol: 'akoma',
    meaning: 'The Heart / Mutual Understanding',
    proverb: 'Symbol of love, patience, goodwill, and endurance.',
    studioRole: 'Team Presence & Collaborative Review',
    description:
      'High-performing AI applications are engineered by multi-disciplinary teams. Akoma powers real-time collaborator presence, line-level feedback annotations, and asynchronous team threads.',
  },
  {
    name: 'Dono',
    symbol: 'dono',
    meaning: 'The Talking Drum / Acoustic Resonance',
    proverb: 'Communicator of urgency, celebration, and historical memory.',
    studioRole: 'Live Token Streaming & 3× Expanded Daily Quota',
    description:
      'Captures the cadence of inference speed, token velocity, and generation feedback from Gemini 3 models—supercharged with 3× the standard Google AI Studio allowance (3,000,000 daily tokens and up to 24,576 tokens per turn).',
  },
  {
    name: 'Dame-Dame',
    symbol: 'dame-dame',
    meaning: 'Intelligence, Strategy & Board Play',
    proverb: 'Symbol of craftiness, foresight, and tactical mastery.',
    studioRole: 'Multi-Model Arena & Comparative Evaluation',
    description:
      'Directly pit Gemini 3.8 Flash against Gemini 3.1 Flash Lite or reasoning variants side-by-side to assess qualitative output against latency and operational cost.',
  },
  {
    name: 'Sepow',
    symbol: 'sepow',
    meaning: 'Oath of Truth & Execution',
    proverb: 'Symbol of justice, truth-telling, and binding contracts.',
    studioRole: 'Structured JSON Schemas & Validation Matrix',
    description:
      'Guarantees strict schema adherence and contractual reliability for programmatic agent workflows and tool calling.',
  },
];

export const AdinkraPhilosophyModal: React.FC<AdinkraPhilosophyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#101422] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#131728] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <AdinkraGlyph name="adinkrahene" size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span>The Philosophy of Adinkra Studio</span>
                <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded font-mono">
                  Akan Tradition · AI Engineering
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Grounding state-of-the-art prompt architecture in ancient West African visual epistemology
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-[#0c0e14]">
          <div className="p-3 bg-[#131826] border border-amber-500/30 rounded-xl leading-relaxed text-slate-300">
            <p className="mb-2">
              <strong className="text-amber-400">Adinkra</strong> symbols were originated by the Akan people of West Africa (modern-day Ghana and Côte d’Ivoire) as a visual language conveying timeless philosophical concepts, aphorisms, historical records, and human values.
            </p>
            <p>
              In <strong className="text-slate-100">Adinkra Studio</strong>, we pair the cutting-edge capability of Google’s Gemini 3 models with the engineering virtues embodied in these symbols — treating prompt design not as a black box, but as an intentional craft of wisdom, collaboration, and rigorous historical recall.
            </p>
          </div>

          <div className="space-y-3">
            {SYMBOLS.map((s) => (
              <div
                key={s.name}
                className="p-3.5 bg-[#101420] border border-slate-800/90 rounded-xl hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <AdinkraGlyph name={s.symbol} size={18} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-xs">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({s.meaning})</span>
                      </div>
                      <span className="text-[10px] text-amber-400/90 font-mono">
                        Role: {s.studioRole}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-amber-300/80 italic font-serif">
                  {s.proverb}
                </p>

                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#131728] flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            Adinkra Studio · Engineered for collaborative intelligence
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs"
          >
            Explore Studio
          </button>
        </div>
      </div>
    </div>
  );
};
