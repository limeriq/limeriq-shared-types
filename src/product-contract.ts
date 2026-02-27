/**
 * Product Contract schema types.
 *
 * A Product Contract captures the product-level intent, acceptance criteria,
 * success metrics, risks, and approval workflow for a deliverable.
 */

// ── Product Contract Status ──

export const ProductContractStatus = {
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUPERSEDED: 'superseded',
} as const;

export type ProductContractStatus = (typeof ProductContractStatus)[keyof typeof ProductContractStatus];

export function isProductContractStatus(value: unknown): value is ProductContractStatus {
  return typeof value === 'string' && Object.values(ProductContractStatus).includes(value as ProductContractStatus);
}

// ── Contract Risk Tier ──

export const ContractRiskTier = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type ContractRiskTier = (typeof ContractRiskTier)[keyof typeof ContractRiskTier];

export function isContractRiskTier(value: unknown): value is ContractRiskTier {
  return typeof value === 'string' && Object.values(ContractRiskTier).includes(value as ContractRiskTier);
}

// ── Success Metric ──

export interface SuccessMetric {
  metric_id: string;
  description: string;
  target_value: string;
  measurement_method: string;
}

export function isSuccessMetric(value: unknown): value is SuccessMetric {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.metric_id === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.target_value === 'string' &&
    typeof obj.measurement_method === 'string'
  );
}

// ── Acceptance Criterion ──

export interface AcceptanceCriterion {
  criterion_id: string;
  description: string;
  verification_method: string;
}

export function isAcceptanceCriterion(value: unknown): value is AcceptanceCriterion {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.criterion_id === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.verification_method === 'string'
  );
}

// ── Contract Risk ──

export interface ContractRisk {
  risk_id: string;
  description: string;
  tier: ContractRiskTier;
  mitigation?: string;
}

export function isContractRisk(value: unknown): value is ContractRisk {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.risk_id === 'string' &&
    typeof obj.description === 'string' &&
    isContractRiskTier(obj.tier) &&
    (obj.mitigation === undefined || typeof obj.mitigation === 'string')
  );
}

// ── Contract Approval ──

export interface ContractApproval {
  approver: string;
  approved_at: string;
  decision: string;
  comments?: string;
}

export function isContractApproval(value: unknown): value is ContractApproval {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.approver === 'string' &&
    typeof obj.approved_at === 'string' &&
    typeof obj.decision === 'string' &&
    (obj.comments === undefined || typeof obj.comments === 'string')
  );
}

// ── Product Contract Intent ──

export interface ProductContractIntent {
  intent_id: string;
  title: string;
  description: string;
  success_metrics: SuccessMetric[];
  acceptance_criteria: AcceptanceCriterion[];
}

export function isProductContractIntent(value: unknown): value is ProductContractIntent {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (
    typeof obj.intent_id !== 'string' ||
    typeof obj.title !== 'string' ||
    typeof obj.description !== 'string' ||
    !Array.isArray(obj.success_metrics) ||
    !Array.isArray(obj.acceptance_criteria)
  ) return false;
  for (const m of obj.success_metrics as unknown[]) {
    if (!isSuccessMetric(m)) return false;
  }
  for (const c of obj.acceptance_criteria as unknown[]) {
    if (!isAcceptanceCriterion(c)) return false;
  }
  return true;
}

// ── Product Contract ──

export interface ProductContract {
  contract_id: string;
  version: number;
  status: ProductContractStatus;
  title: string;
  description: string;
  intents: ProductContractIntent[];
  risks: ContractRisk[];
  created_at: string;
  updated_at: string;
  approvals?: ContractApproval[];
  superseded_by?: string;
}

export function isProductContract(value: unknown): value is ProductContract {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (
    typeof obj.contract_id !== 'string' ||
    typeof obj.version !== 'number' ||
    !isProductContractStatus(obj.status) ||
    typeof obj.title !== 'string' ||
    typeof obj.description !== 'string' ||
    !Array.isArray(obj.intents) ||
    !Array.isArray(obj.risks) ||
    typeof obj.created_at !== 'string' ||
    typeof obj.updated_at !== 'string'
  ) return false;
  for (const i of obj.intents as unknown[]) {
    if (!isProductContractIntent(i)) return false;
  }
  for (const r of obj.risks as unknown[]) {
    if (!isContractRisk(r)) return false;
  }
  if (obj.approvals !== undefined) {
    if (!Array.isArray(obj.approvals)) return false;
    for (const a of obj.approvals as unknown[]) {
      if (!isContractApproval(a)) return false;
    }
  }
  if (obj.superseded_by !== undefined && typeof obj.superseded_by !== 'string') return false;
  return true;
}
