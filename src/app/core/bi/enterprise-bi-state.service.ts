import { Injectable, signal, computed, inject, Optional } from '@angular/core';
import { BiToolRegistry } from './registry';
import type {
  BiDomainAdapter,
  BiFilterCriteria,
  BiKpiSummary,
  BiQueryParams,
  BiExportResult,
  BiExportFormat,
} from './bi.types';

@Injectable({
  providedIn: 'root',
})
export class EnterpriseBiStateService {
  private readonly registry: BiToolRegistry;

  // --- Core State Signals ---
  readonly activeDomain = signal<string>('supply_chain');
  readonly filterCriteria = signal<BiFilterCriteria>({});
  readonly records = signal<any[]>([]);
  readonly isExecuting = signal<boolean>(false);
  readonly errorState = signal<string | null>(null);
  readonly lastExecutionMessage = signal<string | null>(null);

  // --- Derived Computed Signals ---
  readonly activeAdapter = computed<BiDomainAdapter | undefined>(() => {
    const domain = this.activeDomain();
    return this.registry.getAdapter(domain) || this.registry.getDefaultAdapter();
  });

  readonly availableDomains = computed<string[]>(() => {
    return this.registry.getAvailableDomains();
  });

  readonly filteredRecords = computed<any[]>(() => {
    const adapter = this.activeAdapter();
    const rawRecords = this.records();
    const criteria = this.filterCriteria();

    if (!adapter) return rawRecords;
    return adapter.filterRecords(rawRecords, criteria);
  });

  readonly kpiSummary = computed<BiKpiSummary | null>(() => {
    const adapter = this.activeAdapter();
    const records = this.filteredRecords();

    if (!adapter) return null;
    const res = adapter.calculateKpiSummary(records);
    // If returned as promise in some case, handle synchronous value
    return res instanceof Promise ? null : res;
  });

  constructor(@Optional() registry?: BiToolRegistry) {
    this.registry = registry || inject(BiToolRegistry);

    const defaultAdapter = this.registry.getDefaultAdapter();
    if (defaultAdapter) {
      this.activeDomain.set(defaultAdapter.domainId);
    }
  }

  /**
   * Initialize state with records from default or active adapter.
   */
  async initialize(): Promise<void> {
    await this.loadRecordsForDomain(this.activeDomain());
  }

  /**
   * Switch the active business domain and load corresponding dataset.
   */
  async setActiveDomain(domainId: string): Promise<void> {
    if (!this.registry.hasAdapter(domainId)) {
      this.errorState.set(`Unknown domain adapter: ${domainId}`);
      return;
    }

    this.activeDomain.set(domainId);
    this.filterCriteria.set({});
    await this.loadRecordsForDomain(domainId);
  }

  /**
   * Set entire filter criteria object.
   */
  setFilterCriteria(criteria: Partial<BiFilterCriteria>): void {
    this.filterCriteria.update((prev) => ({
      ...prev,
      ...criteria,
    }));
  }

  /**
   * Update search term filter helper.
   */
  updateSearchTerm(term: string): void {
    this.filterCriteria.update((prev) => ({
      ...prev,
      searchTerm: term,
    }));
  }

  /**
   * Reset filter criteria to empty state.
   */
  resetFilters(): void {
    this.filterCriteria.set({});
  }

  /**
   * Execute query with parameters against the active domain adapter.
   */
  async executeQuery(params?: BiQueryParams): Promise<any[]> {
    this.isExecuting.set(true);
    this.errorState.set(null);

    try {
      const adapter = this.activeAdapter();
      if (!adapter) {
        throw new Error(`No adapter found for domain: ${this.activeDomain()}`);
      }

      const results = await Promise.resolve(adapter.queryRecords(params));
      this.records.set(results);
      if (params) {
        this.setFilterCriteria(params);
      }
      return results;
    } catch (err: any) {
      const msg = err?.message || 'Query execution failed';
      this.errorState.set(msg);
      throw err;
    } finally {
      this.isExecuting.set(false);
    }
  }

  /**
   * Trigger export formatting on filtered records.
   */
  async exportData(format: BiExportFormat = 'json'): Promise<BiExportResult> {
    const adapter = this.activeAdapter();
    if (!adapter) {
      throw new Error(`No adapter found for domain: ${this.activeDomain()}`);
    }

    const records = this.filteredRecords();
    return Promise.resolve(adapter.formatExportData(records, format));
  }

  private async loadRecordsForDomain(domainId: string): Promise<void> {
    const adapter = this.registry.getAdapter(domainId);
    if (!adapter) return;

    this.isExecuting.set(true);
    try {
      const raw = await Promise.resolve(adapter.queryRecords());
      this.records.set(raw);
    } catch (err: any) {
      this.errorState.set(err?.message || 'Failed to load domain records');
    } finally {
      this.isExecuting.set(false);
    }
  }
}
