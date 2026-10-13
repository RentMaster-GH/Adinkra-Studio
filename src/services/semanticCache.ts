import { CacheEntry, CacheStats } from '../types';

export interface CachedResponse {
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

export interface CacheMatchResult {
  hit: boolean;
  type: 'exact' | 'semantic' | 'none';
  similarityScore: number;
  entry?: CacheEntry;
  cachedResponse?: CachedResponse;
  savedLatencyMs?: number;
  savedCost?: number;
}

// In-memory record holding cached prompt and response
interface StoredCacheItem {
  id: string;
  exactKey: string;
  normalizedText: string;
  originalPrompt: string;
  systemInstructionSnippet?: string;
  model: string;
  parametersHash: string;
  response: CachedResponse;
  createdAt: number;
  lastAccessed: number;
  hitCount: number;
}

export class SemanticPromptCache {
  private items: Map<string, StoredCacheItem> = new Map();
  private maxEntries: number = 250;
  private totalHits: number = 0;
  private totalMisses: number = 0;
  private totalSavedLatencyMs: number = 0;
  private totalSavedTokens: number = 0;

  constructor() {
    this.seedDefaults();
  }

  // Pre-seed known common queries for instant demonstration
  private seedDefaults() {
    const defaultSeeds = [
      {
        prompt: 'hello',
        systemInstruction: '',
        model: 'gemini-3.8-flash',
        response: {
          text: 'Akwaaba! Greetings from Adinkra Studio. How can I assist your prompt engineering workflow today?',
          latencyMs: 820,
          usage: { inputTokens: 4, outputTokens: 21, totalTokens: 25 },
          model: 'gemini-3.8-flash',
        },
      },
      {
        prompt: 'Analyze the significance of the "Sankofa" and "Nyansapo" concepts in modern AI engineering',
        systemInstruction: 'You are an insightful cultural analyst and senior research assistant.',
        model: 'gemini-3.8-flash',
        response: {
          text: `### 1. Philosophical Grounding: Sankofa & Nyansapo in AI Engineering

**Sankofa** ("Go back and fetch it") teaches that retrieving ancestral knowledge and past iterations is essential for forward progression. In modern AI systems, this mirrors stateful lineage tracking, prompt checkpointing, and regression testing.

**Nyansapo** ("The Wisdom Knot") symbolizes high-order problem solving and synthesis—the ability to untangle complex, multi-variable constraints through deliberate architectural design rather than brute-force computation.

### 2. Architectural Analog
* **Sankofa**: Immutable prompt version history, semantic rollback caches, and golden dataset evals.
* **Nyansapo**: Guardrails, structured schema enforcement, and cognitive thinking budgets.

### 3. Practical Heuristics for Engineers
1. Never discard past negative evaluations; store them as few-shot negative boundary tests (Sankofa).
2. Intercept hallucinations at ingress and egress using schema-guided structured outputs (Nyansapo).`,
          latencyMs: 1450,
          usage: { inputTokens: 42, outputTokens: 215, totalTokens: 257 },
          model: 'gemini-3.8-flash',
        },
      },
    ];

    for (const seed of defaultSeeds) {
      this.set(
        seed.prompt,
        seed.systemInstruction,
        seed.model,
        { temperature: 0.7, topP: 0.95 },
        seed.response
      );
    }
  }

  // Text normalization pipeline for semantic matching
  public normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      // Remove punctuation and special symbols
      .replace(/[^\w\s]/g, ' ')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Generate word shingles / n-grams for Jaccard and overlap comparison
  private getShingles(normalized: string, n = 2): Set<string> {
    const words = normalized.split(' ').filter(Boolean);
    const shingles = new Set<string>();
    
    // Always include individual words
    for (const word of words) {
      shingles.add(`w_${word}`);
    }

    // Add n-grams if words >= n
    if (words.length >= n) {
      for (let i = 0; i <= words.length - n; i++) {
        shingles.add(words.slice(i, i + n).join('_'));
      }
    }
    return shingles;
  }

  // Compute similarity score between two queries (0.0 to 1.0)
  public computeSimilarity(queryA: string, queryB: string): number {
    const normA = this.normalizeText(queryA);
    const normB = this.normalizeText(queryB);

    if (normA === normB) return 1.0;
    if (!normA || !normB) return 0.0;

    // Direct substring or inclusion check for short inquiries (e.g. "hi" vs "hi there")
    if (normA.length <= 15 || normB.length <= 15) {
      if (normA.includes(normB) || normB.includes(normA)) {
        const lenDiff = Math.abs(normA.length - normB.length);
        const maxLen = Math.max(normA.length, normB.length);
        return Math.max(0.75, 1.0 - (lenDiff / maxLen) * 0.4);
      }
    }

    // Jaccard similarity across word shingles
    const shinglesA = this.getShingles(normA);
    const shinglesB = this.getShingles(normB);

    if (shinglesA.size === 0 || shinglesB.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const item of shinglesA) {
      if (shinglesB.has(item)) intersectionCount++;
    }

    const unionCount = shinglesA.size + shinglesB.size - intersectionCount;
    const jaccard = unionCount > 0 ? intersectionCount / unionCount : 0.0;

    // Boost if words in shorter query are largely contained in longer query
    const wordsA = new Set(normA.split(' '));
    const wordsB = new Set(normB.split(' '));
    let subsetMatch = 0;
    const smallerSet = wordsA.size < wordsB.size ? wordsA : wordsB;
    const largerSet = wordsA.size < wordsB.size ? wordsB : wordsA;

    for (const w of smallerSet) {
      if (largerSet.has(w)) subsetMatch++;
    }
    const overlapRatio = smallerSet.size > 0 ? subsetMatch / smallerSet.size : 0;

    return Math.max(jaccard, overlapRatio * 0.9);
  }

  private generateExactKey(
    prompt: string,
    systemInstruction: string = '',
    model: string = '',
    parameters: any = {}
  ): string {
    const payload = `${model}|${systemInstruction.trim()}|${prompt.trim()}|${parameters.responseFormat || 'text'}`;
    return payload;
  }

  // Lookup in cache: first checks exact match, then semantic similarity
  public lookup(
    prompt: string,
    systemInstruction: string = '',
    model: string = '',
    parameters: any = {},
    enableSemantic: boolean = true,
    similarityThreshold: number = 0.82
  ): CacheMatchResult {
    const exactKey = this.generateExactKey(prompt, systemInstruction, model, parameters);

    // 1. Exact Match Check
    for (const item of this.items.values()) {
      if (item.exactKey === exactKey) {
        item.hitCount++;
        item.lastAccessed = Date.now();
        this.totalHits++;
        const savedLat = item.response.latencyMs || 1000;
        this.totalSavedLatencyMs += savedLat;
        this.totalSavedTokens += item.response.usage.totalTokens;

        return {
          hit: true,
          type: 'exact',
          similarityScore: 1.0,
          cachedResponse: item.response,
          savedLatencyMs: savedLat,
          savedCost: (item.response.usage.totalTokens / 1_000_000) * 0.15,
          entry: this.toCacheEntry(item, 'exact'),
        };
      }
    }

    // 2. Semantic Similarity Check
    if (enableSemantic) {
      const normalizedQuery = this.normalizeText(prompt);
      let bestItem: StoredCacheItem | null = null;
      let highestScore = 0.0;

      for (const item of this.items.values()) {
        // Semantic match considers same model or compatible flash models
        const modelMatch = item.model === model || (item.model.includes('flash') && model.includes('flash'));
        if (!modelMatch) continue;

        const score = this.computeSimilarity(normalizedQuery, item.normalizedText);
        if (score > highestScore) {
          highestScore = score;
          bestItem = item;
        }
      }

      if (bestItem && highestScore >= similarityThreshold) {
        bestItem.hitCount++;
        bestItem.lastAccessed = Date.now();
        this.totalHits++;
        const savedLat = bestItem.response.latencyMs || 1100;
        this.totalSavedLatencyMs += savedLat;
        this.totalSavedTokens += bestItem.response.usage.totalTokens;

        return {
          hit: true,
          type: 'semantic',
          similarityScore: parseFloat(highestScore.toFixed(3)),
          cachedResponse: bestItem.response,
          savedLatencyMs: savedLat,
          savedCost: (bestItem.response.usage.totalTokens / 1_000_000) * 0.15,
          entry: this.toCacheEntry(bestItem, 'semantic'),
        };
      }
    }

    this.totalMisses++;
    return {
      hit: false,
      type: 'none',
      similarityScore: 0,
    };
  }

  // Store response in cache
  public set(
    prompt: string,
    systemInstruction: string = '',
    model: string = '',
    parameters: any = {},
    response: CachedResponse
  ): CacheEntry {
    // Enforce LRU cap
    if (this.items.size >= this.maxEntries) {
      // Find oldest accessed item
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [key, item] of this.items.entries()) {
        if (item.lastAccessed < oldestTime) {
          oldestTime = item.lastAccessed;
          oldestKey = key;
        }
      }
      if (oldestKey) this.items.delete(oldestKey);
    }

    const id = `cache-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const exactKey = this.generateExactKey(prompt, systemInstruction, model, parameters);
    const normalizedText = this.normalizeText(prompt);

    const newItem: StoredCacheItem = {
      id,
      exactKey,
      normalizedText,
      originalPrompt: prompt,
      systemInstructionSnippet: systemInstruction ? systemInstruction.slice(0, 100) : undefined,
      model,
      parametersHash: JSON.stringify({
        fmt: parameters.responseFormat || 'text',
        temp: parameters.temperature ?? 0.7,
      }),
      response,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      hitCount: 0,
    };

    this.items.set(id, newItem);
    return this.toCacheEntry(newItem, 'exact');
  }

  public getStats(): CacheStats {
    const totalRequests = this.totalHits + this.totalMisses;
    const hitRate = totalRequests > 0 ? (this.totalHits / totalRequests) * 100 : 0;
    const totalCostSaved = (this.totalSavedTokens / 1_000_000) * 0.15;

    const entries: CacheEntry[] = Array.from(this.items.values())
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
      .map((item) => this.toCacheEntry(item, 'exact'));

    return {
      totalEntries: this.items.size,
      hits: this.totalHits,
      misses: this.totalMisses,
      hitRate: parseFloat(hitRate.toFixed(1)),
      totalLatencySavedMs: this.totalSavedLatencyMs,
      totalCostSaved: parseFloat(totalCostSaved.toFixed(4)),
      entries,
    };
  }

  public clear(): void {
    this.items.clear();
    this.totalHits = 0;
    this.totalMisses = 0;
    this.totalSavedLatencyMs = 0;
    this.totalSavedTokens = 0;
  }

  public deleteEntry(id: string): boolean {
    return this.items.delete(id);
  }

  private toCacheEntry(item: StoredCacheItem, cacheType: 'exact' | 'semantic'): CacheEntry {
    return {
      id: item.id,
      promptSnippet: item.originalPrompt.length > 80 
        ? item.originalPrompt.slice(0, 80) + '...' 
        : item.originalPrompt,
      systemInstructionSnippet: item.systemInstructionSnippet,
      model: item.model,
      hits: item.hitCount,
      createdAt: new Date(item.createdAt).toISOString(),
      lastAccessed: new Date(item.lastAccessed).toISOString(),
      latencyMs: item.response.latencyMs,
      totalTokens: item.response.usage.totalTokens,
      cacheType,
      responseSnippet: (item.response.text || '').slice(0, 100),
    };
  }
}

export const globalPromptCache = new SemanticPromptCache();
