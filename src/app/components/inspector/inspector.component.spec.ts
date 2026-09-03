import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'bun:test';
import { signal } from '@angular/core';
import { InspectorComponent } from './inspector.component';
import {
  WebMcpService,
  WebMcpMemoryService,
  WebMcpInMemoryStore,
  WebMcpBm25SearchEngine,
  MemoryItem,
} from '@webmcp/angular';

describe('InspectorComponent (WebMCP Live Inspector & Memory Store UI)', () => {
  let mockWebmcp: any;
  let memoryService: WebMcpMemoryService;
  let inMemoryStore: WebMcpInMemoryStore;
  let searchEngine: WebMcpBm25SearchEngine;
  let inspector: InspectorComponent;

  beforeEach(async () => {
    mockWebmcp = {
      executionLogs: signal([
        {
          id: 'log_1',
          toolName: 'calculate_kpi_summary',
          parameters: { domain: 'cloud_finops' },
          result: { healthScore: 92 },
          timestamp: 1714500000123,
          durationMs: 14,
          source: 'ai-agent',
        },
      ]),
      clearLogs: () => {
        mockWebmcp.executionLogs.set([]);
      },
    };

    inMemoryStore = new WebMcpInMemoryStore({ maxMemories: 100 });
    searchEngine = new WebMcpBm25SearchEngine();
    memoryService = new WebMcpMemoryService(
      { dbName: 'test_db', autoRegisterTools: false },
      inMemoryStore,
      searchEngine
    );
    await memoryService.init();

    inspector = new InspectorComponent(mockWebmcp as any, undefined, memoryService);
  });

  describe('Tab Switching', () => {
    it('should initialize with default activeTab "logs"', () => {
      expect(inspector.activeTab()).toBe('logs');
    });

    it('should switch between "logs" and "memory" tabs', () => {
      inspector.setTab('memory');
      expect(inspector.activeTab()).toBe('memory');

      inspector.setTab('logs');
      expect(inspector.activeTab()).toBe('logs');
    });
  });

  describe('Live Logs Inspection', () => {
    it('should safely serialize and truncate large base64 image data strings', () => {
      const maliciousOrHugePayload = {
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk',
        prompt: '<script>alert("xss")</script>',
      };

      const formatted = inspector.safeJsonStringify(maliciousOrHugePayload);
      expect(formatted).toContain('[base64 image payload truncated:');
      expect(formatted).toContain('<script>alert(\\"xss\\")</script>');
    });

    it('should format timestamp milliseconds correctly', () => {
      const timestamp = 1714500000123;
      const formatted = inspector.formatTime(timestamp);
      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}\.123/);
    });

    it('should handle null, undefined, and non-object inputs in safeJsonStringify', () => {
      expect(inspector.safeJsonStringify(null)).toBe('null');
      expect(inspector.safeJsonStringify(undefined)).toBe('null');
      expect(inspector.safeJsonStringify('plain-string')).toBe('"plain-string"');
    });
  });

  describe('Memory Store & Telemetry Stats', () => {
    it('should render reactive memory stats and category breakdown', async () => {
      await memoryService.save({
        topic: 'system_prompt',
        category: 'rule',
        content: 'Never disclose sensitive keys',
        pinned: true,
      });

      await memoryService.save({
        topic: 'user_theme',
        category: 'preference',
        content: 'Dark mode preferred',
        pinned: false,
      });

      await memoryService.save({
        topic: 'sales_forecast',
        category: 'fact',
        content: 'Q3 pipeline exceeds target by 14%',
        pinned: false,
      });

      const stats = inspector.stats();
      expect(stats.totalCount).toBe(3);
      expect(stats.pinnedCount).toBe(1);
      expect(stats.categoryCounts.rule).toBe(1);
      expect(stats.categoryCounts.preference).toBe(1);
      expect(stats.categoryCounts.fact).toBe(1);
      expect(inspector.memories().length).toBe(3);
    });

    it('should filter memories by selectedCategory signal', async () => {
      await memoryService.save({
        topic: 'rule_1',
        category: 'rule',
        content: 'Must validate inputs',
      });
      await memoryService.save({
        topic: 'fact_1',
        category: 'fact',
        content: 'PostgreSQL version 16 in use',
      });

      inspector.setCategoryFilter('rule');
      expect(inspector.selectedCategory()).toBe('rule');
      const filtered = inspector.displayedMemories();
      expect(filtered.length).toBe(1);
      expect(filtered[0].topic).toBe('rule_1');

      inspector.setCategoryFilter('all');
      expect(inspector.displayedMemories().length).toBe(2);
    });
  });

  describe('BM25 Lexical Search in Inspector', () => {
    beforeEach(async () => {
      await memoryService.save({
        topic: 'security_policy',
        category: 'rule',
        content: 'OAuth2 bearer tokens require HTTPS encryption in all headers',
        tags: ['security', 'auth', 'http'],
      });
      await memoryService.save({
        topic: 'database_replica',
        category: 'fact',
        content: 'Read replica located in us-west-2 region',
        tags: ['infrastructure', 'database'],
      });
      await memoryService.save({
        topic: 'theme_settings',
        category: 'preference',
        content: 'User prefers high contrast purple accents in UI',
        tags: ['theme', 'ui'],
      });
    });

    it('should execute real-time BM25 search queries and populate searchResults', async () => {
      await inspector.onSearchQueryChange('encryption OAuth2');
      expect(inspector.isSearching()).toBe(true);
      expect(inspector.searchResults().length).toBeGreaterThan(0);
      expect(inspector.searchResults()[0].item.topic).toBe('security_policy');
      expect(inspector.searchResults()[0].score).toBeGreaterThan(0);
    });

    it('should clear search results when search query is emptied', async () => {
      await inspector.onSearchQueryChange('encryption');
      expect(inspector.isSearching()).toBe(true);
      expect(inspector.searchResults().length).toBe(1);

      await inspector.onSearchQueryChange('');
      expect(inspector.isSearching()).toBe(false);
      expect(inspector.searchResults().length).toBe(0);
      expect(inspector.displayedMemories().length).toBe(3);
    });
  });

  describe('Memory Card Pin, Unpin & Delete Actions', () => {
    let savedItem: MemoryItem;

    beforeEach(async () => {
      savedItem = await memoryService.save({
        topic: 'api_rate_limit',
        category: 'rule',
        content: 'Maximum 100 requests per second',
        pinned: false,
      });
    });

    it('should toggle pin state from false to true and true to false', async () => {
      expect(savedItem.pinned).toBe(false);

      await inspector.togglePin(savedItem);
      let updated = await inMemoryStore.get(savedItem.id);
      expect(updated?.pinned).toBe(true);

      if (updated) {
        await inspector.togglePin(updated);
        updated = await inMemoryStore.get(savedItem.id);
        expect(updated?.pinned).toBe(false);
      }
    });

    it('should delete memory item by id and update view reactively', async () => {
      expect(inspector.memories().length).toBe(1);

      const deleted = await inspector.deleteMemory(savedItem.id);
      expect(deleted).toBe(true);
      expect(inspector.memories().length).toBe(0);
      expect(await inMemoryStore.get(savedItem.id)).toBeNull();
    });

    it('should clear all memories when clearAllMemories is invoked', async () => {
      await memoryService.save({ topic: 'item2', content: 'content2' });
      expect(inspector.memories().length).toBe(2);

      await inspector.clearAllMemories();
      expect(inspector.memories().length).toBe(0);
      expect(inspector.stats().totalCount).toBe(0);
    });
  });

  describe('Add Memory Manual Injection Form', () => {
    it('should toggle add memory form visibility', () => {
      expect(inspector.showAddForm()).toBe(false);
      inspector.toggleAddForm();
      expect(inspector.showAddForm()).toBe(true);
      inspector.toggleAddForm();
      expect(inspector.showAddForm()).toBe(false);
    });

    it('should validate and save new memory item from form fields', async () => {
      inspector.toggleAddForm();
      inspector.newTopic.set('cache_ttl_policy');
      inspector.newCategory.set('rule');
      inspector.newContent.set('Cache static assets for 86400 seconds');
      inspector.newTags.set('cache, performance, cdn');
      inspector.newPinned.set(true);

      const saved = await inspector.saveNewMemory();
      expect(saved).toBeDefined();
      expect(saved?.topic).toBe('cache_ttl_policy');
      expect(saved?.category).toBe('rule');
      expect(saved?.content).toBe('Cache static assets for 86400 seconds');
      expect(saved?.tags).toEqual(['cache', 'performance', 'cdn']);
      expect(saved?.pinned).toBe(true);

      // Form should reset and close
      expect(inspector.showAddForm()).toBe(false);
      expect(inspector.newTopic()).toBe('');
      expect(inspector.newContent()).toBe('');
      expect(inspector.newTags()).toBe('');
      expect(inspector.newPinned()).toBe(false);
      expect(inspector.memories().length).toBe(1);
    });

    it('should reject saving memory with empty topic or content', async () => {
      inspector.newTopic.set('   ');
      inspector.newContent.set('');
      const saved = await inspector.saveNewMemory();
      expect(saved).toBeNull();
      expect(inspector.memories().length).toBe(0);
    });
  });

  describe('XSS & Security Hardening (Threat Matrix)', () => {
    it('should safely store and sanitize HTML and XSS payloads in memory content', async () => {
      const xssTopic = '<img src=x onerror=alert("xss")>';
      const xssContent = '<script>window.location="https://malicious.com"</script><b>bold injection</b>';
      const xssTags = ['<svg onload=alert(1)>', 'security'];

      const saved = await memoryService.save({
        topic: xssTopic,
        category: 'observation',
        content: xssContent,
        tags: xssTags,
      });

      expect(saved.topic).toBe(xssTopic);
      expect(saved.content).toBe(xssContent);
      expect(saved.tags).toEqual(xssTags);

      // Verify category color helper handles edge cases safely
      expect(inspector.getCategoryBadgeClass('rule')).toContain('purple');
      expect(inspector.getCategoryBadgeClass('fact')).toContain('blue');
      expect(inspector.getCategoryBadgeClass('observation')).toContain('emerald');
      expect(inspector.getCategoryBadgeClass('context')).toContain('amber');
      expect(inspector.getCategoryBadgeClass('preference')).toContain('pink');
      expect(inspector.getCategoryBadgeClass('session')).toContain('slate');
      expect(inspector.getCategoryBadgeClass('unknown_category' as any)).toContain('slate');
    });
  });

  describe('Knowledge Base Export & Import UI Actions', () => {
    it('should trigger export and set positive status feedback', async () => {
      await memoryService.save({
        topic: 'export_test',
        content: 'Export payload testing',
        category: 'rule',
      });

      const origWindow = (globalThis as any).window;
      const origDoc = (globalThis as any).document;
      const origURL = (globalThis as any).URL;

      try {
        let downloadTriggered = false;
        (globalThis as any).window = globalThis;
        (globalThis as any).document = {
          createElement: () => ({
            href: '',
            download: '',
            click: () => {
              downloadTriggered = true;
            },
          }),
          body: {
            appendChild: () => {},
            removeChild: () => {},
          },
        };
        (globalThis as any).URL = {
          createObjectURL: () => 'blob:mock',
          revokeObjectURL: () => {},
        };

        await inspector.exportKnowledgeBase('test-export.json');
        expect(downloadTriggered).toBe(true);

        const feedback = inspector.statusFeedback();
        expect(feedback).not.toBeNull();
        expect(feedback?.type).toBe('success');
        expect(feedback?.message).toContain('exported successfully');

        // Test manual clear of feedback
        inspector.clearFeedback();
        expect(inspector.statusFeedback()).toBeNull();
      } finally {
        if (origWindow === undefined) {
          delete (globalThis as any).window;
        } else {
          (globalThis as any).window = origWindow;
        }
        if (origDoc === undefined) {
          delete (globalThis as any).document;
        } else {
          (globalThis as any).document = origDoc;
        }
        if (origURL === undefined) {
          delete (globalThis as any).URL;
        } else {
          (globalThis as any).URL = origURL;
        }
      }
    });

    it('should import knowledge base from JSON and update statusFeedback signal', async () => {
      const bundleJson = JSON.stringify({
        version: '1.0',
        metadata: {
          exportedAt: Date.now(),
          schemaVersion: '1.0',
          totalCount: 1,
        },
        memories: [
          {
            id: 'imported_ui_mem',
            topic: 'imported_ui_topic',
            content: 'Successfully imported from UI action',
            category: 'rule',
            tags: ['ui', 'import'],
            pinned: true,
            createdAt: 1000,
            updatedAt: 1000,
            lastAccessedAt: 1000,
            accessCount: 0,
          },
        ],
      });

      const result = await inspector.importKnowledgeBaseFromJson(bundleJson);
      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);

      const feedback = inspector.statusFeedback();
      expect(feedback).not.toBeNull();
      expect(feedback?.type).toBe('success');
      expect(feedback?.message).toContain('Imported 1 memories successfully');

      expect(inspector.memories().length).toBe(1);
      expect(inspector.memories()[0].topic).toBe('imported_ui_topic');
    });

    it('should display error feedback when imported JSON is malformed', async () => {
      const result = await inspector.importKnowledgeBaseFromJson('{ invalid json');
      expect(result.success).toBe(false);

      const feedback = inspector.statusFeedback();
      expect(feedback).not.toBeNull();
      expect(feedback?.type).toBe('error');
      expect(feedback?.message).toContain('Import failed');
    });

    it('should handle onFileSelected event with valid JSON file', async () => {
      const validJson = JSON.stringify({
        version: '1.0',
        metadata: { exportedAt: 100, schemaVersion: '1.0', totalCount: 1 },
        memories: [
          {
            id: 'file_mem',
            topic: 'file_topic',
            content: 'File content',
            category: 'observation',
            tags: [],
            pinned: false,
            createdAt: 100,
            updatedAt: 100,
            lastAccessedAt: 100,
            accessCount: 0,
          },
        ],
      });

      const mockFile = {
        name: 'test.json',
        text: async () => validJson,
      };

      const mockInput = {
        files: [mockFile],
        value: 'C:\fakepath\test.json',
      };

      const mockEvent = {
        target: mockInput,
      } as unknown as Event;

      await inspector.onFileSelected(mockEvent);

      expect(mockInput.value).toBe('');
      const feedback = inspector.statusFeedback();
      expect(feedback?.type).toBe('success');
      expect(inspector.memories().some((m) => m.topic === 'file_topic')).toBe(true);
    });
  });

});
