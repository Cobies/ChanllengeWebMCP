/**
 * WebMCP In-Browser Memory System - Domain Types & Data Contracts
 * @cobies/webmcp-angular
 */

export type MemoryCategory =
  | 'observation'
  | 'fact'
  | 'rule'
  | 'context'
  | 'preference'
  | 'session';

export interface MemoryItem {
  id: string;
  topic: string;
  content: string;
  category: MemoryCategory;
  tags: string[];
  pinned: boolean;
  createdAt: number; // Unix timestamp ms
  updatedAt: number; // Unix timestamp ms
  lastAccessedAt: number; // Unix timestamp ms
  accessCount: number;
  metadata?: Record<string, unknown>;
}

export interface MemoryQuery {
  query: string;
  category?: MemoryCategory | MemoryCategory[];
  tags?: string[];
  pinnedOnly?: boolean;
  topK?: number; // Default: 10
  minScore?: number; // Default: 0.1
  dateRange?: {
    start?: number;
    end?: number;
  };
}

export interface MemorySearchResult {
  item: MemoryItem;
  score: number; // BM25 relevance score
  matchedTerms: string[];
}

export interface MemoryStats {
  totalCount: number;
  pinnedCount: number;
  categoryCounts: Record<MemoryCategory, number>;
  estimatedStorageBytes: number;
  engineType: 'indexeddb' | 'in-memory';
}

export interface MemorySessionSummary {
  sessionId: string;
  sessionName?: string;
  timestamp: number;
  summary: string;
  topicsCovered: string[];
  keyLearnings: string[];
  toolsUsedCount: Record<string, number>;
  metadata?: Record<string, unknown>;
}

export interface WebMcpMemoryConfig {
  dbName?: string; // Default: 'webmcp_memory_db'
  dbVersion?: number; // Default: 1
  bm25_k1?: number; // Term frequency saturation (Default: 1.2)
  bm25_b?: number; // Document length normalization (Default: 0.75)
  enablePassiveToolCapture?: boolean; // Default: true
  enableNavigationCapture?: boolean; // Default: true
  maxMemories?: number; // Max records before LRU pruning of unpinned items (Default: 10000)
  autoRegisterTools?: boolean; // Default: true
}

export interface MemoryExportMetadata {
  exportedAt: number;
  schemaVersion: '1.0';
  totalCount: number;
  source?: string;
  tags?: string[];
  description?: string;
  custom?: Record<string, unknown>;
}

export interface MemoryExportBundle {
  version: '1.0';
  metadata: MemoryExportMetadata;
  memories: MemoryItem[];
  sessions?: MemorySessionSummary[];
}

export type MemoryImportMode = 'merge' | 'replace';

export interface MemoryImportOptions {
  mode?: MemoryImportMode;
  preserveTimestamps?: boolean;
}

export interface MemoryImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
  totalBefore: number;
  totalAfter: number;
}
