import { describe, it, expect } from 'vitest';
import {
  ClaimStatus,
  isClaimStatus,
  isGroundingClaim,
  isGroundingClaimsManifest,
} from '../src/grounding-claims';

import type {
  GroundingClaim,
  GroundingClaimsManifest,
} from '../src/grounding-claims';

// ── Enum uniqueness ──

describe('grounding-claims enums', () => {
  it('ClaimStatus has no duplicate values', () => {
    const values = Object.values(ClaimStatus);
    expect(new Set(values).size).toBe(values.length);
  });

  it('ClaimStatus values are all strings', () => {
    for (const val of Object.values(ClaimStatus)) {
      expect(typeof val).toBe('string');
    }
  });
});

// ── Enum type guard ──

describe('isClaimStatus', () => {
  it('accepts valid statuses', () => {
    for (const s of ['pending', 'verified', 'disputed', 'retracted']) {
      expect(isClaimStatus(s)).toBe(true);
    }
  });

  it('rejects invalid', () => {
    expect(isClaimStatus('confirmed')).toBe(false);
    expect(isClaimStatus(null)).toBe(false);
  });
});

// ── Claim validation ──

describe('isGroundingClaim', () => {
  const validClaim: GroundingClaim = {
    claim_id: 'gc-1',
    claim_text: 'The API supports pagination',
    spec_location: 'spec.md#pagination',
    supporting_sources: ['gs-1', 'gs-2'],
    status: 'pending',
  };

  it('accepts valid claim', () => {
    expect(isGroundingClaim(validClaim)).toBe(true);
  });

  it('accepts claim with optional fields', () => {
    expect(isGroundingClaim({
      ...validClaim,
      verified_at: '2026-02-24T10:00:00Z',
      verified_by: 'alice',
      confidence_score: 0.92,
    })).toBe(true);
  });

  it('rejects claim with missing claim_id', () => {
    const { claim_id, ...rest } = validClaim;
    expect(isGroundingClaim(rest)).toBe(false);
  });

  it('rejects claim with invalid status', () => {
    expect(isGroundingClaim({ ...validClaim, status: 'confirmed' })).toBe(false);
  });

  it('rejects null', () => {
    expect(isGroundingClaim(null)).toBe(false);
  });
});

// ── Claims manifest ──

describe('isGroundingClaimsManifest', () => {
  const validManifest: GroundingClaimsManifest = {
    manifest_id: 'gcm-1',
    grounding_manifest_id: 'gm-1',
    created_at: '2026-02-24T10:00:00Z',
    claims: [{
      claim_id: 'gc-1',
      claim_text: 'Test claim',
      spec_location: 'spec.md',
      supporting_sources: ['gs-1'],
      status: 'pending',
    }],
  };

  it('accepts valid manifest', () => {
    expect(isGroundingClaimsManifest(validManifest)).toBe(true);
  });

  it('rejects manifest with invalid claim', () => {
    expect(isGroundingClaimsManifest({
      manifest_id: 'gcm-1',
      grounding_manifest_id: 'gm-1',
      created_at: 'ts',
      claims: [{ claim_id: 'gc-1' }],
    })).toBe(false);
  });

  it('rejects null', () => {
    expect(isGroundingClaimsManifest(null)).toBe(false);
  });
});
