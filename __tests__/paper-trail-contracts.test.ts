import { describe, it, expect } from 'vitest';
import {
  RunEventType,
  isRunEventType,
  ArtifactKind,
  isArtifactKind,
  LineageRelation,
  isLineageRelation,
  ApprovalDecision,
  isApprovalDecision,
  isRunEvent,
  isRunSummary,
  isArtifactEntry,
  isLineageEdge,
  isExternalRef,
  isApprovalEvent,
  isMeteringRecord,
} from '../src/paper-trail-contracts';

import type {
  RunEvent,
  RunSummary,
  ArtifactEntry,
  LineageEdge,
  ExternalRef,
  ApprovalEvent,
  MeteringRecord,
} from '../src/paper-trail-contracts';

// ── Enum uniqueness ──

describe('paper-trail-contracts enums', () => {
  const checkUniqueness = (name: string, obj: Record<string, string>) => {
    it(`${name} has no duplicate values`, () => {
      const values = Object.values(obj);
      expect(new Set(values).size).toBe(values.length);
    });

    it(`${name} values are all strings`, () => {
      for (const val of Object.values(obj)) {
        expect(typeof val).toBe('string');
      }
    });
  };

  checkUniqueness('RunEventType', RunEventType);
  checkUniqueness('ArtifactKind', ArtifactKind);
  checkUniqueness('LineageRelation', LineageRelation);
  checkUniqueness('ApprovalDecision', ApprovalDecision);
});

// ── Enum type guards ──

describe('enum type guards', () => {
  it('isRunEventType accepts all valid types', () => {
    for (const t of [
      'step_start', 'step_end', 'artifact_registered', 'metering_record',
      'lineage_edge', 'approval_request', 'approval_decision',
      'error', 'warning', 'run_start', 'run_end',
    ]) {
      expect(isRunEventType(t)).toBe(true);
    }
  });

  it('isRunEventType rejects invalid', () => {
    expect(isRunEventType('step_pause')).toBe(false);
    expect(isRunEventType(null)).toBe(false);
  });

  it('isArtifactKind accepts all valid kinds', () => {
    for (const k of [
      'source_code', 'test_result', 'spec_document', 'evidence_bundle',
      'grounding_manifest', 'config', 'log', 'report', 'other',
    ]) {
      expect(isArtifactKind(k)).toBe(true);
    }
  });

  it('isArtifactKind rejects invalid', () => {
    expect(isArtifactKind('binary')).toBe(false);
    expect(isArtifactKind(undefined)).toBe(false);
  });

  it('isLineageRelation accepts all valid relations', () => {
    for (const r of ['derived_from', 'input_to', 'produced_by', 'references', 'supersedes']) {
      expect(isLineageRelation(r)).toBe(true);
    }
  });

  it('isLineageRelation rejects invalid', () => {
    expect(isLineageRelation('copies')).toBe(false);
  });

  it('isApprovalDecision accepts all valid decisions', () => {
    for (const d of ['approved', 'denied', 'delegated', 'timed_out']) {
      expect(isApprovalDecision(d)).toBe(true);
    }
  });

  it('isApprovalDecision rejects invalid', () => {
    expect(isApprovalDecision('pending')).toBe(false);
    expect(isApprovalDecision(0)).toBe(false);
  });
});

// ── Type guards for interfaces ──

describe('isRunEvent', () => {
  it('accepts valid event', () => {
    const event: RunEvent = {
      event_id: 're-1',
      run_id: 'run-1',
      event_type: 'step_start',
      timestamp: '2026-02-24T10:00:00Z',
    };
    expect(isRunEvent(event)).toBe(true);
  });

  it('accepts event with optional payload', () => {
    expect(isRunEvent({
      event_id: 're-1',
      run_id: 'run-1',
      event_type: 'step_start',
      timestamp: '2026-02-24T10:00:00Z',
      payload: { step_name: 'lint' },
    })).toBe(true);
  });

  it('rejects invalid event_type', () => {
    expect(isRunEvent({
      event_id: 're-1',
      run_id: 'run-1',
      event_type: 'invalid',
      timestamp: 'ts',
    })).toBe(false);
  });

  it('rejects null', () => {
    expect(isRunEvent(null)).toBe(false);
  });
});

describe('isRunSummary', () => {
  it('accepts valid summary', () => {
    const summary: RunSummary = {
      run_id: 'run-1',
      workflow_path: '/workflows/test.yaml',
      started_at: '2026-02-24T10:00:00Z',
      completed_at: '2026-02-24T10:01:00Z',
      conclusion: 'pass',
      event_count: 5,
    };
    expect(isRunSummary(summary)).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(isRunSummary({ run_id: 'run-1' })).toBe(false);
    expect(isRunSummary(null)).toBe(false);
  });
});

describe('isArtifactEntry', () => {
  it('accepts valid entry', () => {
    const entry: ArtifactEntry = {
      artifact_id: 'a-1',
      run_id: 'run-1',
      kind: 'source_code',
      path: '/src/index.ts',
      content_fingerprint: 'sha256:abc',
      registered_at: '2026-02-24T10:00:00Z',
    };
    expect(isArtifactEntry(entry)).toBe(true);
  });

  it('rejects invalid kind', () => {
    expect(isArtifactEntry({
      artifact_id: 'a-1',
      run_id: 'run-1',
      kind: 'binary',
      path: '/x',
      content_fingerprint: 'fp',
      registered_at: 'ts',
    })).toBe(false);
  });
});

describe('isLineageEdge', () => {
  it('accepts valid edge', () => {
    const edge: LineageEdge = {
      edge_id: 'le-1',
      run_id: 'run-1',
      source_artifact_id: 'a-1',
      target_artifact_id: 'a-2',
      relation: 'derived_from',
    };
    expect(isLineageEdge(edge)).toBe(true);
  });

  it('rejects invalid relation', () => {
    expect(isLineageEdge({
      edge_id: 'le-1',
      run_id: 'run-1',
      source_artifact_id: 'a-1',
      target_artifact_id: 'a-2',
      relation: 'copies',
    })).toBe(false);
  });
});

describe('isExternalRef', () => {
  it('accepts valid ref', () => {
    const ref: ExternalRef = {
      ref_id: 'er-1',
      run_id: 'run-1',
      ref_type: 'github_pr',
      ref_locator: 'https://github.com/org/repo/pull/42',
    };
    expect(isExternalRef(ref)).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(isExternalRef({ ref_id: 'er-1' })).toBe(false);
    expect(isExternalRef(null)).toBe(false);
  });
});

describe('isApprovalEvent', () => {
  it('accepts valid approval event', () => {
    const event: ApprovalEvent = {
      approval_id: 'ap-1',
      run_id: 'run-1',
      requested_at: '2026-02-24T10:00:00Z',
      decision: 'approved',
      decided_by: 'alice',
      decided_at: '2026-02-24T10:01:00Z',
    };
    expect(isApprovalEvent(event)).toBe(true);
  });

  it('accepts approval with optional fields', () => {
    expect(isApprovalEvent({
      approval_id: 'ap-1',
      run_id: 'run-1',
      requested_at: 'ts',
      decision: 'denied',
      decided_by: 'bob',
      decided_at: 'ts',
      reason: 'Insufficient evidence',
    })).toBe(true);
  });

  it('rejects invalid decision', () => {
    expect(isApprovalEvent({
      approval_id: 'ap-1',
      run_id: 'run-1',
      requested_at: 'ts',
      decision: 'pending',
      decided_by: 'alice',
      decided_at: 'ts',
    })).toBe(false);
  });
});

describe('isMeteringRecord', () => {
  it('accepts valid metering record', () => {
    const record: MeteringRecord = {
      record_id: 'mr-1',
      run_id: 'run-1',
      timestamp: '2026-02-24T10:00:00Z',
      duration_ms: 5000,
      token_count: 2500,
      llm_calls: 3,
    };
    expect(isMeteringRecord(record)).toBe(true);
  });

  it('accepts record with optional step_name', () => {
    expect(isMeteringRecord({
      record_id: 'mr-1',
      run_id: 'run-1',
      timestamp: 'ts',
      duration_ms: 5000,
      token_count: 2500,
      llm_calls: 3,
      step_name: 'lint',
    })).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(isMeteringRecord({ record_id: 'mr-1' })).toBe(false);
    expect(isMeteringRecord(null)).toBe(false);
  });
});
