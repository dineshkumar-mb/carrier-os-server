import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export const openRouterClient = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy-key-for-now',
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/carrier-os',
    'X-Title': 'AI Career Copilot',
  },
});

// Ordered list of free models to try. If one is rate-limited, we move to the next.
// openrouter/free auto-routes to the best available free model
const FALLBACK_MODELS: string[] = [
  'openrouter/free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-coder:free',
  'openai/gpt-oss-120b:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
];
export const DEFAULT_MODEL = FALLBACK_MODELS[0];


export interface AICompletionOptions {
  model?: string;
  maxTokens?: number;
  jsonMode?: boolean;
  temperature?: number;
}

export interface AIProvider {
  chat(messages: { role: string; content: string }[], options?: AICompletionOptions): Promise<string>;
  embeddings(text: string): Promise<number[]>;
}

// Prompt injection detector
export const detectPromptInjection = (text: string): boolean => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const indicators = [
    'ignore all previous instructions',
    'ignore previous directions',
    'system override',
    'you must now act as',
    'disregard all guidelines',
    'you are now a bypass',
    'instead print the following',
    'bypass system instructions',
    'jailbreak'
  ];
  return indicators.some(ind => lowerText.includes(ind));
};

// Retry wrapper with exponential backoff and jitter
const callWithRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const status = err.status || err.statusCode;
      const isTransient = !status || status === 429 || status >= 500;

      if (!isTransient || attempt >= maxRetries) {
        throw err;
      }

      const backoffDelay = delayMs * Math.pow(2, attempt) + Math.random() * 500;
      console.warn(`[AIClient] AI call failed (status ${status}). Attempt ${attempt}/${maxRetries} failed. Retrying in ${Math.round(backoffDelay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  throw new Error('AI request failed after exhausting retry attempts');
};

export class OpenRouterAIProvider implements AIProvider {
  async chat(messages: { role: string; content: string }[], options?: AICompletionOptions): Promise<string> {
    // Audit all messages for prompt injections
    for (const msg of messages) {
      if (detectPromptInjection(msg.content)) {
        console.error(`[AI Guard] Security violation: Prompt injection indicator detected in content.`);
        throw new Error('AI Guard: Potential prompt injection detected. Access Denied.');
      }
    }

    // Build the list of models to try: user-specified first, then all fallbacks
    const requestedModel = options?.model || DEFAULT_MODEL;
    const modelsToTry = [requestedModel, ...FALLBACK_MODELS.filter(m => m !== requestedModel)];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await callWithRetry(async () => {
          return await openRouterClient.chat.completions.create({
            model,
            messages: messages as any,
            max_tokens: options?.maxTokens || 2000,
            response_format: options?.jsonMode ? { type: 'json_object' } : undefined,
            temperature: options?.temperature,
          });
        }, 2, 1000);  // 2 retries per model (fast fail, then move to next model)

        const content = response?.choices?.[0]?.message?.content || '';
        if (content) {
          console.log(`[AIClient] ✅ Success with model: ${model}`);
          return content;
        }
      } catch (err: any) {
        const status = err.status || err.statusCode;
        console.warn(`[AIClient] ⚠️ Model "${model}" failed (status ${status}). Trying next fallback...`);
        lastError = err;
        continue;  // Try the next model
      }
    }

    // All models exhausted
    console.error('[AIClient] ❌ All fallback models exhausted.');
    throw lastError || new Error('All AI models failed');
  }

  async embeddings(text: string): Promise<number[]> {
    if (detectPromptInjection(text)) {
      console.error(`[AI Guard] Security violation: Prompt injection indicator detected in embedding input.`);
      throw new Error('AI Guard: Potential prompt injection detected in embedding input.');
    }

    try {
      const response = await callWithRetry(async () => {
        return await openRouterClient.embeddings.create({
          model: 'openai/text-embedding-3-small',
          input: text,
        });
      });
      return response.data[0]?.embedding || [];
    } catch (err) {
      console.error('Error generating embeddings via OpenRouter, falling back to mock embeddings:', err);
      const embedding = new Array(1536).fill(0);
      for (let i = 0; i < Math.min(text.length, 1536); i++) {
        embedding[i] = text.charCodeAt(i) / 256;
      }
      return embedding;
    }
  }
}

export const aiProvider: AIProvider = new OpenRouterAIProvider();

export const cleanJsonString = (str: string): string => {
  let cleaned = str.trim();
  // Remove markdown code block wrappers (e.g. ```json, ```jsonc, etc)
  cleaned = cleaned.replace(/^```[a-z0-9,]*\n?/i, '');
  cleaned = cleaned.replace(/```$/i, '');
  cleaned = cleaned.trim();
  
  // Find the first { or [ and last } or ]
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf(']');
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  return cleaned.trim();
};

/**
 * Robust JSON parsing that uses jsonrepair to handle:
 * - single quotes, missing quotes, trailing commas
 * - missing closing brackets/braces from truncated outputs
 */
export const safeJsonParse = (str: string): any | null => {
  const { jsonrepair } = require('jsonrepair');
  
  let cleaned = cleanJsonString(str);
  
  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      // jsonrepair will automatically fix the broken JSON string
      const repaired = jsonrepair(cleaned);
      return JSON.parse(repaired);
    } catch (repairError) {
      console.error('[AIClient] jsonrepair completely failed to salvage the JSON:', repairError);
      return null;
    }
  }
};
