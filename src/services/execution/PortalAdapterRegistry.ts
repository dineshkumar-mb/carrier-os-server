import { IPortalAdapter } from './adapters/IPortalAdapter';
import { GreenhousePortalAdapter } from './adapters/GreenhousePortalAdapter';
import { LeverPortalAdapter } from './adapters/LeverPortalAdapter';
import { GenericFormAdapter } from './adapters/GenericFormAdapter';

export class PortalAdapterRegistry {
  private static instance: PortalAdapterRegistry;
  private adapters: IPortalAdapter[] = [];
  private fallbackAdapter: IPortalAdapter;

  private constructor() {
    this.fallbackAdapter = new GenericFormAdapter();
    this.registerDefaultAdapters();
  }

  public static getInstance(): PortalAdapterRegistry {
    if (!PortalAdapterRegistry.instance) {
      PortalAdapterRegistry.instance = new PortalAdapterRegistry();
    }
    return PortalAdapterRegistry.instance;
  }

  private registerDefaultAdapters(): void {
    this.adapters.push(new GreenhousePortalAdapter());
    this.adapters.push(new LeverPortalAdapter());
  }

  public registerAdapter(adapter: IPortalAdapter): void {
    this.adapters.unshift(adapter);
  }

  public getAdapterForUrl(url: string): IPortalAdapter {
    for (const adapter of this.adapters) {
      if (adapter.detectPortal(url)) {
        return adapter;
      }
    }
    return this.fallbackAdapter;
  }
}
