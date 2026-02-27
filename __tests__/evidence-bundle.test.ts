import { describe, it, expect } from 'vitest';
import {
  EvidenceCheckStatus,
  isEvidenceCheckStatus,
  isEvidenceArtifactEntry,
  isEvidenceIntentRef,
  isEvidenceResults,
  isEvidenceMetering,
  isEvidenceBundleManifest,
} from '../src/evidence-bundle';

import type {
  EvidenceArtifactEntry,
  EvidenceIntentRef,
  EvidenceResults,
  EvidenceMetering,
  EvidenceBundleManifest,
} from '../src/evidence-bundle';

// ── Enum uniqueness ──

describe('evidence-bundle enums', () => {
  it('EvidenceCheckStatus has no duplicate values', () => {
    const values = Object.values(EvidenceCheckStatus);
    expect(new Set(values).size).toBe(values.length);
  });

  it('EvidenceCheckStatus values are all strings', () => {
    for (const val of Object.values(EvidenceCheckStatus)) {
      expect(typeof val).toBe('string');
    }
  });
});

// ── Enum type guard ──

describe('isEvidenceCheckStatus', () => {
  it('accepts valid statuses', () => {
    for (const s of ['pass', 'warn', 'fail']) {
      expect(isEvidenceCheckStatus(s)).toBe(true);
    }
  });

  it('rejects invalid', () => {
    expect(isEvidenceCheckStatus('error')).toBe(false);
    expect(isEvidenceCheckStatus(null)).toBe(false);
  });
});

// ── Artifact entries ──

describe('isEvidenceArtifactEntry', () => {
  it('accepts valid artifact entry', () => {
    const entry: EvidenceArtifactEntry = {
      artifact_id: 'ea-1',
      artifact_type: 'test_result',
      path: '/results/test-output.json',
      content_fingerprint: 'sha256:abc',
    };
    expect(isEvidenceArtifactEntry(entry)).toBe(true);
  });

  it('accepts entry with optional fields', () => {
    expect(isEvidenceArtifactEntry({
      artifact_id: 'ea-1',
      artifact_type: 'test_result',
      path: '/results/test.json',
      content_fingerprint: 'sha256:abc',
      description: 'Test results',
    })).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(isEvidenceArtifactEntry({ artifact_id: 'ea-1' })).toBe(false);
    expect(isEvidenceArtifactEntry(null)).toBe(false);
  });
});

// ── Intent refs ──

describe('isEvidenceIntentRef', () => {
  it('accepts valid intent ref', () => {
    const ref: EvidenceIntentRef = {
      intent_id: 'i-1',
      contract_id: 'pc-1',
      status: 'pass',
    };
    expect(isEvidenceIntentRef(ref)).toBe(true);
  });

  it('accepts ref with optional reason', () => {
    expect(isEvidenceIntentRef({
      intent_id: 'i-1',
      contract_id: 'pc-1',
      status: 'fail',
      reason: 'Test coverage below threshold',
    })).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(isEvidenceIntentRef({ intent_id: 'i-1', contract_id: 'pc-1', status: 'error' })).toBe(false);
  });
});

// ── Evidence results ──

describe('isEvidenceResults', () => {
  it('accepts valid results', () => {
    const results: EvidenceResults = {
      overall_status: 'pass',
      pass_count: 10,
      warn_count: 1,
      fail_count: 0,
    };
    expect(isEvidenceResults(results)).toBe(true);
  });

  it('accepts results with optional reasons', () => {
    expect(isEvidenceResults({
      overall_status: 'warn',
      pass_count: 8,
      warn_count: 2,
      fail_count: 0,
      reasons: ['Low coverage on module X'],
    })).toBe(true);
  });

  it('rejects invalid', () => {
    expect(isEvidenceResults({ overall_status: 'pass' })).toBe(false);
    expect(isEvidenceResults(null)).toBe(false);
  });
});

// ── Evidence metering ──

describe('isEvidenceMetering', () => {
  it('accepts valid metering', () => {
    const metering: EvidenceMetering = {
      duration_ms: 5000,
      token_count: 2500,
      llm_calls: 3,
    };
    expect(isEvidenceMetering(metering)).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(isEvidenceMetering({ duration_ms: 5000 })).toBe(false);
    expect(isEvidenceMetering(null)).toBe(false);
  });
});

// ── Evidence bundle manifest ──

describe('isEvidenceBundleManifest', () => {
  const validBundle: EvidenceBundleManifest = {
    bundle_id: 'eb-1',
    contract_id: 'pc-1',
    created_at: '2026-02-24T10:00:00Z',
    artifacts: [{
      artifact_id: 'ea-1',
      artifact_type: 'test_result',
      path: '/results/test.json',
      content_fingerprint: 'sha256:abc',
    }],
    intent_refs: [{
      intent_id: 'i-1',
      contract_id: 'pc-1',
      status: 'pass',
    }],
    results: {
      overall_status: 'pass',
      pass_count: 1,
      warn_count: 0,
      fail_count: 0,
    },
    metering: {
      duration_ms: 5000,
      token_count: 2500,
      llm_calls: 3,
    },
  };

  it('accepts valid bundle manifest', () => {
    expect(isEvidenceBundleManifest(validBundle)).toBe(true);
  });

  it('accepts bundle with empty artifacts', () => {
    expect(isEvidenceBundleManifest({ ...validBundle, artifacts: [] })).toBe(true);
  });

  it('rejects bundle with invalid artifact', () => {
    expect(isEvidenceBundleManifest({
      ...validBundle,
      artifacts: [{ artifact_id: 'ea-1' }],
    })).toBe(false);
  });

  it('rejects null', () => {
    expect(isEvidenceBundleManifest(null)).toBe(false);
  });
});
