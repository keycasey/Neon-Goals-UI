import { describe, expect, it } from 'vitest';
import { getGoalPulseEntries } from './goalPulse';
import type { ActionGoal, ItemGoal } from '@/types/goals';

const base = { description: '', status: 'active' as const, createdAt: new Date(), updatedAt: new Date() };

describe('getGoalPulseEntries', () => {
  it('prioritizes stalled action goals and filters undated product research', () => {
    const action = { ...base, id: 'action', type: 'action' as const, title: 'Launch project', completionPercentage: 0, tasks: [] } satisfies ActionGoal;
    const item = { ...base, id: 'item', type: 'item' as const, title: 'Headphones' } as ItemGoal;

    const result = getGoalPulseEntries([item, action]);

    expect(result.map(({ goal }) => goal.id)).toEqual(['action']);
    expect(result[0].needsAction).toBe(true);
  });
});
