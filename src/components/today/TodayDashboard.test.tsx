import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodayDashboard } from './TodayDashboard';
import { useGoalsStore } from '@/store/useGoalsStore';
import type { ActionGoal } from '@/types/goals';

const todayTaskGoal: ActionGoal = {
  id: 'goal_1',
  type: 'action',
  title: 'Upgrade the bathroom',
  description: 'Install a useful fixture',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  deadline: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  completionPercentage: 0,
  tasks: [{
    id: 'task_1',
    title: 'Measure the available space',
    completed: false,
    createdAt: new Date(),
    scheduledFor: new Date().toISOString(),
  }],
};

describe('TodayDashboard', () => {
  beforeEach(() => {
    useGoalsStore.setState({ goals: [todayTaskGoal], isLoading: false, error: null });
  });

  it('keeps today’s action visibly tied to its larger goal', () => {
    render(<TodayDashboard />);
    expect(screen.getByText('Measure the available space')).toBeInTheDocument();
    expect(screen.getAllByText('Upgrade the bathroom').length).toBeGreaterThan(0);
    expect(screen.getByText(/remaining/)).toBeInTheDocument();
  });
});
