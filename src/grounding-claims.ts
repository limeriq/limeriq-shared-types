/**
 * Grounding Claims schema types.
 *
 * Grounding Claims link specific assertions in a spec or plan back to
 * the grounding sources that support them, enabling traceability audits.
 */

// ── Claim Status ──

export const ClaimStatus = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  DISPUTED: 'disputed',
  RETRACTED: 'retracted',
} as const;

export type ClaimStatus = (typeof ClaimStatus)[keyof typeof ClaimStatus];

export function isClaimStatus(value: unknown): value is ClaimStatus {
  return typeof value === 'string' && Object.values(ClaimStatus).includes(value as ClaimStatus);
}

// ── Grounding Claim ──

export interface GroundingClaim {
  claim_id: string;
  claim_text: string;
  spec_location: string;
  supporting_sources: string[];
  status: ClaimStatus;
  verified_at?: string;
  verified_by?: string;
  confidence_score?: number;
}

export function isGroundingClaim(value: unknown): value is GroundingClaim {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (
    typeof obj.claim_id !== 'string' ||
    typeof obj.claim_text !== 'string' ||
    typeof obj.spec_location !== 'string' ||
    !Array.isArray(obj.supporting_sources) ||
    !isClaimStatus(obj.status)
  ) return false;
  for (const s of obj.supporting_sources as unknown[]) {
    if (typeof s !== 'string') return false;
  }
  if (obj.verified_at !== undefined && typeof obj.verified_at !== 'string') return false;
  if (obj.verified_by !== undefined && typeof obj.verified_by !== 'string') return false;
  if (obj.confidence_score !== undefined && typeof obj.confidence_score !== 'number') return false;
  return true;
}

// ── Grounding Claims Manifest ──

export interface GroundingClaimsManifest {
  manifest_id: string;
  grounding_manifest_id: string;
  created_at: string;
  claims: GroundingClaim[];
}

export function isGroundingClaimsManifest(value: unknown): value is GroundingClaimsManifest {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (
    typeof obj.manifest_id !== 'string' ||
    typeof obj.grounding_manifest_id !== 'string' ||
    typeof obj.created_at !== 'string' ||
    !Array.isArray(obj.claims)
  ) return false;
  for (const c of obj.claims as unknown[]) {
    if (!isGroundingClaim(c)) return false;
  }
  return true;
}
