import { describe, it, expect } from 'vitest';
import {
  GroundingSourceType,
  isGroundingSourceType,
  RetrievalMethod,
  isRetrievalMethod,
  isGroundingSource,
  isGroundingQuery,
  isGroundingManifest,
} from '../src/grounding-manifest';

import type {
  GroundingSource,
  GroundingQuery,
  GroundingManifest,
} from '../src/grounding-manifest';

// ── Enum uniqueness ──

describe('grounding-manifest enums', () => {
  it('GroundingSourceType has no duplicate values', () => {
    const values = Object.values(GroundingSourceType);
    expect(new Set(values).size).toBe(values.length);
  });

  it('GroundingSourceType values are all strings', () => {
    for (const val of Object.values(GroundingSourceType)) {
      expect(typeof val).toBe('string');
    }
  });

  it('RetrievalMethod has no duplicate values', () => {
    const values = Object.values(RetrievalMethod);
    expect(new Set(values).size).toBe(values.length);
  });

  it('RetrievalMethod values are all strings', () => {
    for (const val of Object.values(RetrievalMethod)) {
      expect(typeof val).toBe('string');
    }
  });
});

// ── Enum type guards ──

describe('enum type guards', () => {
  it('isGroundingSourceType accepts valid types', () => {
    for (const t of ['document', 'code', 'ticket', 'api', 'conversation', 'web']) {
      expect(isGroundingSourceType(t)).toBe(true);
    }
  });

  it('isGroundingSourceType rejects invalid', () => {
    expect(isGroundingSourceType('email')).toBe(false);
    expect(isGroundingSourceType(null)).toBe(false);
  });

  it('isRetrievalMethod accepts valid methods', () => {
    for (const m of ['manual', 'automated', 'rag', 'search']) {
      expect(isRetrievalMethod(m)).toBe(true);
    }
  });

  it('isRetrievalMethod rejects invalid', () => {
    expect(isRetrievalMethod('scrape')).toBe(false);
    expect(isRetrievalMethod(0)).toBe(false);
  });
});

// ── Source validation ──

describe('isGroundingSource', () => {
  const validSource: GroundingSource = {
    source_id: 'gs-1',
    source_type: 'document',
    locator: 'https://docs.example.com/spec.md',
    retrieved_at: '2026-02-24T10:00:00Z',
    content_fingerprint: 'sha256:abc123',
    retrieval_method: 'manual',
  };

  it('accepts valid source with all required fields', () => {
    expect(isGroundingSource(validSource)).toBe(true);
  });

  it('accepts source with optional fields', () => {
    const full: GroundingSource = {
      ...validSource,
      title: 'API Spec',
      snippet: 'Relevant excerpt...',
      relevance_score: 0.95,
    };
    expect(isGroundingSource(full)).toBe(true);
  });

  it('rejects source missing source_id', () => {
    const { source_id, ...rest } = validSource;
    expect(isGroundingSource(rest)).toBe(false);
  });

  it('rejects source with invalid source_type', () => {
    expect(isGroundingSource({ ...validSource, source_type: 'invalid' })).toBe(false);
  });

  it('rejects null', () => {
    expect(isGroundingSource(null)).toBe(false);
  });
});

// ── Manifest ──

describe('isGroundingManifest', () => {
  const validManifest: GroundingManifest = {
    manifest_id: 'gm-1',
    created_at: '2026-02-24T10:00:00Z',
    sources: [
      { source_id: 'gs-1', source_type: 'document', locator: 'url', retrieved_at: 'ts', content_fingerprint: 'fp', retrieval_method: 'manual' },
      { source_id: 'gs-2', source_type: 'code', locator: 'path', retrieved_at: 'ts', content_fingerprint: 'fp', retrieval_method: 'automated' },
    ],
  };

  it('accepts valid manifest with mixed source types', () => {
    expect(isGroundingManifest(validManifest)).toBe(true);
  });

  it('accepts manifest with optional queries', () => {
    const full: GroundingManifest = {
      ...validManifest,
      queries: [{ query_text: 'What is the API contract?', executed_at: '2026-02-24T10:00:00Z' }],
    };
    expect(isGroundingManifest(full)).toBe(true);
  });

  it('rejects manifest with invalid source', () => {
    expect(isGroundingManifest({
      manifest_id: 'gm-1',
      created_at: 'ts',
      sources: [{ source_id: 'gs-1' }],
    })).toBe(false);
  });

  it('rejects null', () => {
    expect(isGroundingManifest(null)).toBe(false);
  });
});

// ── GroundingQuery ──

describe('isGroundingQuery', () => {
  it('accepts valid query', () => {
    expect(isGroundingQuery({ query_text: 'test', executed_at: '2026-02-24T10:00:00Z' })).toBe(true);
  });

  it('accepts query with optional fields', () => {
    expect(isGroundingQuery({
      query_text: 'test',
      executed_at: '2026-02-24T10:00:00Z',
      source_ids: ['gs-1'],
      result_count: 5,
    })).toBe(true);
  });

  it('rejects invalid query', () => {
    expect(isGroundingQuery({ query_text: 42 })).toBe(false);
    expect(isGroundingQuery(null)).toBe(false);
  });
});
