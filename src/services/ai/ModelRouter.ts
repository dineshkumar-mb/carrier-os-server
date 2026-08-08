import { aiProviderRegistry, TaskComplexity } from './AIProviderRegistry';

export type PrivacyMode = 'STANDARD' | 'PRIVATE' | 'LOCAL_ONLY';

export class ModelRouter {
  public static selectModel(complexity: TaskComplexity, privacyMode: PrivacyMode = 'STANDARD'): { providerId: string; modelName: string } {
    console.log(`[ModelRouter] Selecting model for complexity "${complexity}" under privacyMode "${privacyMode}"...`);

    if (privacyMode === 'LOCAL_ONLY') {
      const active = aiProviderRegistry.getActiveProvider();
      if (!active.supportsLocal && active.id !== 'ollama') {
        throw new Error(`[ModelRouter Privacy Boundary Enforced] Privacy mode is set to LOCAL_ONLY, but active provider "${active.name}" is a cloud provider. Cross-privacy fallback is strictly prohibited.`);
      }
      return {
        providerId: 'ollama',
        modelName: 'llama3.2'
      };
    }

    const provider = aiProviderRegistry.getActiveProvider();
    const modelName = aiProviderRegistry.routeModelForTask(complexity);

    return {
      providerId: provider.id,
      modelName
    };
  }
}
