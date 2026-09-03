import {
  MemoryCategory,
  MemoryItem,
  MemorySessionSummary,
  MemoryStats,
  MemoryExportBundle,
  MemoryImportOptions,
  MemoryImportResult,
} from './memory.types';

/**
 * Storage Engine Contract for WebMCP In-Browser Memory.
 * Provides unified CRUD, indexing, and session persistence across IndexedDB and In-Memory backends.
 */
export interface IWebMcpMemoryStore {
  /** The active storage engine backing this store instance */
  readonly engineType: 'indexeddb' | 'in-memory';

  /** Whether the storage engine is initialized and ready for operations */
  readonly isAvailable: boolean;

  /** Initialize the storage engine (e.g. open IndexedDB, build object stores) */
  init(): Promise<void>;

  /** Persist or update a memory item */
  save(item: MemoryItem): Promise<MemoryItem>;

  /** Retrieve a memory item by ID (increments accessCount and updates lastAccessedAt) */
  get(id: string): Promise<MemoryItem | null>;

  /** Retrieve a memory item by exact topic match */
  getByTopic(topic: string): Promise<MemoryItem | null>;

  /** Retrieve all memory items with optional category or pinned filtering */
  getAll(filter?: { category?: MemoryCategory; pinned?: boolean }): Promise<MemoryItem[]>;

  /** Delete a memory item by ID */
  delete(id: string): Promise<boolean>;

  /** Clear all stored memories and session summaries */
  clear(): Promise<void>;

  /** Update pinned status for a specific memory item */
  setPinned(id: string, pinned: boolean): Promise<MemoryItem | null>;

  /** Retrieve storage metrics, counts, and estimated byte size */
  getStats(): Promise<MemoryStats>;

  /** Save an episodic session summary */
  saveSessionSummary(summary: MemorySessionSummary): Promise<void>;

  /** Retrieve past session summaries sorted chronologically descending */
  getSessionSummaries(limit?: number): Promise<MemorySessionSummary[]>;

  /** Export knowledge base as portable JSON bundle */
  exportKnowledgeBase(filter?: { category?: MemoryCategory; tags?: string[] }): Promise<MemoryExportBundle>;

  /** Import knowledge base from portable JSON bundle with merge or replace strategy */
  importKnowledgeBase(bundle: MemoryExportBundle, options?: MemoryImportOptions): Promise<MemoryImportResult>;
}
