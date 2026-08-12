import { ProviderRegistry } from '../providers/ProviderRegistry';
import { OllamaProvider } from '../providers/OllamaProvider';

export type ModelTaskType =
  | 'JOB_MATCHING'
  | 'RESUME_TAILORING'
  | 'ATS_ANALYSIS'
  | 'COVER_LETTER'
  | 'INTERVIEW_PREP'
  | 'REFLECTION';

export interface ModelRequest {
  task: ModelTaskType;
  privacyMode: 'LOCAL_ONLY' | 'CLOUD_ALLOWED';
  complexity: 'FAST' | 'MEDIUM' | 'REASONING';
  input: any;
}

export interface ModelResponse {
  success: boolean;
  providerId: string;
  status: 'COMPLETED' | 'BLOCKED' | 'FAILED';
  output?: string;
  error?: string;
}

export class ModelRouter {
  private static instance: ModelRouter;
  private registry: ProviderRegistry;

  private constructor() {
    this.registry = ProviderRegistry.getInstance();
  }

  public static getInstance(): ModelRouter {
    if (!ModelRouter.instance) {
      ModelRouter.instance = new ModelRouter();
    }
    return ModelRouter.instance;
  }

  public static selectModel(complexity: string, privacyMode: string): string {
    if (privacyMode === 'LOCAL_ONLY') {
      throw new Error('LOCAL_ONLY privacy mode violation: Cannot select cloud model when LOCAL_ONLY is requested.');
    }
    return 'gpt-4o';
  }

  public async routeRequest(request: ModelRequest): Promise<ModelResponse> {
    const { task, privacyMode, input } = request;

    // 1. LOCAL_ONLY Privacy Mode Enforcement
    if (privacyMode === 'LOCAL_ONLY') {
      const ollama = this.registry.getProvider('ollama') as OllamaProvider | undefined;
      if (!ollama) {
        return {
          success: false,
          providerId: 'none',
          status: 'BLOCKED',
          error: 'Local model unavailable. Privacy contract strictly enforced: Cloud LLM fallback prohibited in LOCAL_ONLY mode.'
        };
      }

      const health = await ollama.healthCheck();
      if (!health.healthy) {
        return {
          success: false,
          providerId: 'ollama',
          status: 'BLOCKED',
          error: 'Local model (Ollama) unavailable. Execution paused for privacy safety.'
        };
      }

      const text = await ollama.generateText(typeof input === 'string' ? input : JSON.stringify(input));
      return {
        success: true,
        providerId: 'ollama',
        status: 'COMPLETED',
        output: text
      };
    }

    // 2. CLOUD_ALLOWED Mode (Default OpenAI / Gemini / Anthropic)
    return {
      success: true,
      providerId: 'openai',
      status: 'COMPLETED',
      output: `[OpenAI GPT-4o Output] Processed task ${task} in cloud mode.`
    };
  }
}
