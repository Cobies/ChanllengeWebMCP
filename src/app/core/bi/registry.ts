import { Injectable, InjectionToken, Provider, Inject, Optional } from '@angular/core';
import type { BiDomainAdapter } from './bi.types';

/**
 * Multi-provider injection token for domain adapters.
 */
export const BI_DOMAIN_ADAPTERS = new InjectionToken<BiDomainAdapter[]>('BI_DOMAIN_ADAPTERS');

/**
 * BiToolRegistry manages domain adapters and provides dynamic resolution
 * for multi-domain enterprise WebMCP tools.
 */
@Injectable({
  providedIn: 'root',
})
export class BiToolRegistry {
  private readonly adapters = new Map<string, BiDomainAdapter>();

  constructor(
    @Optional() @Inject(BI_DOMAIN_ADAPTERS) adaptersFromDi?: BiDomainAdapter[] | null
  ) {
    if (adaptersFromDi && Array.isArray(adaptersFromDi)) {
      // If nested arrays or multi-providers were passed
      const flat = adaptersFromDi.flat();
      for (const adapter of flat) {
        if (adapter && adapter.domainId) {
          this.registerAdapter(adapter);
        }
      }
    }
  }

  /**
   * Register a new or custom domain adapter.
   */
  registerAdapter(adapter: BiDomainAdapter): void {
    this.adapters.set(adapter.domainId, adapter);
  }

  /**
   * Unregister an adapter by domain ID.
   */
  unregisterAdapter(domainId: string): boolean {
    return this.adapters.delete(domainId);
  }

  /**
   * Retrieve adapter for domain ID.
   */
  getAdapter(domainId: string): BiDomainAdapter | undefined {
    return this.adapters.get(domainId);
  }

  /**
   * Check if an adapter is registered.
   */
  hasAdapter(domainId: string): boolean {
    return this.adapters.has(domainId);
  }

  /**
   * Get all registered domain IDs.
   */
  getAvailableDomains(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get all registered adapters.
   */
  getAllAdapters(): BiDomainAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get default (first registered) adapter or undefined.
   */
  getDefaultAdapter(): BiDomainAdapter | undefined {
    const firstKey = this.adapters.keys().next().value;
    return firstKey ? this.adapters.get(firstKey) : undefined;
  }
}

/**
 * Standalone provider helper to configure Multi-Domain Enterprise BI.
 */
export function provideEnterpriseBi(
  adapters: (BiDomainAdapter | any)[] = []
): Provider[] {
  return [
    {
      provide: BI_DOMAIN_ADAPTERS,
      useValue: adapters,
    },
    {
      provide: BiToolRegistry,
      useFactory: () => {
        return new BiToolRegistry(adapters);
      },
    },
  ];
}
