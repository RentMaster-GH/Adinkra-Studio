import React, { useState, useEffect, useCallback } from 'react';
import { 
  StudioMode, 
  PromptMode, 
  PromptState, 
  ModelParameters, 
  ModelInfo, 
  VersionSnapshot, 
  WorkspaceComment, 
  Author, 
  TestCase, 
  ChatTurn, 
  ExecutionMetrics,
  DailyTokenQuota
} from './types';
import { api } from './services/api';
import { Header } from './components/Header';
import { SystemInstructionsPane } from './components/SystemInstructionsPane';
import { PromptEditor } from './components/PromptEditor';
import { ModelConfigPanel } from './components/ModelConfigPanel';
import { OutputView } from './components/OutputView';
import { SankofaVersionHistory } from './components/SankofaVersionHistory';
import { ModelCompareArena } from './components/ModelCompareArena';
import { PromptOptimizerModal } from './components/PromptOptimizerModal';
import { GetCodeModal } from './components/GetCodeModal';
import { CommitModal } from './components/CommitModal';
import { ShareModal } from './components/ShareModal';
import { CommentsDrawer } from './components/CommentsDrawer';
import { AdinkraPhilosophyModal } from './components/AdinkraPhilosophyModal';

const DEFAULT_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    adinkraSymbol: 'nyansapo',
    symbolMeaning: 'Wisdom Knot (Highest general intelligence & velocity)',
    contextWindow: '1M tokens',
    pricingTier: 'Standard',
    features: ['Multimodal', 'Extended Reasoning', 'Search Grounding', 'Structured JSON'],
    isDefault: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    adinkraSymbol: 'dono',
    symbolMeaning: 'Talking Drum (Instant speed, cost-optimized for high throughput)',
    contextWindow: '1M tokens',
    pricingTier: 'Ultra-low latency',
    features: ['High Throughput', 'Cost Effective', 'Fast Inference'],
    isDefault: false,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    adinkraSymbol: 'adinkrahene',
    symbolMeaning: 'Chief of Symbols (Maximum STEM reasoning & code generation)',
    contextWindow: '2M tokens',
    pricingTier: 'Paid Key Required',
    features: ['Complex Reasoning', 'Code Synthesis', 'Deep Analytical Tasks'],
    isDefault: false,
    requiresPaidKey: true,
  },
];

const INITIAL_COLLABORATORS: Author[] = [
  {
    name: 'Violet Akuagyei',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    role: 'Prompt Architect',
    status: 'active',
    currentAction: 'Studio Lead',
  },
  {
    name: 'Kwame Mensah',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    role: 'Staff ML Engineer',
    status: 'editing',
    currentAction: 'Tuning Thinking Config',
  },
  {
    name: 'Amara Okafor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces',
    role: 'Eval Specialist',
    status: 'active',
    currentAction: 'Reviewing Sankofa diff',
  },
  {
    name: 'Kofi Boateng',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    role: 'Product Lead',
    status: 'idle',
  },
];

export default function App() {
  // Navigation & Studio Mode
  const [mode, setMode] = useState<StudioMode>('playground');
  const [promptMode, setPromptMode] = useState<PromptMode>('freeform');
  const [title, setTitle] = useState('Multimodal Cultural Synthesis & Analysis Agent');
  const [currentBranch, setCurrentBranch] = useState('main');
  const [branches, setBranches] = useState(['main', 'structured-evals', 'creative-experiments']);

  // Prompt Engineering State
  const [systemInstruction, setSystemInstruction] = useState(
    'You are an insightful cultural analyst and senior research assistant grounded in the philosophical traditions of West African Adinkra symbolism and modern cognitive science. Provide analytical, structured, and culturally nuanced answers. Maintain scholarly rigor, concise prose, and highlight systemic connections.'
  );
  const [userPrompt, setUserPrompt] = useState(
    'Analyze the significance of the "Sankofa" (looking back to fetch the past) and "Nyansapo" (knot of wisdom) concepts in modern AI engineering and iterative prompt version control. Present your analysis in 3 structured sections: 1. Philosophical Grounding, 2. Architectural Analog, 3. Practical Heuristics for Engineers.'
  );
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: 'turn-1',
      role: 'user',
      content: 'Explain the principle of Sankofa in the context of prompt engineering.',
    },
    {
      id: 'turn-2',
      role: 'model',
      content:
        'Sankofa teaches that looking backward to retrieve forgotten knowledge is not regressive, but essential for forward progress. In prompt engineering, this translates into rigorous versioning: maintaining snapshot histories of prompt iterations so teams can diff regressions, revert to golden exemplars, and benchmark baseline states.',
    },
  ]);
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: 'tc-1',
      category: 'Core Analogy',
      input: 'How does Nyansapo relate to few-shot prompt construction?',
      expectedOutput: 'Relates to untying complex wisdom through minimal, high-signal exemplar pairs.',
    },
    {
      id: 'tc-2',
      category: 'Edge Case',
      input: 'Provide an evaluation rubric for prompt safety using Akan proverbs.',
      expectedOutput: 'Should include guardrails, ethical grounding, and systemic constraint verification.',
    },
  ]);
  const [variables, setVariables] = useState<Record<string, string>>({
    domain: 'Software Engineering',
  });
  const [model, setModel] = useState('gemini-3.8-flash');
  const [modelsList, setModelsList] = useState<ModelInfo[]>(DEFAULT_MODELS);
  const [parameters, setParameters] = useState<ModelParameters>({
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    stopSequences: [],
    thinkingLevel: 'LOW',
    enableSearchGrounding: false,
    responseFormat: 'text',
  });

  // Daily Token Quota (3x Google AI Studio's 1,000,000 token limit)
  const [dailyQuota, setDailyQuota] = useState<DailyTokenQuota>(() => {
    const saved = localStorage.getItem('adinkra_daily_quota');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      dailyLimit: 3_000_000, // 3,000,000 tokens daily (3x Google AI Studio's 1M limit)
      usedToday: 24_850,
      standardAiStudioLimit: 1_000_000,
      multiplier: 3,
      maxPerTurnLimit: 24_576, // 3x 8,192
    };
  });

  const handleResetDailyQuota = () => {
    const reset = {
      dailyLimit: 3_000_000,
      usedToday: 0,
      standardAiStudioLimit: 1_000_000,
      multiplier: 3,
      maxPerTurnLimit: 24_576,
    };
    setDailyQuota(reset);
    try {
      localStorage.setItem('adinkra_daily_quota', JSON.stringify(reset));
    } catch {}
  };

  const handleBurnTokens = (amount: number) => {
    setDailyQuota((prev) => {
      const updated = {
        ...prev,
        usedToday: Math.min(prev.dailyLimit, prev.usedToday + amount),
      };
      try {
        localStorage.setItem('adinkra_daily_quota', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Output & Execution State
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluatingBatch, setIsEvaluatingBatch] = useState(false);
  const [metrics, setMetrics] = useState<ExecutionMetrics | null>(null);
  const [groundingSources, setGroundingSources] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Collaboration & History State
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [comments, setComments] = useState<WorkspaceComment[]>([]);
  const [collaborators, setCollaborators] = useState<Author[]>(INITIAL_COLLABORATORS);

  // Modals & Drawers
  const [showGetCode, setShowGetCode] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showPhilosophyModal, setShowPhilosophyModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOptimizerModal, setShowOptimizerModal] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);

  // Load models & workspace history on mount
  useEffect(() => {
    api.getModels()
      .then((m) => {
        if (m && m.length > 0) setModelsList(m);
      })
      .catch((err) => console.error('Failed to load models:', err));

    api.getWorkspaceHistory()
      .then((data) => {
        if (data.versions) setVersions(data.versions);
        if (data.comments) setComments(data.comments);
      })
      .catch((err) => console.error('Failed to load history:', err));
  }, []);

  // Periodic subtle collaborator status updates for authentic real-time feel
  useEffect(() => {
    const interval = setInterval(() => {
      setCollaborators((prev) =>
        prev.map((c) => {
          if (c.name === 'Kwame Mensah') {
            const actions = ['Tuning Thinking Config', 'Testing JSON output', 'Active in Playground'];
            const nextAction = actions[Math.floor(Math.random() * actions.length)];
            return { ...c, currentAction: nextAction };
          }
          return c;
        })
      );
    }, 14000);
    return () => clearInterval(interval);
  }, []);

  // Current prompt state package
  const currentPromptState: PromptState = {
    title,
    systemInstruction,
    mode: promptMode,
    userPrompt,
    turns,
    testCases,
    variables,
    model,
    parameters,
  };

  // Run Prompt Action
  const handleRun = useCallback(async (overrideTurns?: ChatTurn[]) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setOutput('');
    setGroundingSources([]);

    try {
      const activeTurns = overrideTurns || turns;

      // Interpolate {{variables}} into prompt text
      let finalPrompt = userPrompt;
      for (const [key, val] of Object.entries(variables)) {
        if (val) {
          finalPrompt = finalPrompt.replaceAll(`{{${key}}}`, val);
        }
      }

      // If in Chat mode, package chat turns
      let contentsPayload: any = finalPrompt;
      if (promptMode === 'chat' && activeTurns.length > 0) {
        contentsPayload = activeTurns.map((t) => ({
          role: t.role,
          parts: [{ text: t.content }],
        }));
      }

      const res = await api.generate(
        {
          model,
          systemInstruction,
          prompt: finalPrompt,
          contents: contentsPayload,
          parameters,
          stream: true,
        },
        (chunkText) => {
          setOutput(chunkText);
        }
      );

      setOutput(res.text);

      // If in chat mode, append model turn to chat conversation history
      if (promptMode === 'chat' && res.text) {
        setTurns((prev) => [
          ...prev,
          {
            id: `turn-model-${Date.now()}`,
            role: 'model',
            content: res.text,
          },
        ]);
      }

      const estimatedCost = (res.usage.totalTokens / 1_000_000) * 0.15;
      setMetrics({
        latencyMs: res.latencyMs,
        inputTokens: res.usage.inputTokens,
        outputTokens: res.usage.outputTokens,
        totalTokens: res.usage.totalTokens,
        estimatedCost,
      });

      // Increment daily token usage against the 3,000,000 daily quota
      setDailyQuota((prev) => {
        const updated = {
          ...prev,
          usedToday: prev.usedToday + res.usage.totalTokens,
        };
        try {
          localStorage.setItem('adinkra_daily_quota', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (res.groundingMetadata?.groundingChunks) {
        const sources = res.groundingMetadata.groundingChunks
          .map((c: any) => c.web)
          .filter(Boolean);
        setGroundingSources(sources);
      }
    } catch (err: any) {
      console.error('Run failed:', err);
      setError(err.message || 'Execution failed. Please check Gemini API key and parameters.');
    } finally {
      setIsGenerating(false);
    }
  }, [
    isGenerating,
    userPrompt,
    variables,
    promptMode,
    turns,
    model,
    systemInstruction,
    parameters,
  ]);

  const handleSendChatMessage = (messageText: string) => {
    if (!messageText.trim() || isGenerating) return;
    const newTurn: ChatTurn = {
      id: `turn-user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
    };
    const updated = [...turns, newTurn];
    setTurns(updated);
    handleRun(updated);
  };

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to run prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  // Run single test case
  const handleRunTestCase = async (tc: TestCase) => {
    setTestCases((prev) =>
      prev.map((item) => (item.id === tc.id ? { ...item, running: true } : item))
    );

    try {
      const res = await api.generate({
        model,
        systemInstruction,
        prompt: tc.input,
        parameters,
      });

      const passed = tc.expectedOutput
        ? res.text.toLowerCase().includes(tc.expectedOutput.toLowerCase().trim())
        : true;

      setTestCases((prev) =>
        prev.map((item) =>
          item.id === tc.id
            ? {
                ...item,
                actualOutput: res.text,
                passed,
                latencyMs: res.latencyMs,
                running: false,
              }
            : item
        )
      );
    } catch (err: any) {
      setTestCases((prev) =>
        prev.map((item) =>
          item.id === tc.id
            ? {
                ...item,
                actualOutput: `Error: ${err.message}`,
                passed: false,
                running: false,
              }
            : item
        )
      );
    }
  };

  // Run all test cases in matrix
  const handleRunAllTestCases = async () => {
    setIsEvaluatingBatch(true);
    for (const tc of testCases) {
      await handleRunTestCase(tc);
    }
    setIsEvaluatingBatch(false);
  };

  // Commit Snapshot to Sankofa Version History
  const handleCommitSnapshot = async (commitMessage: string, tag?: string) => {
    try {
      const newVersion = await api.commitVersion({
        commitMessage,
        branch: currentBranch,
        tag: tag || 'Draft',
        promptData: currentPromptState,
        metrics: metrics || undefined,
      });

      setVersions((prev) => [newVersion, ...prev]);
    } catch (err: any) {
      console.error('Failed to commit version:', err);
    }
  };

  // Restore historical snapshot to active editor
  const handleRestoreVersion = (version: VersionSnapshot) => {
    const data = version.promptData;
    setTitle(data.title);
    setSystemInstruction(data.systemInstruction);
    setPromptMode(data.mode);
    setUserPrompt(data.userPrompt);
    if (data.turns) setTurns(data.turns);
    if (data.testCases) setTestCases(data.testCases);
    if (data.variables) setVariables(data.variables);
    setModel(data.model);
    setParameters(data.parameters);
    setMode('playground');
  };

  // Fork historical snapshot into a new branch
  const handleForkBranch = (version: VersionSnapshot, branchName: string) => {
    if (!branches.includes(branchName)) {
      setBranches((prev) => [...prev, branchName]);
    }
    setCurrentBranch(branchName);
    handleRestoreVersion(version);
  };

  // Add collaborative comment
  const handleAddComment = async (
    text: string,
    target: 'system' | 'prompt' | 'config' | 'general'
  ) => {
    try {
      const comment = await api.addComment({
        text,
        target,
      });
      setComments((prev) => [comment, ...prev]);
    } catch (err: any) {
      console.error('Failed to post comment:', err);
    }
  };

  // Toggle resolve comment
  const handleToggleResolveComment = async (id: string) => {
    try {
      const updated = await api.toggleResolveComment(id);
      setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err: any) {
      console.error('Failed to toggle comment:', err);
    }
  };

  // Import workspace bundle
  const handleImportWorkspace = (imported: any) => {
    if (imported.promptState) {
      const p = imported.promptState;
      setTitle(p.title || title);
      setSystemInstruction(p.systemInstruction || '');
      setUserPrompt(p.userPrompt || '');
      if (p.mode) setPromptMode(p.mode);
      if (p.turns) setTurns(p.turns);
      if (p.testCases) setTestCases(p.testCases);
      if (p.variables) setVariables(p.variables);
      if (p.model) setModel(p.model);
      if (p.parameters) setParameters(p.parameters);
    }
    if (imported.versions) setVersions(imported.versions);
    if (imported.comments) setComments(imported.comments);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c0e14] text-slate-100 font-sans">
      {/* Studio Header */}
      <Header
        mode={mode}
        setMode={setMode}
        title={title}
        setTitle={setTitle}
        currentBranch={currentBranch}
        branches={branches}
        setBranch={setCurrentBranch}
        onCreateBranch={(b) => {
          setBranches((prev) => [...prev, b]);
          setCurrentBranch(b);
        }}
        collaborators={collaborators}
        commentsCount={comments.filter((c) => !c.resolved).length}
        onToggleComments={() => setShowCommentsDrawer(!showCommentsDrawer)}
        onOpenGetCode={() => setShowGetCode(true)}
        onOpenCommitModal={() => setShowCommitModal(true)}
        onOpenPhilosophyModal={() => setShowPhilosophyModal(true)}
        onOpenShareModal={() => setShowShareModal(true)}
        onRun={handleRun}
        isRunning={isGenerating}
        versionCount={versions.length}
        dailyQuota={dailyQuota}
        onResetDailyQuota={handleResetDailyQuota}
        onBurnTokens={handleBurnTokens}
      />

      {/* Main Workspace Body based on Mode */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {mode === 'playground' && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Left & Middle Column: System Instructions + Prompt Editor + Output */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* System Instructions Pane */}
              <SystemInstructionsPane
                systemInstruction={systemInstruction}
                setSystemInstruction={setSystemInstruction}
                onOpenCommentForSystem={() => {
                  setShowCommentsDrawer(true);
                }}
                commentCount={comments.filter((c) => c.target === 'system' && !c.resolved).length}
              />

              {/* Split Editor and Output View */}
              <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                <PromptEditor
                  mode={promptMode}
                  setMode={setPromptMode}
                  userPrompt={userPrompt}
                  setUserPrompt={setUserPrompt}
                  turns={turns}
                  setTurns={setTurns}
                  testCases={testCases}
                  setTestCases={setTestCases}
                  variables={variables}
                  setVariables={setVariables}
                  onRunTestCase={handleRunTestCase}
                  onRunAllTestCases={handleRunAllTestCases}
                  isEvaluatingBatch={isEvaluatingBatch}
                  onRun={handleRun}
                  isGenerating={isGenerating}
                  onSendChatMessage={handleSendChatMessage}
                />

                <OutputView
                  output={output}
                  isGenerating={isGenerating}
                  metrics={metrics}
                  groundingSources={groundingSources}
                  error={error}
                  onClearOutput={() => setOutput('')}
                />
              </div>
            </div>

            {/* Right Column: Model Parameters Configuration Panel */}
            <ModelConfigPanel
              model={model}
              setModel={setModel}
              modelsList={modelsList}
              parameters={parameters}
              setParameters={setParameters}
              onOpenCommentForConfig={() => setShowCommentsDrawer(true)}
              commentCount={comments.filter((c) => c.target === 'config' && !c.resolved).length}
            />
          </div>
        )}

        {/* SANKOFA VERSION HISTORY MODE */}
        {mode === 'sankofa' && (
          <SankofaVersionHistory
            versions={versions}
            currentPromptState={currentPromptState}
            onRestoreVersion={handleRestoreVersion}
            onForkBranch={handleForkBranch}
            onOpenCommitModal={() => setShowCommitModal(true)}
            onTestVersion={(v) => {
              handleRestoreVersion(v);
              setTimeout(() => handleRun(), 100);
            }}
          />
        )}

        {/* DAME-DAME MULTI-MODEL ARENA */}
        {mode === 'compare' && (
          <ModelCompareArena
            promptState={currentPromptState}
            modelsList={modelsList}
          />
        )}

        {/* NYANSAPO PROMPT CO-PILOT INLINE MODE */}
        {mode === 'optimizer' && (
          <div className="flex-1 flex items-center justify-center p-6 bg-[#0c0e14]">
            <div className="w-full max-w-2xl bg-[#101422] border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <span className="font-bold text-lg">✦</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Nyansapo Prompt Intelligence Engine
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Refine prompt structure, synthesize few-shot exemplars, generate comprehensive test cases, or audit security and token efficiency.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowOptimizerModal(true)}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-lg text-xs shadow-md transition-all active:scale-95"
                >
                  Open Co-Pilot Suite
                </button>
                <button
                  onClick={() => setMode('playground')}
                  className="px-4 py-2 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium hover:text-white"
                >
                  Return to Playground
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Modals & Drawers */}
      <GetCodeModal
        isOpen={showGetCode}
        onClose={() => setShowGetCode(false)}
        promptState={currentPromptState}
      />

      <CommitModal
        isOpen={showCommitModal}
        onClose={() => setShowCommitModal(false)}
        branch={currentBranch}
        onCommit={handleCommitSnapshot}
      />

      <AdinkraPhilosophyModal
        isOpen={showPhilosophyModal}
        onClose={() => setShowPhilosophyModal(false)}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        promptState={currentPromptState}
        versions={versions}
        comments={comments}
        onImportWorkspace={handleImportWorkspace}
      />

      <PromptOptimizerModal
        isOpen={showOptimizerModal}
        onClose={() => setShowOptimizerModal(false)}
        currentPrompt={userPrompt}
        currentSystemInstruction={systemInstruction}
        onApplyOptimized={(optPrompt, optSystem) => {
          setUserPrompt(optPrompt);
          if (optSystem) setSystemInstruction(optSystem);
        }}
        onAddTestCases={(newCases) => {
          setTestCases((prev) => [...prev, ...newCases]);
          setPromptMode('structured');
          setMode('playground');
        }}
      />

      <CommentsDrawer
        isOpen={showCommentsDrawer}
        onClose={() => setShowCommentsDrawer(false)}
        comments={comments}
        onAddComment={handleAddComment}
        onToggleResolve={handleToggleResolveComment}
        collaborators={collaborators}
      />
    </div>
  );
}
