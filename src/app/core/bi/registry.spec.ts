import { describe, it, expect } from 'bun:test';
import { Injector } from '@angular/core';
import { BiToolRegistry, BI_DOMAIN_ADAPTERS, provideEnterpriseBi } from './registry';
import type { BiDomainAdapter } from './bi.types';

describe('BiToolRegistry & DI Multi-Provider Resolution', () => {
  let registry: BiToolRegistry;

  const mockAdapterA: BiDomainAdapter = {
    domainId: 'domain_a',
    displayName: 'Domain Alpha',
    description: 'Alpha domain telemetry',
    queryRecords: () => [{ id: 'a1' }],
    filterRecords: (recs) => recs,
    calculateKpiSummary: () => ({
      domain: 'domain_a',
      totalRecords: 1,
      totalVolume: 100,
      healthScore: 90,
      keyMetrics: {},
      timestamp: new Date().toISOString(),
    }),
    formatExportData: () => ({
      success: true,
      exportId: 'exp-a',
      domain: 'domain_a',
      format: 'json',
      recordCount: 1,
      data: '[]',
      checksum: 'chk-a',
      generatedAt: new Date().toISOString(),
    }),
  };

  const mockAdapterB: BiDomainAdapter = {
    domainId: 'domain_b',
    displayName: 'Domain Beta',
    description: 'Beta domain telemetry',
    queryRecords: () => [{ id: 'b1' }, { id: 'b2' }],
    filterRecords: (recs) => recs,
    calculateKpiSummary: () => ({
      domain: 'domain_b',
      totalRecords: 2,
      totalVolume: 200,
      healthScore: 95,
      keyMetrics: {},
      timestamp: new Date().toISOString(),
    }),
    formatExportData: () => ({
      success: true,
      exportId: 'exp-b',
      domain: 'domain_b',
      format: 'csv',
      recordCount: 2,
      data: 'b1\nb2',
      checksum: 'chk-b',
      generatedAt: new Date().toISOString(),
    }),
  };

  it('should initialize with provided multi-token adapters', () => {
    registry = new BiToolRegistry([mockAdapterA, mockAdapterB]);
    expect(registry.getAvailableDomains()).toEqual(['domain_a', 'domain_b']);
    expect(registry.hasAdapter('domain_a')).toBe(true);
    expect(registry.hasAdapter('domain_b')).toBe(true);
    expect(registry.hasAdapter('unknown')).toBe(false);
  });

  it('should get adapter by domainId and return undefined for unknown domains', () => {
    registry = new BiToolRegistry([mockAdapterA]);
    const adapter = registry.getAdapter('domain_a');
    expect(adapter).toBe(mockAdapterA);
    expect(registry.getAdapter('nonexistent')).toBeUndefined();
  });

  it('should dynamically register and unregister domain adapters at runtime', () => {
    registry = new BiToolRegistry([]);
    expect(registry.getAvailableDomains().length).toBe(0);

    registry.registerAdapter(mockAdapterA);
    expect(registry.hasAdapter('domain_a')).toBe(true);
    expect(registry.getAvailableDomains()).toEqual(['domain_a']);

    registry.unregisterAdapter('domain_a');
    expect(registry.hasAdapter('domain_a')).toBe(false);
    expect(registry.getAvailableDomains().length).toBe(0);
  });

  it('should provide default adapter when queried or return first available', () => {
    registry = new BiToolRegistry([mockAdapterA, mockAdapterB]);
    expect(registry.getDefaultAdapter()?.domainId).toBe('domain_a');
  });

  it('should resolve through provideEnterpriseBi providers setup with Angular Injector', () => {
    const injector = Injector.create({
      providers: [
        provideEnterpriseBi([mockAdapterA, mockAdapterB]),
      ],
    });

    const resolvedRegistry = injector.get(BiToolRegistry);
    expect(resolvedRegistry).toBeDefined();
    expect(resolvedRegistry.getAvailableDomains()).toEqual(['domain_a', 'domain_b']);
    expect(resolvedRegistry.getAdapter('domain_a')?.displayName).toBe('Domain Alpha');
  });
});
