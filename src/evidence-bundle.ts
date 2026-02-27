/**
 * Evidence Bundle Manifest schema types.
 *
 * An Evidence Bundle collects artifacts, intent verification results,
 * and metering data produced during a workflow run to prove execution fidelity.
 */

// ── Evidence Check Status ──

export const EvidenceCheckStatus = {
  PASS: 'pass',
  WARN: 'warn',
  FAIL: 'fail',
} as const;

export type EvidenceCheckStatus = (typeof EvidenceCheckStatus)[keyof typeof EvidenceCheckStatus];

export function isEvidenceCheckStatus(value: unknown): value is EvidenceCheckStatus {
  return typeof value === 'string' && Object.values(EvidenceCheckStatus).includes(value as EvidenceCheckStatus);
}

// ── Evidence Artifact Entry ──

export interface EvidenceArtifactEntry {
  artifact_id: string;
  artifact_type: string;
  path: string;
  content_fingerprint: string;
  description?: string;
}

export function isEvidenceArtifactEntry(value: unknown): value is EvidenceArtifactEntry {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.artifact_id === 'string' &&
    typeof obj.artifact_type === 'string' &&
    typeof obj.path === 'string' &&
    typeof obj.content_fingerprint === 'string' &&
    (obj.description === undefined || typeof obj.description === 'string')
  );
}

// ── Evidence Intent Ref ──

export interface EvidenceIntentRef {
  intent_id: string;
  contract_id: string;
  status: EvidenceCheckStatus;
  reason?: string;
}

export function isEvidenceIntentRef(value: unknown): value is EvidenceIntentRef {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.intent_id === 'string' &&
    typeof obj.contract_id === 'string' &&
    isEvidenceCheckStatus(obj.status) &&
    (obj.reason === undefined || typeof obj.reason === 'string')
  );
}

// ── Evidence Results ──

export interface EvidenceResults {
  overall_status: EvidenceCheckStatus;
  pass_count: number;
  warn_count: number;
  fail_count: number;
  reasons?: string[];
}

export function isEvidenceResults(value: unknown): value is EvidenceResults {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (
    !isEvidenceCheckStatus(obj.overall_status) ||
    typeof obj.pass_count !== 'number' ||
    typeof obj.warn_count !== 'number' ||
    typeof obj.fail_count !== 'number'
  ) return false;
  if (obj.reasons !== undefined) {
    if (!Array.isArray(obj.reasons)) return false;
    for (const r of obj.reasons as unknown[]) {
      if (typeof r !== 'string') return false;
    }
  }
  return true;
}

// ── Evidence Metering ──

export interface EvidenceMetering {
  duration_ms: number;
  token_count: number;
  llm_calls: number;
}

export function isEvidenceMetering(value: unknown): value is EvidenceMetering {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.duration_ms === 'number' &&
    typeof obj.token_count === 'number' &&
    typeof obj.llm_calls === 'number'
  );
}

// ── Evidence Bundle Manifest ──

export interface EvidenceBundleManifest {
  bundle_id: string;
  contract_id: string;
  created_at: string;
  artifacts: EvidenceArtifactEntry[];
  intent_refs: EvidenceIntentRef[];
  results: EvidenceResults;
  metering: EvidenceMetering;
}

export function isEvidenceBundleManifest(value: unknown): value is EvidenceBundleManifest {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (
    typeof obj.bundle_id !== 'string' ||
    typeof obj.contract_id !== 'string' ||
    typeof obj.created_at !== 'string' ||
    !Array.isArray(obj.artifacts) ||
    !Array.isArray(obj.intent_refs) ||
    !isEvidenceResults(obj.results) ||
    !isEvidenceMetering(obj.metering)
  ) return false;
  for (const a of obj.artifacts as unknown[]) {
    if (!isEvidenceArtifactEntry(a)) return false;
  }
  for (const r of obj.intent_refs as unknown[]) {
    if (!isEvidenceIntentRef(r)) return false;
  }
  return true;
}
