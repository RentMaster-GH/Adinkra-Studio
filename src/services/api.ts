import { 
  VersionSnapshot, 
  WorkspaceComment, 
  ModelInfo, 
  TestCase,
  CacheConfig,
  GuardrailsConfig,
  GuardrailViolation,
  CacheStats
} from '../types';

export interface GenerateRequestPayload {
  model: string;
  systemInstruction?: string;
  prompt?: string;
  contents?: any;
  parameters: {
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
    stopSequences: string[];
    thinkingLevel: 'LOW' | 'HIGH' | 'MINIMAL';
    enableSearchGrounding: boolean;
    responseFormat: 'text' | 'json';
    responseSchema?: string;
    cacheConfig?: CacheConfig;
    guardrailsConfig?: GuardrailsConfig;
  };
  stream?: boolean;
}

export interface GenerateResponseData {
  text: string;
  latencyMs: number;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  groundingMetadata?: any;
  cacheHit?: boolean;
  cacheType?: 'exact' | 'semantic' | 'none';
  similarityScore?: number;
  savedLatencyMs?: number;
  savedCost?: number;
  guardrailStatus?: 'passed' | 'warned' | 'blocked' | 'repaired';
  guardrailViolations?: GuardrailViolation[];
}

function sanitizeErrorMessage(rawText: string, status?: number): string {
  if (!rawText) {
    if (status) return `Server error (${status}): Upstream service temporarily unavailable. Please retry.`;
    return 'An unexpected network error occurred. Please try again.';
  }

  // Handle Cloud Run / Google Front End proxy 404 / 502 / 503 "The page could not be found NOT_FOUND cpt1::..."
  if (
    rawText.includes('NOT_FOUND cpt1::') ||
    rawText.includes('cpt1::') ||
    rawText.toLowerCase().includes('the page could not be found')
  ) {
    return 'The development server was momentarily cycling during an environment update. It has reconnected — please click "Retry Prompt" or send your prompt again.';
  }

  if (rawText.toLowerCase().includes('failed to fetch') || rawText.toLowerCase().includes('networkerror')) {
    return 'Network connection briefly interrupted. The server is online — please click "Retry Prompt".';
  }

  if (
    rawText.includes('503') ||
    rawText.toLowerCase().includes('high demand') ||
    rawText.toLowerCase().includes('unavailable')
  ) {
    return 'The Gemini model is experiencing a momentary demand spike. The studio will automatically route your request to a high-throughput fallback or click "Retry Prompt".';
  }

  return rawText;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxAttempts = 5
): Promise<Response> {
  const delays = [800, 1500, 2500, 3500, 4500];
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      const response = await fetch(url, options);
      // Statuses that indicate container starting or transient proxy errors (e.g. 404 from GFE ingress before container binds)
      const isTransientStatus =
        response.status === 404 ||
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504;

      if (isTransientStatus && attempt < maxAttempts) {
        const textPreview = await response.clone().text().catch(() => '');
        const isGFEError =
          textPreview.includes('NOT_FOUND cpt1::') ||
          textPreview.includes('cpt1::') ||
          textPreview.toLowerCase().includes('the page could not be found') ||
          response.status >= 500;

        if (isGFEError || response.status >= 500) {
          await new Promise((r) => setTimeout(r, delays[attempt - 1] || 1500));
          continue;
        }
      }
      return response;
    } catch (networkErr: any) {
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delays[attempt - 1] || 1500));
        continue;
      }
      throw networkErr;
    }
  }
  return fetch(url, options);
}

export const api = {
  async getModels(): Promise<ModelInfo[]> {
    const res = await fetch('/api/models');
    if (!res.ok) throw new Error('Failed to fetch models');
    const data = await res.json();
    return data.models;
  },

  async getWorkspaceHistory(): Promise<{ versions: VersionSnapshot[]; comments: WorkspaceComment[] }> {
    const res = await fetch('/api/workspace/history');
    if (!res.ok) throw new Error('Failed to fetch workspace history');
    return res.json();
  },

  async commitVersion(payload: {
    commitMessage: string;
    branch: string;
    tag?: string;
    promptData: any;
    author?: any;
    metrics?: any;
  }): Promise<VersionSnapshot> {
    const res = await fetch('/api/workspace/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save snapshot');
    }
    const data = await res.json();
    return data.version;
  },

  async addComment(payload: {
    text: string;
    target: 'system' | 'prompt' | 'config' | 'general';
    author?: any;
  }): Promise<WorkspaceComment> {
    const res = await fetch('/api/workspace/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    const data = await res.json();
    return data.comment;
  },

  async toggleResolveComment(id: string): Promise<WorkspaceComment> {
    const res = await fetch('/api/workspace/comment/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error('Failed to update comment');
    const data = await res.json();
    return data.comment;
  },

  async generate(
    payload: GenerateRequestPayload,
    onChunk?: (chunk: string) => void
  ): Promise<GenerateResponseData> {
    if (payload.stream && onChunk) {
      const startTime = Date.now();
      const response = await fetchWithRetry('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, stream: true }),
      });

      if (!response.ok) {
        let errorMsg = '';
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMsg = errorData.error;
          } else {
            const rawText = await response.text();
            try {
              const parsed = JSON.parse(rawText);
              errorMsg = parsed.error || rawText;
            } catch {
              errorMsg = rawText;
            }
          }
        } catch {}

        throw new Error(sanitizeErrorMessage(errorMsg, response.status));
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let streamError: string | null = null;
      let usedModel = payload.model;
      let streamLatencyMs = 0;
      let streamCacheHit = false;
      let streamCacheType: 'exact' | 'semantic' | 'none' = 'none';
      let streamSimilarityScore = 0;
      let streamSavedLatencyMs = 0;
      let streamSavedCost = 0;
      let streamGuardrailStatus: 'passed' | 'warned' | 'blocked' | 'repaired' = 'passed';
      let streamGuardrailViolations: GuardrailViolation[] = [];

      if (!reader) throw new Error('Response body stream is not available');

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              if (data.error) {
                streamError = data.error;
              }
              if (data.model) {
                usedModel = data.model;
              }
              if (data.text) {
                fullText += data.text;
                onChunk(fullText);
              }
              if (data.done) {
                fullText = data.fullText || fullText;
                if (typeof data.latencyMs === 'number') streamLatencyMs = data.latencyMs;
                if (data.cacheHit) streamCacheHit = true;
                if (data.cacheType) streamCacheType = data.cacheType;
                if (typeof data.similarityScore === 'number') streamSimilarityScore = data.similarityScore;
                if (typeof data.savedLatencyMs === 'number') streamSavedLatencyMs = data.savedLatencyMs;
                if (typeof data.savedCost === 'number') streamSavedCost = data.savedCost;
                if (data.guardrailStatus) streamGuardrailStatus = data.guardrailStatus;
                if (Array.isArray(data.guardrailViolations)) streamGuardrailViolations = data.guardrailViolations;
              }
            } catch {
              // ignore parse errors on partial stream lines
            }
          }
        }
      }

      if (streamError && !fullText) {
        throw new Error(sanitizeErrorMessage(streamError));
      }

      const latencyMs = streamLatencyMs || (Date.now() - startTime);
      const inputTokens = Math.ceil((payload.prompt?.length || 50) / 4);
      const outputTokens = Math.ceil(fullText.length / 4);

      return {
        text: fullText,
        latencyMs,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
        model: usedModel,
        cacheHit: streamCacheHit,
        cacheType: streamCacheType,
        similarityScore: streamSimilarityScore,
        savedLatencyMs: streamSavedLatencyMs,
        savedCost: streamSavedCost,
        guardrailStatus: streamGuardrailStatus,
        guardrailViolations: streamGuardrailViolations,
      };
    } else {
      const res = await fetchWithRetry('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, stream: false }),
      });

      if (!res.ok) {
        let errMessage = '';
        try {
          const err = await res.json();
          errMessage = err.error;
        } catch {
          const txt = await res.text().catch(() => '');
          errMessage = txt;
        }
        throw new Error(sanitizeErrorMessage(errMessage, res.status));
      }

      return res.json();
    }
  },

  async optimize(payload: {
    action: 'refine' | 'few-shot' | 'test-suite' | 'audit';
    prompt: string;
    systemInstruction?: string;
  }): Promise<any> {
    const res = await fetchWithRetry('/api/optimize-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(sanitizeErrorMessage(err.error, res.status));
    }
    const data = await res.json();
    return data.result;
  },

  async getCacheStats(): Promise<CacheStats> {
    const res = await fetch('/api/cache/stats');
    if (!res.ok) throw new Error('Failed to fetch cache stats');
    return res.json();
  },

  async clearCache(): Promise<void> {
    const res = await fetch('/api/cache/clear', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear cache');
  },

  async deleteCacheEntry(id: string): Promise<boolean> {
    const res = await fetch(`/api/cache/entry/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) return false;
    const data = await res.json();
    return data.success;
  },

  async testGuardrails(payload: {
    prompt?: string;
    systemInstruction?: string;
    responseOutput?: string;
    format?: 'text' | 'json';
    schema?: string;
    config?: Partial<GuardrailsConfig>;
  }): Promise<any> {
    const res = await fetch('/api/guardrails/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to test guardrails');
    return res.json();
  },
};
