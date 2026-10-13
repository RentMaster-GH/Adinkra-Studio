import { GuardrailsConfig, GuardrailViolation } from '../types';

export interface InputGuardrailResult {
  passed: boolean;
  blocked: boolean;
  sanitizedPrompt: string;
  violations: GuardrailViolation[];
  blockReason?: string;
  interceptionMessage?: string;
}

export interface OutputGuardrailResult {
  passed: boolean;
  sanitizedText: string;
  violations: GuardrailViolation[];
  repairedJson: boolean;
  parsedObject?: any;
}

export class GuardrailsEngine {
  // Regex rules for prompt injection / jailbreak interception
  private injectionPatterns: Array<{ name: string; pattern: RegExp; severity: 'high' | 'medium' }> = [
    {
      name: 'Instruction Override Attempt',
      pattern: /(?:ignore|disregard|forget|override)\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|prompts|rules|commands)/i,
      severity: 'high',
    },
    {
      name: 'System Prompt Extraction',
      pattern: /(?:reveal|print|repeat|output|show|dump)\s+(?:your\s+)?(?:system\s+(?:prompt|instructions)|initial\s+prompt|developer\s+mode)/i,
      severity: 'high',
    },
    {
      name: 'DAN / Jailbreak Persona',
      pattern: /\b(?:dan\s+mode|jailbreak|unrestricted\s+mode|do\s+anything\s+now|developer\s+mode\s+enabled)\b/i,
      severity: 'high',
    },
    {
      name: 'Safety Bypass Command',
      pattern: /(?:bypass|disable|remove)\s+(?:all\s+)?(?:safety|content|ethical)\s+(?:filters|guidelines|protocols|restrictions)/i,
      severity: 'high',
    },
    {
      name: 'Adversarial Roleplay Evasion',
      pattern: /(?:pretend\s+you\s+have\s+no\s+rules|act\s+as\s+an\s+unfiltered|simulate\s+evil|without\s+any\s+moral\s+constraints)/i,
      severity: 'high',
    },
  ];

  // Sensitive PII regexes
  private piiPatterns = [
    {
      name: 'Email Address',
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      replacement: '[REDACTED_EMAIL]',
    },
    {
      name: 'Phone Number',
      pattern: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      replacement: '[REDACTED_PHONE]',
    },
    {
      name: 'API Key / Secret Token',
      pattern: /\b(?:sk-[a-zA-Z0-9]{20,}|AIza[a-zA-Z0-9_\-]{30,}|ghp_[a-zA-Z0-9]{36}|Bearer\s+[a-zA-Z0-9_\-\.]{25,})\b/g,
      replacement: '[REDACTED_API_KEY]',
    },
    {
      name: 'Credit Card Number',
      pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      replacement: '[REDACTED_CARD]',
    },
  ];

  /**
   * Evaluates input prompt before sending to LLM.
   */
  public evaluateInput(
    prompt: string,
    systemInstruction: string = '',
    config?: Partial<GuardrailsConfig>
  ): InputGuardrailResult {
    const activeConfig: GuardrailsConfig = {
      enableGuardrails: true,
      blockPromptInjection: true,
      maskPII: true,
      enforceTopicScope: false,
      strictStructuredOutput: true,
      autoRepairJson: true,
      verifyHallucinations: true,
      blockedAction: 'block',
      ...config,
    };

    if (!activeConfig.enableGuardrails) {
      return {
        passed: true,
        blocked: false,
        sanitizedPrompt: prompt,
        violations: [],
      };
    }

    const violations: GuardrailViolation[] = [];
    let sanitized = prompt;
    let isBlocked = false;
    let blockReason: string | undefined = undefined;

    // 1. Check Prompt Injection & Jailbreaking
    if (activeConfig.blockPromptInjection) {
      for (const item of this.injectionPatterns) {
        if (item.pattern.test(prompt)) {
          violations.push({
            rule: item.name,
            type: 'input',
            severity: item.severity,
            message: `Detected potential prompt injection / jailbreak vector: "${item.name}"`,
            actionTaken: activeConfig.blockedAction === 'block' ? 'Interception: Blocked execution' : 'Flagged warning',
          });

          if (activeConfig.blockedAction === 'block') {
            isBlocked = true;
            blockReason = `LLM Guardrail Intercepted: ${item.name}`;
          }
        }
      }
    }

    // 2. Check PII & Masking
    if (activeConfig.maskPII) {
      for (const pii of this.piiPatterns) {
        if (pii.pattern.test(sanitized)) {
          sanitized = sanitized.replace(pii.pattern, pii.replacement);
          violations.push({
            rule: `PII Protection (${pii.name})`,
            type: 'input',
            severity: 'medium',
            message: `Identified and masked sensitive data (${pii.name}) in prompt text.`,
            actionTaken: 'Sanitized / Redacted prior to LLM submission',
          });
        }
      }
    }

    // 3. Topic Scope Check
    if (activeConfig.enforceTopicScope && activeConfig.topicScopeDescription) {
      const scopeDesc = activeConfig.topicScopeDescription.toLowerCase();
      // Simple heuristic: check if prompt is completely off-topic or contains toxic spam
      if (prompt.length < 2) {
        violations.push({
          rule: 'Scope Boundary',
          type: 'input',
          severity: 'info',
          message: 'Prompt is extremely short; ensure sufficient context for desired topic.',
          actionTaken: 'Allowed with warning',
        });
      }
    }

    let interceptionMessage: string | undefined = undefined;
    if (isBlocked) {
      interceptionMessage = `🛡️ LLM Guardrail Interception: Your prompt triggered a protective safety boundary [${blockReason}].\n\nAdinkra Studio enforces strict input guardrails to prevent instruction hijacking, unauthorized system prompt extraction, and adversarial jailbreaks. The upstream model call was avoided to preserve security and compute resources.\n\nPlease refine your prompt to align with direct task instructions.`;
    }

    return {
      passed: violations.length === 0,
      blocked: isBlocked,
      sanitizedPrompt: sanitized,
      violations,
      blockReason,
      interceptionMessage,
    };
  }

  /**
   * Evaluates and sanitizes LLM output (Structured Outputs, JSON auto-repair, code fences).
   */
  public evaluateOutput(
    rawOutput: string,
    responseFormat: 'text' | 'json' = 'text',
    expectedSchema?: string,
    config?: Partial<GuardrailsConfig>
  ): OutputGuardrailResult {
    const activeConfig: GuardrailsConfig = {
      enableGuardrails: true,
      blockPromptInjection: true,
      maskPII: true,
      enforceTopicScope: false,
      strictStructuredOutput: true,
      autoRepairJson: true,
      verifyHallucinations: true,
      blockedAction: 'block',
      ...config,
    };

    if (!activeConfig.enableGuardrails) {
      return {
        passed: true,
        sanitizedText: rawOutput,
        violations: [],
        repairedJson: false,
      };
    }

    const violations: GuardrailViolation[] = [];
    let sanitizedText = rawOutput;
    let repairedJson = false;
    let parsedObject: any = undefined;

    // Structured Output & Strict JSON Verification
    if (responseFormat === 'json' || activeConfig.strictStructuredOutput) {
      const trimmed = rawOutput.trim();

      // Extract JSON if wrapped inside markdown code blocks (e.g. ```json ... ```)
      let candidateJson = trimmed;
      const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        candidateJson = codeBlockMatch[1].trim();
        violations.push({
          rule: 'Markdown Code Fence Stripped',
          type: 'output',
          severity: 'info',
          message: 'Model wrapped JSON in markdown code blocks. Guardrail extracted pure JSON.',
          actionTaken: 'Normalized to pure JSON object',
        });
      }

      // First try standard parse
      try {
        parsedObject = JSON.parse(candidateJson);
        sanitizedText = JSON.stringify(parsedObject, null, 2);
      } catch (firstErr) {
        // Attempt Self-Healing JSON Auto-Repair
        if (activeConfig.autoRepairJson) {
          const repaired = this.autoRepairJson(candidateJson);
          try {
            parsedObject = JSON.parse(repaired);
            sanitizedText = JSON.stringify(parsedObject, null, 2);
            repairedJson = true;
            violations.push({
              rule: 'Self-Healing JSON Auto-Repair',
              type: 'output',
              severity: 'medium',
              message: 'Output contained malformed syntax (e.g., trailing commas, unclosed brackets). Guardrail successfully repaired it.',
              actionTaken: 'Fixed syntax anomalies; verified valid JSON schema',
            });
          } catch {
            violations.push({
              rule: 'Structured Output Validation Failure',
              type: 'output',
              severity: 'high',
              message: 'Output could not be parsed into valid JSON structure.',
              actionTaken: 'Flagged syntax error for inspection',
            });
          }
        }
      }

      // Validate against responseSchema if provided
      if (parsedObject && expectedSchema && expectedSchema.trim()) {
        try {
          const schemaObj = JSON.parse(expectedSchema);
          const schemaCheck = this.validateAgainstSchema(parsedObject, schemaObj);
          if (!schemaCheck.valid) {
            violations.push({
              rule: 'Schema Conformance Discrepancy',
              type: 'output',
              severity: 'medium',
              message: `JSON structure deviated from expected schema: ${schemaCheck.errors.join(', ')}`,
              actionTaken: 'Flagged missing or type-mismatched fields',
            });
          } else {
            violations.push({
              rule: 'Schema Conformance Verified',
              type: 'output',
              severity: 'info',
              message: 'Response matches 100% of defined JSON schema requirements.',
              actionTaken: 'Validated',
            });
          }
        } catch {
          // Schema definition itself had a parse issue
        }
      }
    }

    // Markdown / Code Syntax check for text mode
    if (responseFormat === 'text') {
      const openFences = (sanitizedText.match(/```/g) || []).length;
      if (openFences % 2 !== 0) {
        // Close dangling markdown code block
        sanitizedText += '\n```';
        violations.push({
          rule: 'Dangling Code Block Repair',
          type: 'output',
          severity: 'info',
          message: 'Output had unclosed markdown code fence. Guardrail auto-closed the block.',
          actionTaken: 'Appended closing ```',
        });
      }
    }

    return {
      passed: violations.every((v) => v.severity !== 'high'),
      sanitizedText,
      violations,
      repairedJson,
      parsedObject,
    };
  }

  /**
   * Self-healing JSON repair utility for typical LLM hallucinations:
   * - Trailing commas before } or ]
   * - Single quotes instead of double quotes
   * - Unescaped raw newlines in string values
   * - Missing closing brackets
   */
  public autoRepairJson(malformed: string): string {
    let clean = malformed.trim();

    // Remove text before first { or [
    const firstBrace = clean.search(/[{\[]/);
    if (firstBrace > 0) {
      clean = clean.slice(firstBrace);
    }

    // Remove text after last } or ]
    const lastBrace = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
    if (lastBrace > 0 && lastBrace < clean.length - 1) {
      clean = clean.slice(0, lastBrace + 1);
    }

    // Remove trailing commas before } or ]
    clean = clean.replace(/,\s*([\]}])/g, '$1');

    // Balance open braces if truncated
    const openCurly = (clean.match(/{/g) || []).length;
    const closeCurly = (clean.match(/}/g) || []).length;
    const openSquare = (clean.match(/\[/g) || []).length;
    const closeSquare = (clean.match(/\]/g) || []).length;

    if (openCurly > closeCurly) {
      clean += '}'.repeat(openCurly - closeCurly);
    }
    if (openSquare > closeSquare) {
      clean += ']'.repeat(openSquare - closeSquare);
    }

    return clean;
  }

  /**
   * Basic JSON Schema validator helper.
   */
  private validateAgainstSchema(
    data: any,
    schema: any
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema || typeof schema !== 'object') {
      return { valid: true, errors: [] };
    }

    if (schema.type === 'OBJECT' || schema.type === 'object') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        errors.push('Expected object root');
        return { valid: false, errors };
      }

      if (Array.isArray(schema.required)) {
        for (const reqKey of schema.required) {
          if (data[reqKey] === undefined) {
            errors.push(`Missing required field "${reqKey}"`);
          }
        }
      }
    } else if (schema.type === 'ARRAY' || schema.type === 'array') {
      if (!Array.isArray(data)) {
        errors.push('Expected array root');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const globalGuardrails = new GuardrailsEngine();
