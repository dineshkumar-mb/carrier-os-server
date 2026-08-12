import { IProviderPlugin, ProviderHealth } from './interfaces/IProviderPlugin';
import { OllamaProvider } from './OllamaProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GmailOAuthProvider } from './GmailOAuthProvider';

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers: Map<string, IProviderPlugin> = new Map();

  private constructor() {
    this.registerDefaultProviders();
  }

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  private registerDefaultProviders(): void {
    const defaults: IProviderPlugin[] = [
      new OllamaProvider(),
      new OpenAIProvider(),
      new GmailOAuthProvider()
    ];

    for (const p of defaults) {
      this.registerProvider(p);
    }
  }

  public registerProvider(provider: IProviderPlugin): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): IProviderPlugin | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): IProviderPlugin[] {
    return Array.from(this.providers.values());
  }

  public async getHealthSummary(): Promise<Record<string, ProviderHealth>> {
    const summary: Record<string, ProviderHealth> = {};
    for (const [id, provider] of this.providers.entries()) {
      summary[id] = await provider.healthCheck();
    }
    return summary;
  }
}
