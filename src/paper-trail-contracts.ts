/**
 * Paper Trail Contracts (Run Ledger types).
 *
 * These types model the immutable audit log (paper trail) for workflow runs,
 * including events, artifact lineage, approvals, and metering records.
 */

// ── Run Event Type ──

export const RunEventType = {
  STEP_START: 'step_start',
  STEP_END: 'step_end',
  ARTIFACT_REGISTERED: 'artifact_registered',
  METERING_RECORD: 'metering_record',
  LINEAGE_EDGE: 'lineage_edge',
  APPROVAL_REQUEST: 'approval_request',
  APPROVAL_DECISION: 'approval_decision',
  ERROR: 'error',
  WARNING: 'warning',
  RUN_START: 'run_start',
  RUN_END: 'run_end',
} as const;

export type RunEventType = (typeof RunEventType)[keyof typeof RunEventType];

export function isRunEventType(value: unknown): value is RunEventType {
  return typeof value === 'string' && Object.values(RunEventType).includes(value as RunEventType);
}

// ── Artifact Kind ──

export const ArtifactKind = {
  SOURCE_CODE: 'source_code',
  TEST_RESULT: 'test_result',
  SPEC_DOCUMENT: 'spec_document',
  EVIDENCE_BUNDLE: 'evidence_bundle',
  ATTESTATION: 'attestation',
  GROUNDING_MANIFEST: 'grounding_manifest',
  CONFIG: 'config',
  LOG: 'log',
  REPORT: 'report',
  OTHER: 'other',
} as const;

export type ArtifactKind = (typeof ArtifactKind)[keyof typeof ArtifactKind];

export function isArtifactKind(value: unknown): value is ArtifactKind {
  return typeof value === 'string' && Object.values(ArtifactKind).includes(value as ArtifactKind);
}

// ── Lineage Relation ──

export const LineageRelation = {
  DERIVED_FROM: 'derived_from',
  INPUT_TO: 'input_to',
  PRODUCED_BY: 'produced_by',
  REFERENCES: 'references',
  SUPERSEDES: 'supersedes',
} as const;

export type LineageRelation = (typeof LineageRelation)[keyof typeof LineageRelation];

export function isLineageRelation(value: unknown): value is LineageRelation {
  return typeof value === 'string' && Object.values(LineageRelation).includes(value as LineageRelation);
}

// ── Approval Decision ──

export const ApprovalDecision = {
  APPROVED: 'approved',
  DENIED: 'denied',
  DELEGATED: 'delegated',
  TIMED_OUT: 'timed_out',
} as const;

export type ApprovalDecision = (typeof ApprovalDecision)[keyof typeof ApprovalDecision];

export function isApprovalDecision(value: unknown): value is ApprovalDecision {
  return typeof value === 'string' && Object.values(ApprovalDecision).includes(value as ApprovalDecision);
}

// ── Run Event ──

export interface RunEvent {
  event_id: string;
  run_id: string;
  event_type: RunEventType;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export function isRunEvent(value: unknown): value is RunEvent {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.event_id === 'string' &&
    typeof obj.run_id === 'string' &&
    isRunEventType(obj.event_type) &&
    typeof obj.timestamp === 'string' &&
    (obj.payload === undefined || (typeof obj.payload === 'object' && obj.payload !== null))
  );
}

// ── Run Summary ──

export interface RunSummary {
  run_id: string;
  workflow_path: string;
  started_at: string;
  completed_at: string;
  conclusion: string;
  event_count: number;
  error?: string;
}

export function isRunSummary(value: unknown): value is RunSummary {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.run_id === 'string' &&
    typeof obj.workflow_path === 'string' &&
    typeof obj.started_at === 'string' &&
    typeof obj.completed_at === 'string' &&
    typeof obj.conclusion === 'string' &&
    typeof obj.event_count === 'number' &&
    (obj.error === undefined || typeof obj.error === 'string')
  );
}

// ── Artifact Entry ──

export interface ArtifactEntry {
  artifact_id: string;
  run_id: string;
  kind: ArtifactKind;
  path: string;
  content_fingerprint: string;
  registered_at: string;
  metadata?: Record<string, unknown>;
}

export function isArtifactEntry(value: unknown): value is ArtifactEntry {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.artifact_id === 'string' &&
    typeof obj.run_id === 'string' &&
    isArtifactKind(obj.kind) &&
    typeof obj.path === 'string' &&
    typeof obj.content_fingerprint === 'string' &&
    typeof obj.registered_at === 'string' &&
    (obj.metadata === undefined || (typeof obj.metadata === 'object' && obj.metadata !== null))
  );
}

// ── Lineage Edge ──

export interface LineageEdge {
  edge_id: string;
  run_id: string;
  source_artifact_id: string;
  target_artifact_id: string;
  relation: LineageRelation;
  metadata?: Record<string, unknown>;
}

export function isLineageEdge(value: unknown): value is LineageEdge {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.edge_id === 'string' &&
    typeof obj.run_id === 'string' &&
    typeof obj.source_artifact_id === 'string' &&
    typeof obj.target_artifact_id === 'string' &&
    isLineageRelation(obj.relation) &&
    (obj.metadata === undefined || (typeof obj.metadata === 'object' && obj.metadata !== null))
  );
}

// ── External Ref ──

export interface ExternalRef {
  ref_id: string;
  run_id: string;
  ref_type: string;
  ref_locator: string;
  metadata?: Record<string, unknown>;
}

export function isExternalRef(value: unknown): value is ExternalRef {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.ref_id === 'string' &&
    typeof obj.run_id === 'string' &&
    typeof obj.ref_type === 'string' &&
    typeof obj.ref_locator === 'string' &&
    (obj.metadata === undefined || (typeof obj.metadata === 'object' && obj.metadata !== null))
  );
}

// ── Approval Event ──

export interface ApprovalEvent {
  approval_id: string;
  run_id: string;
  requested_at: string;
  decision: ApprovalDecision;
  decided_by: string;
  decided_at: string;
  reason?: string;
}

export function isApprovalEvent(value: unknown): value is ApprovalEvent {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.approval_id === 'string' &&
    typeof obj.run_id === 'string' &&
    typeof obj.requested_at === 'string' &&
    isApprovalDecision(obj.decision) &&
    typeof obj.decided_by === 'string' &&
    typeof obj.decided_at === 'string' &&
    (obj.reason === undefined || typeof obj.reason === 'string')
  );
}

// ── Metering Record ──

export interface MeteringRecord {
  record_id: string;
  run_id: string;
  timestamp: string;
  duration_ms: number;
  token_count: number;
  llm_calls: number;
  step_name?: string;
}

export function isMeteringRecord(value: unknown): value is MeteringRecord {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.record_id === 'string' &&
    typeof obj.run_id === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.duration_ms === 'number' &&
    typeof obj.token_count === 'number' &&
    typeof obj.llm_calls === 'number' &&
    (obj.step_name === undefined || typeof obj.step_name === 'string')
  );
}
