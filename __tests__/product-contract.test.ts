import { describe, it, expect } from 'vitest';
import {
  ProductContractStatus,
  isProductContractStatus,
  ContractRiskTier,
  isContractRiskTier,
  isSuccessMetric,
  isAcceptanceCriterion,
  isContractRisk,
  isContractApproval,
  isProductContractIntent,
  isProductContract,
} from '../src/product-contract';

import type {
  SuccessMetric,
  AcceptanceCriterion,
  ContractRisk,
  ContractApproval,
  ProductContractIntent,
  ProductContract,
} from '../src/product-contract';

// ── Enum uniqueness ──

describe('product-contract enums', () => {
  it('ProductContractStatus has no duplicate values', () => {
    const values = Object.values(ProductContractStatus);
    expect(new Set(values).size).toBe(values.length);
  });

  it('ProductContractStatus values are all strings', () => {
    for (const val of Object.values(ProductContractStatus)) {
      expect(typeof val).toBe('string');
    }
  });

  it('ContractRiskTier has no duplicate values', () => {
    const values = Object.values(ContractRiskTier);
    expect(new Set(values).size).toBe(values.length);
  });

  it('ContractRiskTier values are all strings', () => {
    for (const val of Object.values(ContractRiskTier)) {
      expect(typeof val).toBe('string');
    }
  });
});

// ── Enum type guards ──

describe('enum type guards', () => {
  it('isProductContractStatus accepts valid statuses', () => {
    for (const s of ['draft', 'review', 'approved', 'rejected', 'superseded']) {
      expect(isProductContractStatus(s)).toBe(true);
    }
  });

  it('isProductContractStatus rejects invalid', () => {
    expect(isProductContractStatus('pending')).toBe(false);
    expect(isProductContractStatus(42)).toBe(false);
    expect(isProductContractStatus(null)).toBe(false);
  });

  it('isContractRiskTier accepts valid tiers', () => {
    for (const t of ['low', 'medium', 'high', 'critical']) {
      expect(isContractRiskTier(t)).toBe(true);
    }
  });

  it('isContractRiskTier rejects invalid', () => {
    expect(isContractRiskTier('extreme')).toBe(false);
    expect(isContractRiskTier(undefined)).toBe(false);
  });
});

// ── Type guard accept/reject for nested types ──

describe('isSuccessMetric', () => {
  it('accepts valid metric', () => {
    const metric: SuccessMetric = {
      metric_id: 'm-1',
      description: 'Latency under 200ms',
      target_value: '< 200ms',
      measurement_method: 'p99 latency from APM',
    };
    expect(isSuccessMetric(metric)).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(isSuccessMetric({ metric_id: 'm-1' })).toBe(false);
    expect(isSuccessMetric(null)).toBe(false);
    expect(isSuccessMetric(42)).toBe(false);
  });
});

describe('isAcceptanceCriterion', () => {
  it('accepts valid criterion', () => {
    const criterion: AcceptanceCriterion = {
      criterion_id: 'ac-1',
      description: 'User can log in with SSO',
      verification_method: 'integration test',
    };
    expect(isAcceptanceCriterion(criterion)).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(isAcceptanceCriterion({ criterion_id: 'ac-1' })).toBe(false);
    expect(isAcceptanceCriterion({})).toBe(false);
  });
});

describe('isContractRisk', () => {
  it('accepts valid risk', () => {
    const risk: ContractRisk = {
      risk_id: 'r-1',
      description: 'API rate limits exceeded',
      tier: 'high',
      mitigation: 'Implement retry with backoff',
    };
    expect(isContractRisk(risk)).toBe(true);
  });

  it('accepts risk without optional mitigation', () => {
    expect(isContractRisk({ risk_id: 'r-1', description: 'desc', tier: 'low' })).toBe(true);
  });

  it('rejects invalid tier', () => {
    expect(isContractRisk({ risk_id: 'r-1', description: 'desc', tier: 'extreme' })).toBe(false);
  });
});

describe('isContractApproval', () => {
  it('accepts valid approval', () => {
    const approval: ContractApproval = {
      approver: 'alice',
      approved_at: '2026-02-24T10:00:00Z',
      decision: 'approved',
    };
    expect(isContractApproval(approval)).toBe(true);
  });

  it('accepts approval with optional comments', () => {
    expect(isContractApproval({
      approver: 'bob',
      approved_at: '2026-02-24T10:00:00Z',
      decision: 'rejected',
      comments: 'Needs more detail',
    })).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(isContractApproval({ approver: 'alice' })).toBe(false);
    expect(isContractApproval(null)).toBe(false);
  });
});

// ── ProductContractIntent ──

describe('isProductContractIntent', () => {
  it('accepts valid intent', () => {
    const intent: ProductContractIntent = {
      intent_id: 'i-1',
      title: 'Add SSO support',
      description: 'Implement SAML-based SSO',
      success_metrics: [{ metric_id: 'm-1', description: 'd', target_value: 'v', measurement_method: 'mm' }],
      acceptance_criteria: [{ criterion_id: 'ac-1', description: 'd', verification_method: 'vm' }],
    };
    expect(isProductContractIntent(intent)).toBe(true);
  });

  it('rejects intent with invalid nested metric', () => {
    expect(isProductContractIntent({
      intent_id: 'i-1',
      title: 't',
      description: 'd',
      success_metrics: [{ metric_id: 'm-1' }],
      acceptance_criteria: [{ criterion_id: 'ac-1', description: 'd', verification_method: 'vm' }],
    })).toBe(false);
  });
});

// ── ProductContract (full) ──

describe('isProductContract', () => {
  const validContract: ProductContract = {
    contract_id: 'pc-1',
    version: 1,
    status: 'draft',
    title: 'Feature X',
    description: 'Deliver feature X',
    intents: [{
      intent_id: 'i-1',
      title: 'Intent 1',
      description: 'desc',
      success_metrics: [{ metric_id: 'm-1', description: 'd', target_value: 'v', measurement_method: 'mm' }],
      acceptance_criteria: [{ criterion_id: 'ac-1', description: 'd', verification_method: 'vm' }],
    }],
    risks: [{ risk_id: 'r-1', description: 'risk desc', tier: 'low' }],
    created_at: '2026-02-24T10:00:00Z',
    updated_at: '2026-02-24T10:00:00Z',
  };

  it('accepts valid contract', () => {
    expect(isProductContract(validContract)).toBe(true);
  });

  it('accepts contract with optional fields', () => {
    const full: ProductContract = {
      ...validContract,
      approvals: [{ approver: 'alice', approved_at: '2026-02-24T10:00:00Z', decision: 'approved' }],
      superseded_by: 'pc-2',
    };
    expect(isProductContract(full)).toBe(true);
  });

  it('rejects contract with invalid status', () => {
    expect(isProductContract({ ...validContract, status: 'invalid' })).toBe(false);
  });

  it('rejects null', () => {
    expect(isProductContract(null)).toBe(false);
  });

  it('JSON round-trip preserves contract', () => {
    const serialized = JSON.stringify(validContract);
    const deserialized = JSON.parse(serialized);
    expect(deserialized).toEqual(validContract);
    expect(isProductContract(deserialized)).toBe(true);
  });
});
