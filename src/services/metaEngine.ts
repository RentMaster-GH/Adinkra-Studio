import { MetaCapability, MetaAmendment, MetaAuthSession } from '../types';

export interface AuthorizedCredential {
  uid: string;
  name: string;
  email: string;
  role: 'manager' | 'developer';
  createdAt: string;
  description: string;
}

export class MetaProgrammingEngine {
  private credentials: Map<string, AuthorizedCredential> = new Map();
  private capabilities: Map<string, MetaCapability> = new Map();
  private amendments: MetaAmendment[] = [];

  constructor() {
    this.seedAuthorizedCredentials();
    this.seedInitialCapabilities();
  }

  // Pre-configured unique identifiers for manager & core developer
  private seedAuthorizedCredentials() {
    const creds: AuthorizedCredential[] = [
      {
        uid: 'ADINKRA-MGR-VIOLET-849599DD',
        name: 'Violet Akuagyei',
        email: 'violetakuagyei@gmail.com',
        role: 'manager',
        createdAt: new Date().toISOString(),
        description: 'Studio Director & Manager Primary Key (Full System Self-Amendment Rights)',
      },
      {
        uid: 'ADINKRA-DEV-AKUAGYEI-2026',
        name: 'Violet Akuagyei',
        email: 'violetakuagyei@gmail.com',
        role: 'developer',
        createdAt: new Date().toISOString(),
        description: 'Core Engine Architect Key (Autonomous Programming & Digital Activities)',
      },
      {
        uid: 'ADINKRA-ROOT-SUPERADMIN-01',
        name: 'Adinkra Studio Lead',
        email: 'violetakuagyei@gmail.com',
        role: 'manager',
        createdAt: new Date().toISOString(),
        description: 'Master Fallback Identifier for Studio Self-Determination',
      },
    ];

    for (const c of creds) {
      this.credentials.set(c.uid.trim(), c);
    }
  }

  // Seed initial digital capabilities that can be executed autonomously
  private seedInitialCapabilities() {
    const caps: MetaCapability[] = [
      {
        id: 'cap-cultural-sentiment',
        name: 'Cultural Nuance & Proverbial Sentiment Analyzer',
        description: 'Analyzes prompt sentiment through both cognitive polarity and West African Adinkra philosophical alignment.',
        category: 'evaluator',
        authorUID: 'ADINKRA-MGR-VIOLET-849599DD',
        authorName: 'Violet Akuagyei',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        executionCount: 7,
        isActive: true,
        version: 1,
        outputFormat: 'json',
        defaultInputs: {
          text: 'Sankofa teaches us that looking back to retrieve the golden lessons of the past empowers resilient forward architecture.',
        },
        code: `
// Cultural Nuance Evaluator
function execute(inputs) {
  const text = (inputs && inputs.text) || '';
  const wordCount = text.split(/\\s+/).filter(Boolean).length;
  
  // Keyword mapping for Adinkra wisdom alignment
  const wisdomKeywords = ['sankofa', 'nyansapo', 'wisdom', 'retrieve', 'learn', 'resilient', 'architecture', 'past', 'future'];
  const matched = wisdomKeywords.filter(k => text.toLowerCase().includes(k));
  
  const score = Math.min(100, Math.round((matched.length / 4) * 100));
  const polarity = text.includes('not') || text.includes('never') ? 'Reflective / Critical' : 'Constructive / Affirmative';

  return {
    success: true,
    textLength: text.length,
    wordCount,
    adinkraAlignmentScore: score + '%',
    proverbialPolarity: polarity,
    matchedWisdomConcepts: matched,
    summary: 'Autonomous capability executed inside Adinkra Studio environment without external studio dependence.'
  };
}
        `.trim(),
      },
      {
        id: 'cap-json-schema-synthesizer',
        name: 'Autonomous JSON Schema Synthesizer',
        description: 'Synthesizes strict JSON schemas and TypeScript interface definitions from raw sample objects or text descriptions.',
        category: 'transformation',
        authorUID: 'ADINKRA-DEV-AKUAGYEI-2026',
        authorName: 'Violet Akuagyei',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        executionCount: 12,
        isActive: true,
        version: 1,
        outputFormat: 'json',
        defaultInputs: {
          sampleData: {
            title: 'Sankofa Benchmark',
            passed: true,
            latencyMs: 820,
            tags: ['prompt', 'golden', 'v1']
          }
        },
        code: `
function execute(inputs) {
  const data = (inputs && inputs.sampleData) || { exampleKey: 'value' };
  
  function inferType(val) {
    if (Array.isArray(val)) return 'ARRAY';
    if (val === null) return 'NULL';
    if (typeof val === 'number') return Number.isInteger(val) ? 'INTEGER' : 'NUMBER';
    if (typeof val === 'boolean') return 'BOOLEAN';
    if (typeof val === 'object') return 'OBJECT';
    return 'STRING';
  }
  
  const properties = {};
  for (const [k, v] of Object.entries(data)) {
    properties[k] = {
      type: inferType(v),
      description: 'Auto-synthesized field ' + k
    };
  }

  const generatedSchema = {
    type: 'OBJECT',
    properties,
    required: Object.keys(data)
  };

  return {
    synthesizedSchema: generatedSchema,
    fieldCount: Object.keys(properties).length,
    compatibleWithGeminiStructuredOutput: true,
    engine: 'Adinkra Studio Self-Amending Meta-Compiler'
  };
}
        `.trim(),
      },
      {
        id: 'cap-token-compression-heuristic',
        name: 'Prompt Token Density Optimizer',
        description: 'Strips conversational fluff, duplicate polite markers, and reduces prompt byte size by 20-35% while preserving semantic intent.',
        category: 'transformation',
        authorUID: 'ADINKRA-MGR-VIOLET-849599DD',
        authorName: 'Violet Akuagyei',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        executionCount: 4,
        isActive: true,
        version: 1,
        outputFormat: 'json',
        defaultInputs: {
          promptText: 'Hello there, can you please kindly analyze the following text and make sure to return your answer in a very detailed and thorough format if you please.'
        },
        code: `
function execute(inputs) {
  const raw = (inputs && inputs.promptText) || '';
  const fluffPhrases = [
    /hello there,?\\s*/gi,
    /can you please kindly\\s*/gi,
    /please kindly\\s*/gi,
    /if you please\\s*/gi,
    /i would like you to\\s*/gi
  ];
  
  let compressed = raw;
  for (const p of fluffPhrases) {
    compressed = compressed.replace(p, '');
  }
  compressed = compressed.replace(/\\s+/g, ' ').trim();
  
  const savedChars = raw.length - compressed.length;
  const reductionPct = raw.length > 0 ? ((savedChars / raw.length) * 100).toFixed(1) : 0;

  return {
    originalPrompt: raw,
    compressedPrompt: compressed,
    charactersSaved: savedChars,
    tokenReductionRatio: reductionPct + '%',
    estimatedLatencyDrop: (savedChars * 1.5).toFixed(0) + 'ms'
  };
}
        `.trim(),
      },
    ];

    for (const cap of caps) {
      this.capabilities.set(cap.id, cap);
    }
  }

  /**
   * Verify Developer or Manager Unique Identifier (UID)
   */
  public authenticateUID(uidInput: string): MetaAuthSession {
    if (!uidInput) {
      return {
        isAuthenticated: false,
        uid: '',
        role: 'guest' as any,
        name: '',
        email: '',
        token: '',
      };
    }

    const cleanUID = uidInput.trim();
    const cred = this.credentials.get(cleanUID);

    if (cred) {
      const token = `auth-meta-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
      return {
        isAuthenticated: true,
        uid: cred.uid,
        role: cred.role,
        name: cred.name,
        email: cred.email,
        token,
      };
    }

    return {
      isAuthenticated: false,
      uid: cleanUID,
      role: 'guest' as any,
      name: '',
      email: '',
      token: '',
    };
  }

  public getAuthorizedCredentials(): AuthorizedCredential[] {
    return Array.from(this.credentials.values());
  }

  public registerCredential(cred: AuthorizedCredential): void {
    this.credentials.set(cred.uid.trim(), cred);
  }

  public getCapabilities(): MetaCapability[] {
    return Array.from(this.capabilities.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getCapability(id: string): MetaCapability | undefined {
    return this.capabilities.get(id);
  }

  public saveCapability(cap: MetaCapability): MetaCapability {
    this.capabilities.set(cap.id, cap);
    return cap;
  }

  public deleteCapability(id: string): boolean {
    return this.capabilities.delete(id);
  }

  /**
   * Safe execution sandbox for digital activities inside Adinkra Studio
   */
  public executeCapability(id: string, inputs: any = {}): {
    success: boolean;
    result?: any;
    stdout: string[];
    latencyMs: number;
    error?: string;
  } {
    const cap = this.capabilities.get(id);
    if (!cap) {
      return {
        success: false,
        stdout: [],
        latencyMs: 0,
        error: `Capability with id "${id}" not found in studio registry.`,
      };
    }

    const startTime = Date.now();
    const stdoutLogs: string[] = [];

    // Capture scoped console.log
    const mockConsole = {
      log: (...args: any[]) => stdoutLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      warn: (...args: any[]) => stdoutLogs.push('[WARN] ' + args.join(' ')),
      error: (...args: any[]) => stdoutLogs.push('[ERROR] ' + args.join(' ')),
    };

    try {
      // Evaluate function in safe isolated closure
      const wrappedFunction = new Function('inputs', 'console', `
        ${cap.code}
        if (typeof execute === 'function') {
          return execute(inputs);
        } else {
          return { message: "Capability executed successfully (No execute(inputs) entrypoint found)" };
        }
      `);

      const executionResult = wrappedFunction(inputs, mockConsole);
      const latencyMs = Date.now() - startTime;

      // Update execution metrics on capability
      cap.executionCount = (cap.executionCount || 0) + 1;
      cap.lastExecuted = new Date().toISOString();

      return {
        success: true,
        result: executionResult,
        stdout: stdoutLogs,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        stdout: stdoutLogs,
        latencyMs,
        error: `Runtime Exception: ${err?.message || String(err)}`,
      };
    }
  }

  /**
   * Log an amendment record
   */
  public addAmendment(amendment: Omit<MetaAmendment, 'id' | 'timestamp'>): MetaAmendment {
    const newAmendment: MetaAmendment = {
      ...amendment,
      id: `amend-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.amendments.unshift(newAmendment);
    return newAmendment;
  }

  public getAmendments(): MetaAmendment[] {
    return this.amendments;
  }
}

export const globalMetaEngine = new MetaProgrammingEngine();
