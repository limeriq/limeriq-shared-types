/**
 * Handoff Manifest schema types.
 *
 * A Handoff Manifest decomposes a product contract into executable tasks
 * with dependencies, parallel groups, and status tracking for agent handoffs.
 */

// ── Handoff Task Type ──

export const HandoffTaskType = {
  IMPLEMENTATION: 'implementation',
  TEST: 'test',
  DOCUMENTATION: 'documentation',
  ROLLOUT: 'rollout',
  REVIEW: 'review',
} as const;

export type HandoffTaskType = (typeof HandoffTaskType)[keyof typeof HandoffTaskType];

export function isHandoffTaskType(value: unknown): value is HandoffTaskType {
  return typeof value === 'string' && Object.values(HandoffTaskType).includes(value as HandoffTaskType);
}

// ── Handoff Task Status ──

export const HandoffTaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  SKIPPED: 'skipped',
} as const;

export type HandoffTaskStatus = (typeof HandoffTaskStatus)[keyof typeof HandoffTaskStatus];

export function isHandoffTaskStatus(value: unknown): value is HandoffTaskStatus {
  return typeof value === 'string' && Object.values(HandoffTaskStatus).includes(value as HandoffTaskStatus);
}

// ── Handoff Task ──

export interface HandoffTask {
  task_id: string;
  title: string;
  task_type: HandoffTaskType;
  status: HandoffTaskStatus;
  description: string;
  depends_on?: string[];
  parallel_group?: string;
  assignee?: string;
}

export function isHandoffTask(value: unknown): value is HandoffTask {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (
    typeof obj.task_id !== 'string' ||
    typeof obj.title !== 'string' ||
    !isHandoffTaskType(obj.task_type) ||
    !isHandoffTaskStatus(obj.status) ||
    typeof obj.description !== 'string'
  ) return false;
  if (obj.depends_on !== undefined) {
    if (!Array.isArray(obj.depends_on)) return false;
    for (const d of obj.depends_on as unknown[]) {
      if (typeof d !== 'string') return false;
    }
  }
  if (obj.parallel_group !== undefined && typeof obj.parallel_group !== 'string') return false;
  if (obj.assignee !== undefined && typeof obj.assignee !== 'string') return false;
  return true;
}

// ── Handoff Manifest ──

export interface HandoffManifest {
  manifest_id: string;
  contract_id: string;
  created_at: string;
  tasks: HandoffTask[];
}

export function isHandoffManifest(value: unknown): value is HandoffManifest {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (
    typeof obj.manifest_id !== 'string' ||
    typeof obj.contract_id !== 'string' ||
    typeof obj.created_at !== 'string' ||
    !Array.isArray(obj.tasks)
  ) return false;
  for (const t of obj.tasks as unknown[]) {
    if (!isHandoffTask(t)) return false;
  }
  return true;
}

// ── Dependency Validation ──

/**
 * Validates task dependencies: checks for broken references and cycles.
 * Returns an array of error strings (empty if valid).
 */
export function validateHandoffDependencies(tasks: HandoffTask[]): string[] {
  const errors: string[] = [];
  const taskIds = new Set(tasks.map(t => t.task_id));

  // Check for broken references
  for (const task of tasks) {
    if (task.depends_on) {
      for (const dep of task.depends_on) {
        if (!taskIds.has(dep)) {
          errors.push(`Task "${task.task_id}" depends on unknown task "${dep}"`);
        }
      }
    }
  }

  // Check for cycles using DFS
  const adjacency = new Map<string, string[]>();
  for (const task of tasks) {
    adjacency.set(task.task_id, task.depends_on ?? []);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (inStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    inStack.add(nodeId);
    const deps = adjacency.get(nodeId) ?? [];
    for (const dep of deps) {
      if (adjacency.has(dep) && hasCycle(dep)) return true;
    }
    inStack.delete(nodeId);
    return false;
  }

  for (const task of tasks) {
    visited.clear();
    inStack.clear();
    if (hasCycle(task.task_id)) {
      errors.push(`Dependency cycle detected involving task "${task.task_id}"`);
      break;
    }
  }

  return errors;
}
