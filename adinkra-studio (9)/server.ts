import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory workspace state for real-time collaboration & Sankofa version history
interface VersionSnapshot {
  id: string;
  versionNumber: number;
  timestamp: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    email?: string;
  };
  commitMessage: string;
  branch: string;
  tag?: 'Production' | 'Staging' | 'Draft' | 'Experiment' | 'Golden';
  promptData: {
    title: string;
    systemInstruction: string;
    mode: 'freeform' | 'chat' | 'structured';
    userPrompt: string;
    turns?: Array<{ role: 'user' | 'model'; content: string; id: string }>;
    testCases?: Array<{ id: string; input: string; expectedOutput?: string; actualOutput?: string; passed?: boolean }>;
    variables?: Record<string, string>;
    model: string;
    parameters: {
      temperature: number;
      topP: number;
      topK: number;
      maxOutputTokens: number;
      stopSequences: string[];
      thinkingLevel?: 'LOW' | 'HIGH' | 'MINIMAL';
      enableSearchGrounding: boolean;
      responseFormat: 'text' | 'json';
      responseSchema?: string;
    };
  };
  metrics?: {
    latencyMs?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
}

interface WorkspaceComment {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  text: string;
  timestamp: string;
  target: 'system' | 'prompt' | 'config' | 'general';
  resolved?: boolean;
}

// Initial seed version
const versionHistory: VersionSnapshot[] = [
  {
    id: 'sankofa-v1',
    versionNumber: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    author: {
      name: 'Violet Akuagyei',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      role: 'Prompt Architect',
      email: 'violetakuagyei@gmail.com',
    },
    commitMessage: 'Initial prompt architecture with Adinkra wisdom guidelines',
    branch: 'main',
    tag: 'Golden',
    promptData: {
      title: 'Multimodal Cultural Synthesis & Analysis Agent',
      systemInstruction: 'You are an insightful cultural analyst and senior research assistant grounded in the philosophical traditions of West African Adinkra symbolism and modern cognitive science. Provide analytical, structured, and culturally nuanced answers. Maintain scholarly rigor, concise prose, and highlight systemic connections.',
      mode: 'freeform',
      userPrompt: 'Analyze the significance of the "Sankofa" (looking back to fetch the past) and "Nyansapo" (knot of wisdom) concepts in modern AI engineering and iterative prompt version control. Present your analysis in 3 structured sections: 1. Philosophical Grounding, 2. Architectural Analog, 3. Practical Heuristics for Engineers.',
      model: 'gemini-3.8-flash',
      variables: {},
      parameters: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
        stopSequences: [],
        thinkingLevel: 'LOW',
        enableSearchGrounding: false,
        responseFormat: 'text',
      },
    },
    metrics: {
      latencyMs: 840,
      inputTokens: 112,
      outputTokens: 498,
    },
  },
];

const workspaceComments: WorkspaceComment[] = [
  {
    id: 'comm-1',
    author: {
      name: 'Kwame Mensah',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      role: 'Staff ML Engineer',
    },
    text: 'Consider locking temperature to 0.4 when requesting structured analytical schemas to reduce hallucination drift.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    target: 'config',
    resolved: false,
  },
  {
    id: 'comm-2',
    author: {
      name: 'Amara Okafor',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces',
      role: 'Eval Specialist',
    },
    text: 'The Sankofa diff engine works great! Tested rolling back between v1 and experiment branches without losing variables.',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    target: 'general',
    resolved: true,
  },
];

// Available models list
app.get('/api/models', (_req: Request, res: Response) => {
  res.json({
    models: [
      {
        id: 'gemini-3.8-flash',
        name: 'Gemini 3.8 Flash',
        adinkraSymbol: 'Nyansapo',
        symbolMeaning: 'Wisdom Knot (Highest general intelligence & velocity)',
        contextWindow: '1M tokens',
        pricingTier: 'Standard',
        features: ['Multimodal', 'Extended Reasoning', 'Search Grounding', 'Structured JSON'],
        isDefault: true,
      },
      {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash Lite',
        adinkraSymbol: 'Dono',
        symbolMeaning: 'Talking Drum (Instant speed, cost-optimized for high throughput)',
        contextWindow: '1M tokens',
        pricingTier: 'Ultra-low latency',
        features: ['High Throughput', 'Cost Effective', 'Fast Inference'],
        isDefault: false,
      },
      {
        id: 'gemini-3.1-pro-preview',
        name: 'Gemini 3.1 Pro Preview',
        adinkraSymbol: 'Adinkrahene',
        symbolMeaning: 'Chief of Symbols (Maximum STEM reasoning & code generation)',
        contextWindow: '2M tokens',
        pricingTier: 'Paid Key Required',
        features: ['Complex Reasoning', 'Code Synthesis', 'Deep Analytical Tasks'],
        isDefault: false,
        requiresPaidKey: true,
      },
    ],
  });
});

// Workspace State API
app.get('/api/workspace/history', (_req: Request, res: Response) => {
  res.json({ versions: versionHistory, comments: workspaceComments });
});

app.post('/api/workspace/commit', (req: Request, res: Response) => {
  const { commitMessage, branch, promptData, tag, author, metrics } = req.body;
  if (!commitMessage || !promptData) {
    res.status(400).json({ error: 'Missing commitMessage or promptData' });
    return;
  }

  const newVersion: VersionSnapshot = {
    id: `sankofa-v${versionHistory.length + 1}-${Date.now().toString(36)}`,
    versionNumber: versionHistory.length + 1,
    timestamp: new Date().toISOString(),
    author: author || {
      name: 'Violet Akuagyei',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      role: 'Prompt Architect',
    },
    commitMessage,
    branch: branch || 'main',
    tag: tag || 'Draft',
    promptData,
    metrics,
  };

  versionHistory.unshift(newVersion);
  res.json({ success: true, version: newVersion });
});

app.post('/api/workspace/comment', (req: Request, res: Response) => {
  const { text, target, author } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Comment text required' });
    return;
  }
  const newComment: WorkspaceComment = {
    id: `comm-${Date.now().toString(36)}`,
    author: author || {
      name: 'Violet Akuagyei',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      role: 'Prompt Architect',
    },
    text,
    timestamp: new Date().toISOString(),
    target: target || 'general',
    resolved: false,
  };
  workspaceComments.unshift(newComment);
  res.json({ success: true, comment: newComment });
});

app.post('/api/workspace/comment/resolve', (req: Request, res: Response) => {
  const { id } = req.body;
  const comment = workspaceComments.find((c) => c.id === id);
  if (comment) {
    comment.resolved = !comment.resolved;
  }
  res.json({ success: true, comment });
});

// Helper to parse and humanize Gemini API errors
function formatGeminiError(error: any): string {
  if (!error) return 'An unexpected error occurred during execution.';
  const rawMsg = error.message || String(error);
  try {
    const jsonMatch = rawMsg.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.code === 503 || parsed.error?.status === 'UNAVAILABLE') {
        return 'Gemini model is experiencing temporary high demand upstream. Automatic retry was attempted. Please try sending again in a few moments.';
      }
      if (parsed.error?.code === 429 || parsed.error?.status === 'RESOURCE_EXHAUSTED') {
        return 'Rate limit reached on Gemini API. Please wait a few seconds before re-running.';
      }
      if (parsed.error?.message) {
        return parsed.error.message;
      }
    }
  } catch {}

  if (rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('high demand')) {
    return 'Gemini model is currently experiencing temporary high demand from Google AI Studio. Please retry your prompt in a few seconds.';
  }
  if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
    return 'Rate limit reached on Gemini API. Please wait a moment before sending another prompt.';
  }
  return rawMsg;
}

// Simple circuit breaker for upstream 503 high demand
const last503Timestamp: Record<string, number> = {};

function isModelTemporarilyOverloaded(modelName: string): boolean {
  const lastTime = last503Timestamp[modelName];
  if (!lastTime) return false;
  if (Date.now() - lastTime < 90_000) return true;
  delete last503Timestamp[modelName];
  return false;
}

function markModelOverloaded(modelName: string): void {
  last503Timestamp[modelName] = Date.now();
}

function clearModelOverload(modelName: string): void {
  delete last503Timestamp[modelName];
}

// Prompt Execution Endpoint (Streaming and Unary with resilience & auto-retry)
app.post('/api/generate', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const {
      model = 'gemini-3.8-flash',
      systemInstruction,
      prompt,
      contents,
      parameters = {},
      stream = false,
    } = req.body;

    if (!apiKey) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check your environment variables.',
      });
      return;
    }

    // Build configuration
    const config: Record<string, any> = {};

    if (systemInstruction && systemInstruction.trim()) {
      config.systemInstruction = systemInstruction.trim();
    }

    if (typeof parameters.temperature === 'number') {
      config.temperature = parameters.temperature;
    }

    if (typeof parameters.topP === 'number') {
      config.topP = parameters.topP;
    }

    if (typeof parameters.topK === 'number') {
      config.topK = parameters.topK;
    }

    if (typeof parameters.maxOutputTokens === 'number' && parameters.maxOutputTokens > 0) {
      config.maxOutputTokens = parameters.maxOutputTokens;
    }

    if (Array.isArray(parameters.stopSequences) && parameters.stopSequences.length > 0) {
      config.stopSequences = parameters.stopSequences.filter(Boolean);
    }

    // Thinking configuration for Gemini 3 series
    if (parameters.thinkingLevel) {
      if (parameters.thinkingLevel === 'LOW') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else if (parameters.thinkingLevel === 'HIGH') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else if (parameters.thinkingLevel === 'MINIMAL') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      }
    }

    // Response MIME type & JSON schema if requested
    if (parameters.responseFormat === 'json') {
      config.responseMimeType = 'application/json';
      if (parameters.responseSchema && parameters.responseSchema.trim()) {
        try {
          const parsedSchema = JSON.parse(parameters.responseSchema);
          config.responseSchema = parsedSchema;
        } catch {
          // If schema is not valid JSON, leave responseMimeType as application/json
        }
      }
    }

    // Tools - Google Search Grounding
    if (parameters.enableSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    // Build contents payload
    let contentsPayload: any = prompt;
    if (contents) {
      contentsPayload = contents;
    }

    // Candidate models to attempt:
    // If requested model was recently marked 503 overloaded, prioritize gemini-3.1-flash-lite immediately
    let modelsToTry = [model];
    if (model !== 'gemini-3.1-flash-lite') {
      if (isModelTemporarilyOverloaded(model)) {
        modelsToTry = ['gemini-3.1-flash-lite', model];
      } else {
        modelsToTry.push('gemini-3.1-flash-lite');
      }
    }

    if (stream) {
      let streamSuccess = false;
      let lastStreamError: any = null;
      let activeUsedModel = model;

      for (const currentModel of modelsToTry) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const responseStream = await ai.models.generateContentStream({
              model: currentModel,
              contents: contentsPayload,
              config,
            });

            // Inspect the first chunk BEFORE committing HTTP SSE headers to the client.
            // If the upstream model returns 503 UNAVAILABLE or demand spike, it fails here
            // BEFORE any headers are written, allowing clean and invisible fallback!
            const iterator = responseStream[Symbol.asyncIterator]();
            const firstResult = await iterator.next();

            if (firstResult.done) {
              continue; // Empty stream, try next model
            }

            // Successfully received first chunk! Safely open SSE stream now
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');
              res.flushHeaders?.();
            }

            const firstText = firstResult.value.text || '';
            let fullText = firstText;
            res.write(`data: ${JSON.stringify({ text: firstText, done: false, model: currentModel })}\n\n`);

            // Stream subsequent chunks
            while (true) {
              const { value, done } = await iterator.next();
              if (done) break;
              const text = value.text || '';
              fullText += text;
              res.write(`data: ${JSON.stringify({ text, done: false, model: currentModel })}\n\n`);
            }

            const latencyMs = Date.now() - startTime;
            res.write(
              `data: ${JSON.stringify({
                done: true,
                fullText,
                latencyMs,
                model: currentModel,
              })}\n\n`
            );
            res.end();
            streamSuccess = true;
            activeUsedModel = currentModel;
            clearModelOverload(currentModel);
            break;
          } catch (err: any) {
            lastStreamError = err;
            const errMsg = String(err?.message || '');
            const isTransient =
              errMsg.includes('503') ||
              errMsg.includes('UNAVAILABLE') ||
              errMsg.includes('high demand') ||
              errMsg.includes('429');

            if (isTransient) {
              markModelOverloaded(currentModel);
            }

            // If headers were already sent mid-stream (subsequent chunk failure), report error and abort
            if (res.headersSent) {
              const formattedError = formatGeminiError(err);
              res.write(`data: ${JSON.stringify({ error: formattedError, done: true })}\n\n`);
              res.end();
              return;
            }

            if (isTransient && attempt === 0) {
              await new Promise((r) => setTimeout(r, 600));
              continue;
            }
            // Headers were NOT sent: break to outer loop to seamlessly try fallback model
            console.warn(`Model ${currentModel} stream unavailable, failing over to next model candidate...`);
            break;
          }
        }
        if (streamSuccess) break;
      }

      if (!streamSuccess) {
        const formatted = formatGeminiError(lastStreamError);
        console.error('Streaming failed after all candidate models:', lastStreamError);
        if (!res.headersSent) {
          res.status(500).json({ error: formatted, model: activeUsedModel });
        } else {
          res.write(`data: ${JSON.stringify({ error: formatted, done: true })}\n\n`);
          res.end();
        }
      }
      return;
    }

    // Unary response with auto-retry
    let response: any = null;
    let lastUnaryError: any = null;
    let usedModel = model;

    for (const currentModel of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: currentModel,
            contents: contentsPayload,
            config,
          });
          usedModel = currentModel;
          clearModelOverload(currentModel);
          break;
        } catch (err: any) {
          lastUnaryError = err;
          const errMsg = String(err?.message || '');
          const isTransient =
            errMsg.includes('503') ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('high demand') ||
            errMsg.includes('429');
          if (isTransient) {
            markModelOverloaded(currentModel);
          }
          if (isTransient && attempt === 0) {
            await new Promise((r) => setTimeout(r, 700));
            continue;
          }
          break;
        }
      }
      if (response) break;
    }

    if (!response) {
      throw lastUnaryError || new Error('Failed to generate response from model.');
    }

    const latencyMs = Date.now() - startTime;
    const text = response.text || '';

    // Estimate token counts or extract usage metadata if present
    const usageMetadata = response.usageMetadata || {};
    const inputTokens = usageMetadata.promptTokenCount || Math.ceil((prompt?.length || 50) / 4);
    const outputTokens = usageMetadata.candidatesTokenCount || Math.ceil(text.length / 4);

    res.json({
      text,
      latencyMs,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      model: usedModel,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata || null,
    });
  } catch (error: any) {
    console.error('Gemini generateContent error:', error);
    const humanError = formatGeminiError(error);
    if (!res.headersSent) {
      res.status(500).json({
        error: humanError,
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: humanError, done: true })}\n\n`);
      res.end();
    }
  }
});

// Prompt Optimization & Co-pilot Endpoint (Nyansapo)
app.post('/api/optimize-prompt', async (req: Request, res: Response) => {
  try {
    const { action, prompt, systemInstruction } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt content is required' });
      return;
    }

    let instructionMeta = '';
    if (action === 'refine') {
      instructionMeta = `You are the Adinkra Studio Prompt Engineer (Nyansapo intelligence). 
Analyze the user's prompt and current system instructions.
Rewrite and optimize the prompt to be maximally clear, structured, unambiguous, and effective for large language models.
Provide:
1. "optimizedPrompt": The improved ready-to-run prompt.
2. "suggestedSystemInstruction": An ideal system instruction to pair with it.
3. "improvements": An array of bullet points explaining what was enhanced (e.g. constraints added, role anchoring, formatting rules).
4. "suggestedParameters": Recommended temperature, topP, and thinking level.
Return your answer strictly in valid JSON format matching this structure:
{
  "optimizedPrompt": "...",
  "suggestedSystemInstruction": "...",
  "improvements": ["...", "..."],
  "suggestedParameters": { "temperature": 0.5, "topP": 0.9, "thinkingLevel": "LOW" }
}`;
    } else if (action === 'few-shot') {
      instructionMeta = `You are the Adinkra Studio Prompt Engineer.
Analyze the user prompt. Generate 3 high-quality few-shot exemplar input/output pairs that teach the model desired tone, structure, and edge-case handling.
Return your answer strictly in valid JSON format matching this structure:
{
  "exemplars": [
    { "input": "...", "output": "...", "rationale": "..." },
    { "input": "...", "output": "...", "rationale": "..." },
    { "input": "...", "output": "...", "rationale": "..." }
  ]
}`;
    } else if (action === 'test-suite') {
      instructionMeta = `You are the Adinkra Studio Evaluation Specialist.
Analyze the user prompt and generate 4 diverse test cases to stress-test prompt engineering resilience:
1. Happy path (typical user query)
2. Complex multi-part query
3. Boundary / edge case or ambiguous input
4. Adversarial or constraint-testing case
Return your answer strictly in valid JSON format matching this structure:
{
  "testCases": [
    { "id": "tc-1", "category": "Happy Path", "input": "...", "evaluationCriteria": "..." },
    { "id": "tc-2", "category": "Complex Multi-part", "input": "...", "evaluationCriteria": "..." },
    { "id": "tc-3", "category": "Edge Case", "input": "...", "evaluationCriteria": "..." },
    { "id": "tc-4", "category": "Adversarial / Constraint", "input": "...", "evaluationCriteria": "..." }
  ]
}`;
    } else if (action === 'audit') {
      instructionMeta = `You are the Adinkra Studio Security and Robustness Auditor.
Audit the provided prompt and system instructions for:
1. Ambiguities or potential for hallucination
2. Vulnerability to prompt injection or jailbreaking
3. Missing negative constraints or format boundary traps
4. Token efficiency and redundancy
Return your answer strictly in valid JSON format matching this structure:
{
  "score": 88,
  "riskLevel": "Low | Medium | High",
  "findings": [
    { "severity": "Medium | Low | Info", "title": "...", "description": "...", "recommendation": "..." }
  ],
  "tokenEfficiencyTips": ["..."]
}`;
    }

    const optModelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let aiRes: any = null;
    let lastOptError: any = null;

    for (const optModel of optModelsToTry) {
      try {
        aiRes = await ai.models.generateContent({
          model: optModel,
          contents: `System Instruction Context: ${systemInstruction || 'None provided'}\n\nPrompt to evaluate/optimize:\n${prompt}`,
          config: {
            systemInstruction: instructionMeta,
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
        if (aiRes) break;
      } catch (err: any) {
        lastOptError = err;
        console.warn(`Optimize prompt with ${optModel} failed, trying fallback:`, err?.message || err);
      }
    }

    if (!aiRes) {
      throw lastOptError || new Error('Optimization unavailable');
    }

    const parsed = JSON.parse(aiRes.text || '{}');
    res.json({ success: true, result: parsed });
  } catch (error: any) {
    console.error('Optimization error:', error);
    res.status(500).json({ error: error.message || 'Failed to optimize prompt' });
  }
});

// Vite or Static files handling
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Adinkra Studio server online at http://0.0.0.0:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error('Server initialization failed:', err);
  process.exit(1);
});
