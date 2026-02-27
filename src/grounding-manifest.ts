/**
 * Grounding Manifest schema types.
 *
 * A Grounding Manifest records the external sources retrieved and queries
 * executed to ground AI-generated content in verifiable evidence.
 */

// ── Grounding Source Type ──

export const GroundingSourceType = {
  DOCUMENT: 'document',
  CODE: 'code',
  TICKET: 'ticket',
  API: 'api',
  CONVERSATION: 'conversation',
  WEB: 'web',
} as const;

export type GroundingSourceType = (typeof GroundingSourceType)[keyof typeof GroundingSourceType];

export function isGroundingSourceType(value: unknown): value is GroundingSourceType {
  return typeof value === 'string' && Object.values(GroundingSourceType).includes(value as GroundingSourceType);
}

// ── Retrieval Method ──

export const RetrievalMethod = {
  MANUAL: 'manual',
  AUTOMATED: 'automated',
  RAG: 'rag',
  SEARCH: 'search',
} as const;

export type RetrievalMethod = (typeof RetrievalMethod)[keyof typeof RetrievalMethod];

export function isRetrievalMethod(value: unknown): value is RetrievalMethod {
  return typeof value === 'string' && Object.values(RetrievalMethod).includes(value as RetrievalMethod);
}

// ── Grounding Source ──

export interface GroundingSource {
  source_id: string;
  source_type: GroundingSourceType;
  locator: string;
  retrieved_at: string;
  content_fingerprint: string;
  retrieval_method: RetrievalMethod;
  title?: string;
  snippet?: string;
  relevance_score?: number;
}

export function isGroundingSource(value: unknown): value is GroundingSource {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.source_id === 'string' &&
    isGroundingSourceType(obj.source_type) &&
    typeof obj.locator === 'string' &&
    typeof obj.retrieved_at === 'string' &&
    typeof obj.content_fingerprint === 'string' &&
    isRetrievalMethod(obj.retrieval_method) &&
    (obj.title === undefined || typeof obj.title === 'string') &&
    (obj.snippet === undefined || typeof obj.snippet === 'string') &&
    (obj.relevance_score === undefined || typeof obj.relevance_score === 'number')
  );
}

// ── Grounding Query ──

export interface GroundingQuery {
  query_text: string;
  executed_at: string;
  source_ids?: string[];
  result_count?: number;
}

export function isGroundingQuery(value: unknown): value is GroundingQuery {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.query_text !== 'string' || typeof obj.executed_at !== 'string') return false;
  if (obj.source_ids !== undefined) {
    if (!Array.isArray(obj.source_ids)) return false;
    for (const id of obj.source_ids as unknown[]) {
      if (typeof id !== 'string') return false;
    }
  }
  if (obj.result_count !== undefined && typeof obj.result_count !== 'number') return false;
  return true;
}

// ── Grounding Manifest ──

export interface GroundingManifest {
  manifest_id: string;
  created_at: string;
  sources: GroundingSource[];
  queries?: GroundingQuery[];
}

export function isGroundingManifest(value: unknown): value is GroundingManifest {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (
    typeof obj.manifest_id !== 'string' ||
    typeof obj.created_at !== 'string' ||
    !Array.isArray(obj.sources)
  ) return false;
  for (const s of obj.sources as unknown[]) {
    if (!isGroundingSource(s)) return false;
  }
  if (obj.queries !== undefined) {
    if (!Array.isArray(obj.queries)) return false;
    for (const q of obj.queries as unknown[]) {
      if (!isGroundingQuery(q)) return false;
    }
  }
  return true;
}
