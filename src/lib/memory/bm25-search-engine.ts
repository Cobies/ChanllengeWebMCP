/**
 * WebMCP In-Browser Memory System - BM25 Lexical Search Engine
 * Pure TypeScript implementation of BM25 with Robertson-Spärck Jones IDF
 * and multilingual tokenization.
 * @cobies/webmcp-angular
 */

import {
  MemoryCategory,
  MemoryItem,
  MemoryQuery,
  MemorySearchResult,
  WebMcpMemoryConfig,
} from './memory.types';

export interface MemorySearchOptions {
  topK?: number;
  minScore?: number;
  category?: MemoryCategory | MemoryCategory[];
  pinnedOnly?: boolean;
  tags?: string[];
  dateRange?: {
    start?: number;
    end?: number;
  };
}

export interface IWebMcpMemorySearchEngine {
  readonly size: number;
  index(itemOrItems: MemoryItem | MemoryItem[]): void;
  addDocument(item: MemoryItem): void;
  updateDocument(item: MemoryItem): void;
  removeDocument(id: string): void;
  remove(id: string): void;
  rebuild(items: MemoryItem[]): void;
  search(
    query: string | MemoryQuery,
    itemsOrOptions?: MemoryItem[] | MemorySearchOptions,
    options?: MemorySearchOptions
  ): MemorySearchResult[];
  clear(): void;
  getDocCount(): number;
  getAvgDocLength(): number;
}

export interface Bm25EngineConfig {
  k1?: number;
  b?: number;
  minScore?: number;
  topK?: number;
  stopwords?: Set<string> | string[];
}

/**
 * Common English and Spanish stopword vocabulary for lexical pruning.
 */
export const STOP_WORDS = new Set<string>([
  // English common stopwords
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'if', 'in', 'into', 'is', 'isn', 'it', 'its', 'itself', 'let', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'wasn', 'we', 'were', 'weren', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves',

  // Spanish common stopwords
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con',
  'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'mas', 'pero', 'sus', 'le', 'ya', 'o', 'este',
  'sí', 'si', 'porque', 'esta', 'son', 'entre', 'está', 'cuando', 'muy', 'sin', 'sobre', 'ser',
  'tiene', 'también', 'tambien', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos',
  'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e',
  'esto', 'mí', 'mi', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él',
  'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'cuál', 'sea', 'poco',
  'ella', 'estar', 'haber', 'estas', 'estaba', 'estamos', 'algunas', 'algo', 'nosotros',
]);

/**
 * Multilingual Unicode NFKC tokenizer with punctuation stripping,
 * length filtering (>= 2 or numeric), and stopword elimination.
 */
export function tokenize(text: string, filterStopwords = true, customStopwords = STOP_WORDS): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // 1. Unicode NFKC normalization and lowercasing
  const normalized = text.normalize('NFKC').toLowerCase();

  // 2. Word boundary segmentation across Unicode letters and numbers
  const rawTokens = normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

  const tokens: string[] = [];
  for (const raw of rawTokens) {
    const isNumeric = /^\p{N}+$/u.test(raw);
    // Keep tokens >= 2 chars, or single digit numbers
    if (raw.length < 2 && !isNumeric) {
      continue;
    }

    if (filterStopwords && customStopwords.has(raw)) {
      continue;
    }

    tokens.push(raw);
  }

  return tokens;
}

/**
 * Field weight constants for relevance boosting
 */
const FIELD_WEIGHTS = {
  TOPIC: 2.0,
  TAGS: 1.5,
  CONTENT: 1.0,
};

/**
 * High-performance, zero-dependency BM25 Lexical Search Engine
 * featuring Robertson-Spärck Jones IDF and incremental inverted index maintenance.
 */
export class WebMcpBm25SearchEngine implements IWebMcpMemorySearchEngine {
  private readonly k1: number;
  private readonly b: number;
  private readonly defaultMinScore: number;
  private readonly defaultTopK: number;
  private readonly stopwords: Set<string>;

  // Internal index data structures
  private readonly documents = new Map<string, MemoryItem>();
  private readonly docLengths = new Map<string, number>();
  private readonly invertedIndex = new Map<string, Map<string, number>>();
  private readonly docTerms = new Map<string, Set<string>>();
  private totalDocLength = 0;

  constructor(config?: Bm25EngineConfig | WebMcpMemoryConfig) {
    const k1Val = (config as Bm25EngineConfig)?.k1 ?? (config as WebMcpMemoryConfig)?.bm25_k1 ?? 1.5;
    const bVal = (config as Bm25EngineConfig)?.b ?? (config as WebMcpMemoryConfig)?.bm25_b ?? 0.75;

    this.k1 = k1Val;
    this.b = bVal;
    this.defaultMinScore = (config as Bm25EngineConfig)?.minScore ?? 0.1;
    this.defaultTopK = (config as Bm25EngineConfig)?.topK ?? 10;

    const customStops = (config as Bm25EngineConfig)?.stopwords;
    if (customStops) {
      this.stopwords = customStops instanceof Set ? customStops : new Set(customStops);
    } else {
      this.stopwords = STOP_WORDS;
    }
  }

  /**
   * Total number of currently indexed documents.
   */
  get size(): number {
    return this.documents.size;
  }

  /**
   * Returns count of indexed documents.
   */
  getDocCount(): number {
    return this.documents.size;
  }

  /**
   * Returns average weighted document length across corpus.
   */
  getAvgDocLength(): number {
    if (this.documents.size === 0) return 0;
    return this.totalDocLength / this.documents.size;
  }

  /**
   * Index single document or collection of documents.
   */
  index(itemOrItems: MemoryItem | MemoryItem[]): void {
    if (Array.isArray(itemOrItems)) {
      for (const item of itemOrItems) {
        this.addDocument(item);
      }
    } else if (itemOrItems) {
      this.addDocument(itemOrItems);
    }
  }

  /**
   * Add a single document to the inverted index with field weighting.
   */
  addDocument(item: MemoryItem): void {
    if (!item || !item.id) return;

    // Ensure idempotency: remove existing if present
    if (this.documents.has(item.id)) {
      this.removeDocument(item.id);
    }

    const topicTokens = tokenize(item.topic ?? '', true, this.stopwords);
    const tagsTokens = tokenize(Array.isArray(item.tags) ? item.tags.join(' ') : '', true, this.stopwords);
    const contentTokens = tokenize(item.content ?? '', true, this.stopwords);

    const termFreqs = new Map<string, number>();

    // Topic weighting (2.0x)
    for (const token of topicTokens) {
      termFreqs.set(token, (termFreqs.get(token) ?? 0) + FIELD_WEIGHTS.TOPIC);
    }

    // Tags weighting (1.5x)
    for (const token of tagsTokens) {
      termFreqs.set(token, (termFreqs.get(token) ?? 0) + FIELD_WEIGHTS.TAGS);
    }

    // Content weighting (1.0x)
    for (const token of contentTokens) {
      termFreqs.set(token, (termFreqs.get(token) ?? 0) + FIELD_WEIGHTS.CONTENT);
    }

    const weightedLength =
      topicTokens.length * FIELD_WEIGHTS.TOPIC +
      tagsTokens.length * FIELD_WEIGHTS.TAGS +
      contentTokens.length * FIELD_WEIGHTS.CONTENT;

    this.documents.set(item.id, item);
    this.docLengths.set(item.id, weightedLength);
    this.totalDocLength += weightedLength;

    const termsInDoc = new Set<string>();

    for (const [term, freq] of termFreqs.entries()) {
      let postings = this.invertedIndex.get(term);
      if (!postings) {
        postings = new Map<string, number>();
        this.invertedIndex.set(term, postings);
      }
      postings.set(item.id, freq);
      termsInDoc.add(term);
    }

    this.docTerms.set(item.id, termsInDoc);
  }

  /**
   * Update an existing document in the inverted index.
   */
  updateDocument(item: MemoryItem): void {
    this.addDocument(item);
  }

  /**
   * Remove a document by ID and incrementally adjust index postings and lengths.
   */
  removeDocument(id: string): void {
    if (!this.documents.has(id)) {
      return;
    }

    const docLen = this.docLengths.get(id) ?? 0;
    this.totalDocLength -= docLen;
    this.docLengths.delete(id);
    this.documents.delete(id);

    const terms = this.docTerms.get(id);
    if (terms) {
      for (const term of terms) {
        const postings = this.invertedIndex.get(term);
        if (postings) {
          postings.delete(id);
          if (postings.size === 0) {
            this.invertedIndex.delete(term);
          }
        }
      }
      this.docTerms.delete(id);
    }
  }

  /**
   * Alias for removeDocument.
   */
  remove(id: string): void {
    this.removeDocument(id);
  }

  /**
   * Clear and rebuild index from an item collection.
   */
  rebuild(items: MemoryItem[]): void {
    this.clear();
    for (const item of items) {
      this.addDocument(item);
    }
  }

  /**
   * Clears the internal inverted index.
   */
  clear(): void {
    this.documents.clear();
    this.docLengths.clear();
    this.invertedIndex.clear();
    this.docTerms.clear();
    this.totalDocLength = 0;
  }

  /**
   * Execute BM25 ranked search against indexed documents or transient external items.
   */
  search(
    query: string | MemoryQuery,
    itemsOrOptions?: MemoryItem[] | MemorySearchOptions,
    options?: MemorySearchOptions
  ): MemorySearchResult[] {
    // 1. Resolve transient external items execution if passed
    if (Array.isArray(itemsOrOptions)) {
      const transientEngine = new WebMcpBm25SearchEngine({
        k1: this.k1,
        b: this.b,
        minScore: options?.minScore ?? this.defaultMinScore,
        topK: options?.topK ?? this.defaultTopK,
        stopwords: this.stopwords,
      });
      transientEngine.rebuild(itemsOrOptions);
      return transientEngine.search(query, undefined, options);
    }

    // 2. Parse Query and Options
    let queryString = '';
    let searchOptions: MemorySearchOptions = {};

    if (typeof query === 'string') {
      queryString = query;
      if (itemsOrOptions && typeof itemsOrOptions === 'object') {
        searchOptions = { ...itemsOrOptions };
      }
      if (options) {
        searchOptions = { ...searchOptions, ...options };
      }
    } else if (query && typeof query === 'object') {
      queryString = query.query ?? '';
      searchOptions = {
        category: query.category,
        tags: query.tags,
        pinnedOnly: query.pinnedOnly,
        topK: query.topK,
        minScore: query.minScore,
        dateRange: query.dateRange,
        ...(itemsOrOptions && typeof itemsOrOptions === 'object' ? itemsOrOptions : {}),
        ...options,
      };
    }

    if (!queryString || typeof queryString !== 'string') {
      return [];
    }

    const queryTokens = tokenize(queryString, true, this.stopwords);
    if (queryTokens.length === 0) {
      return [];
    }

    const uniqueQueryTokens = Array.from(new Set(queryTokens));
    const N = this.documents.size;
    if (N === 0) {
      return [];
    }

    const avgdl = this.getAvgDocLength() || 1;
    const minScore = searchOptions.minScore ?? this.defaultMinScore;
    const topK = searchOptions.topK ?? this.defaultTopK;

    const scoredResults: MemorySearchResult[] = [];

    // 3. Evaluate each document against query tokens with active filters
    for (const [id, doc] of this.documents.entries()) {
      // Filter: Category
      if (searchOptions.category) {
        if (Array.isArray(searchOptions.category)) {
          if (!searchOptions.category.includes(doc.category)) {
            continue;
          }
        } else if (doc.category !== searchOptions.category) {
          continue;
        }
      }

      // Filter: Pinned Only
      if (searchOptions.pinnedOnly && !doc.pinned) {
        continue;
      }

      // Filter: Tags (matches if any requested tag is present in doc tags)
      if (searchOptions.tags && searchOptions.tags.length > 0) {
        const docTags = (doc.tags || []).map((t) => t.toLowerCase());
        const hasTagMatch = searchOptions.tags.some((t) => docTags.includes(t.toLowerCase()));
        if (!hasTagMatch) {
          continue;
        }
      }

      // Filter: Date Range
      if (searchOptions.dateRange) {
        const itemTime = doc.createdAt ?? 0;
        if (searchOptions.dateRange.start !== undefined && itemTime < searchOptions.dateRange.start) {
          continue;
        }
        if (searchOptions.dateRange.end !== undefined && itemTime > searchOptions.dateRange.end) {
          continue;
        }
      }

      // 4. Calculate BM25 score
      const docLen = this.docLengths.get(id) ?? 0;
      const K = this.k1 * (1 - this.b + this.b * (docLen / avgdl));
      let docScore = 0;
      const matchedTerms: string[] = [];

      for (const token of uniqueQueryTokens) {
        const postings = this.invertedIndex.get(token);
        if (!postings) continue;

        const tf = postings.get(id);
        if (tf !== undefined && tf > 0) {
          const n_q = postings.size;
          // Robertson-Spärck Jones IDF: ln(1 + (N - n(q) + 0.5) / (n(q) + 0.5))
          const idf = Math.log(1 + (N - n_q + 0.5) / (n_q + 0.5));
          const safeIdf = idf > 0 ? idf : 0;

          // BM25 term frequency saturation
          const termScore = safeIdf * ((tf * (this.k1 + 1)) / (tf + K));
          docScore += termScore;
          matchedTerms.push(token);
        }
      }

      // 5. Threshold checking
      if (matchedTerms.length > 0 && docScore >= minScore) {
        scoredResults.push({
          item: doc,
          score: Number(docScore.toFixed(4)),
          matchedTerms,
        });
      }
    }

    // 6. Sort descending by score, with secondary tie-break on updatedAt
    scoredResults.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.00001) {
        return b.score - a.score;
      }
      return (b.item.updatedAt ?? 0) - (a.item.updatedAt ?? 0);
    });

    // 7. Return top-K items
    return scoredResults.slice(0, topK);
  }
}

/**
 * Standard alias conforming to specification naming.
 */
export class WebMcpMemorySearchEngine extends WebMcpBm25SearchEngine {}
