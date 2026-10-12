export type StudioMode = 'playground' | 'sankofa' | 'compare' | 'optimizer';
export type PromptMode = 'freeform' | 'chat' | 'structured';
export type ThinkingLevelType = 'LOW' | 'HIGH' | 'MINIMAL';

export interface ModelInfo {
  id: string;
  name: string;
  adinkraSymbol: string;
  symbolMeaning: string;
  contextWindow: string;
  pricingTier: string;
  features: string[];
  isDefault?: boolean;
  requiresPaidKey?: boolean;
}

export interface ModelParameters {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  stopSequences: string[];
  thinkingLevel: ThinkingLevelType;
  enableSearchGrounding: boolean;
  responseFormat: 'text' | 'json';
  responseSchema?: string;
}

export interface ChatTurn {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export interface TestCase {
  id: string;
  category?: string;
  input: string;
  expectedOutput?: string;
  actualOutput?: string;
  passed?: boolean;
  latencyMs?: number;
  running?: boolean;
}

export interface PromptState {
  title: string;
  systemInstruction: string;
  mode: PromptMode;
  userPrompt: string;
  turns: ChatTurn[];
  testCases: TestCase[];
  variables: Record<string, string>;
  model: string;
  parameters: ModelParameters;
}

export interface Author {
  name: string;
  avatar: string;
  role: string;
  email?: string;
  status?: 'active' | 'idle' | 'editing';
  currentAction?: string;
}

export interface VersionSnapshot {
  id: string;
  versionNumber: number;
  timestamp: string;
  author: Author;
  commitMessage: string;
  branch: string;
  tag?: 'Production' | 'Staging' | 'Draft' | 'Experiment' | 'Golden';
  promptData: PromptState;
  metrics?: {
    latencyMs?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface WorkspaceComment {
  id: string;
  author: Author;
  text: string;
  timestamp: string;
  target: 'system' | 'prompt' | 'config' | 'general';
  resolved?: boolean;
}

export interface ExecutionMetrics {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface DailyTokenQuota {
  dailyLimit: number; // 3,000,000 tokens (3x Google AI Studio's 1,000,000)
  usedToday: number;
  standardAiStudioLimit: number; // 1,000,000
  multiplier: number; // 3x
  maxPerTurnLimit: number; // 24,576 (3x 8,192)
}
