import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { WebMcpMemoryService } from './memory.service';
import { WebMcpInMemoryStore } from './in-memory-store';
import { WebMcpBm25SearchEngine } from './bm25-search-engine';

describe('WebMcpMemoryService (Aliased import test)', () => {
  let store: WebMcpInMemoryStore;
  let searchEngine: WebMcpBm25SearchEngine;
  let memoryService: WebMcpMemoryService;

  beforeEach(async () => {
    store = new WebMcpInMemoryStore();
    searchEngine = new WebMcpBm25SearchEngine();
    memoryService = new WebMcpMemoryService({}, store, searchEngine);
    await memoryService.init();
  });

  it('should instantiate and operate correctly through memory.service alias', async () => {
    expect(memoryService.isReady()).toBe(true);

    const item = await memoryService.save({
      topic: 'alias/test',
      content: 'Testing aliased import path',
    });

    expect(item.id).toBeDefined();
    expect(memoryService.memories().length).toBe(1);
  });
});
