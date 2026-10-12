import { VersionSnapshot, WorkspaceComment, ModelInfo, TestCase } from '../types';

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
      const response = await fetch('/api/generate', {
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

        throw new Error(
          errorMsg ||
            `Server error (${response.status}): The Gemini model may be experiencing temporary high demand upstream. Please try again.`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let streamError: string | null = null;
      let usedModel = payload.model;

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
              }
            } catch {
              // ignore parse errors on partial stream lines
            }
          }
        }
      }

      if (streamError && !fullText) {
        throw new Error(streamError);
      }

      const latencyMs = Date.now() - startTime;
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
      };
    } else {
      const res = await fetch('/api/generate', {
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
        throw new Error(errMessage || 'Generation failed. Please try again.');
      }

      return res.json();
    }
  },

  async optimize(payload: {
    action: 'refine' | 'few-shot' | 'test-suite' | 'audit';
    prompt: string;
    systemInstruction?: string;
  }): Promise<any> {
    const res = await fetch('/api/optimize-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Optimization request failed');
    }
    const data = await res.json();
    return data.result;
  },
};
