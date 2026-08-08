export type AIProviderType = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'openrouter' | 'local';

export type TaskComplexity = 'fast' | 'medium' | 'reasoning';

export interface AIProviderConfig {
  id: AIProviderType;
  name: string;
  baseUrl?: string;
  apiKey?: string;
  defaultModel: string;
  supportsLocal: boolean;
}

export class AIProviderRegistry {
  private static instance: AIProviderRegistry;
  private providers: Map<AIProviderType, AIProviderConfig> = new Map();
  private activeProvider: AIProviderType = 'openai';

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): AIProviderRegistry {
    if (!AIProviderRegistry.instance) {
      AIProviderRegistry.instance = new AIProviderRegistry();
    }
    return AIProviderRegistry.instance;
  }

  private registerDefaults(): void {
    this.register({
      id: 'openai',
      name: 'OpenAI',
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: 'gpt-4o',
      supportsLocal: false
    });

    this.register({
      id: 'anthropic',
      name: 'Anthropic Claude',
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultModel: 'claude-3-5-sonnet-20241022',
      supportsLocal: false
    });

    this.register({
      id: 'gemini',
      name: 'Google Gemini',
      apiKey: process.env.GEMINI_API_KEY,
      defaultModel: 'gemini-1.5-pro',
      supportsLocal: false
    });

    this.register({
      id: 'ollama',
      name: 'Ollama (Local LLM)',
      baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
      defaultModel: 'llama3.2',
      supportsLocal: true
    });

    this.register({
      id: 'openrouter',
      name: 'OpenRouter',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultModel: 'openrouter/free',
      supportsLocal: false
    });
  }

  public register(config: AIProviderConfig): void {
    this.providers.set(config.id, config);
  }

  public getProvider(id: AIProviderType): AIProviderConfig | undefined {
    return this.providers.get(id);
  }

  public setActiveProvider(id: AIProviderType): void {
    if (this.providers.has(id)) {
      this.activeProvider = id;
      console.log(`[AIProviderRegistry] Active AI Provider set to: ${id}`);
    }
  }

  public getActiveProvider(): AIProviderConfig {
    return this.providers.get(this.activeProvider) || this.providers.get('openai')!;
  }

  public routeModelForTask(complexity: TaskComplexity): string {
    const active = this.getActiveProvider();
    if (active.id === 'ollama') return active.defaultModel;

    switch (complexity) {
      case 'fast':
        return active.id === 'openai' ? 'gpt-4o-mini' : active.defaultModel;
      case 'medium':
        return active.defaultModel;
      case 'reasoning':
        return active.id === 'openai' ? 'gpt-4o' : active.defaultModel;
    }
  }
}

export const aiProviderRegistry = AIProviderRegistry.getInstance();
