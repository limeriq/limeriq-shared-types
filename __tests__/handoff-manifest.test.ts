import { describe, it, expect } from 'vitest';
import {
  HandoffTaskType,
  isHandoffTaskType,
  HandoffTaskStatus,
  isHandoffTaskStatus,
  isHandoffTask,
  isHandoffManifest,
  validateHandoffDependencies,
} from '../src/handoff-manifest';

import type {
  HandoffTask,
  HandoffManifest,
} from '../src/handoff-manifest';

// ── Enum uniqueness ──

describe('handoff-manifest enums', () => {
  it('HandoffTaskType has no duplicate values', () => {
    const values = Object.values(HandoffTaskType);
    expect(new Set(values).size).toBe(values.length);
  });

  it('HandoffTaskType values are all strings', () => {
    for (const val of Object.values(HandoffTaskType)) {
      expect(typeof val).toBe('string');
    }
  });

  it('HandoffTaskStatus has no duplicate values', () => {
    const values = Object.values(HandoffTaskStatus);
    expect(new Set(values).size).toBe(values.length);
  });

  it('HandoffTaskStatus values are all strings', () => {
    for (const val of Object.values(HandoffTaskStatus)) {
      expect(typeof val).toBe('string');
    }
  });
});

// ── Enum type guards ──

describe('enum type guards', () => {
  it('isHandoffTaskType accepts valid', () => {
    for (const t of ['implementation', 'test', 'documentation', 'rollout', 'review']) {
      expect(isHandoffTaskType(t)).toBe(true);
    }
  });

  it('isHandoffTaskType rejects invalid', () => {
    expect(isHandoffTaskType('deploy')).toBe(false);
    expect(isHandoffTaskType(null)).toBe(false);
  });

  it('isHandoffTaskStatus accepts valid', () => {
    for (const s of ['pending', 'in_progress', 'completed', 'blocked', 'skipped']) {
      expect(isHandoffTaskStatus(s)).toBe(true);
    }
  });

  it('isHandoffTaskStatus rejects invalid', () => {
    expect(isHandoffTaskStatus('done')).toBe(false);
    expect(isHandoffTaskStatus(undefined)).toBe(false);
  });
});

// ── Task validation ──

describe('isHandoffTask', () => {
  const validTask: HandoffTask = {
    task_id: 'ht-1',
    title: 'Implement login API',
    task_type: 'implementation',
    status: 'pending',
    description: 'Build the /login endpoint',
  };

  it('accepts valid task', () => {
    expect(isHandoffTask(validTask)).toBe(true);
  });

  it('accepts task with optional fields', () => {
    expect(isHandoffTask({
      ...validTask,
      depends_on: ['ht-0'],
      parallel_group: 'group-a',
      assignee: 'agent-1',
    })).toBe(true);
  });

  it('rejects task with invalid task_type', () => {
    expect(isHandoffTask({ ...validTask, task_type: 'deploy' })).toBe(false);
  });

  it('rejects null', () => {
    expect(isHandoffTask(null)).toBe(false);
  });
});

// ── Manifest validation ──

describe('isHandoffManifest', () => {
  const validManifest: HandoffManifest = {
    manifest_id: 'hm-1',
    contract_id: 'pc-1',
    created_at: '2026-02-24T10:00:00Z',
    tasks: [
      { task_id: 'ht-1', title: 'Task 1', task_type: 'implementation', status: 'pending', description: 'desc' },
      { task_id: 'ht-2', title: 'Task 2', task_type: 'test', status: 'pending', description: 'desc', depends_on: ['ht-1'] },
    ],
  };

  it('accepts valid manifest', () => {
    expect(isHandoffManifest(validManifest)).toBe(true);
  });

  it('rejects manifest with invalid task', () => {
    expect(isHandoffManifest({
      manifest_id: 'hm-1',
      contract_id: 'pc-1',
      created_at: 'ts',
      tasks: [{ task_id: 'ht-1' }],
    })).toBe(false);
  });

  it('rejects null', () => {
    expect(isHandoffManifest(null)).toBe(false);
  });
});

// ── Dependency validation ──

describe('validateHandoffDependencies', () => {
  it('returns no errors for valid dependencies', () => {
    const tasks: HandoffTask[] = [
      { task_id: 'ht-1', title: 'T1', task_type: 'implementation', status: 'pending', description: 'd' },
      { task_id: 'ht-2', title: 'T2', task_type: 'test', status: 'pending', description: 'd', depends_on: ['ht-1'] },
    ];
    expect(validateHandoffDependencies(tasks)).toEqual([]);
  });

  it('detects broken dependency references', () => {
    const tasks: HandoffTask[] = [
      { task_id: 'ht-1', title: 'T1', task_type: 'implementation', status: 'pending', description: 'd', depends_on: ['ht-missing'] },
    ];
    const errors = validateHandoffDependencies(tasks);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('ht-missing');
  });

  it('detects dependency cycles', () => {
    const tasks: HandoffTask[] = [
      { task_id: 'ht-1', title: 'T1', task_type: 'implementation', status: 'pending', description: 'd', depends_on: ['ht-2'] },
      { task_id: 'ht-2', title: 'T2', task_type: 'test', status: 'pending', description: 'd', depends_on: ['ht-1'] },
    ];
    const errors = validateHandoffDependencies(tasks);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.toLowerCase().includes('cycle'))).toBe(true);
  });
});
