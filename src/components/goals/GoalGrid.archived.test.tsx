import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Goal } from '@/types/goals';

const goals: Goal[] = [
  {
    id: 'active-item-1',
    type: 'item',
    title: 'Active Road Bike',
    status: 'active',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as Goal,
  {
    id: 'archived-item-1',
    type: 'item',
    title: 'Archived Road Bike',
    status: 'archived',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
  } as Goal,
];

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/store/useGoalsStore', () => ({
  useGoalsStore: () => ({
    goals,
    deleteGoal: vi.fn(),
    archiveGoal: vi.fn(),
    searchAndUpdateGoal: vi.fn(),
    fetchGoals: vi.fn(),
  }),
}));

vi.mock('@/store/useViewStore', () => ({
  useViewStore: () => ({
    activeCategory: 'all',
    viewMode: 'card',
  }),
}));

vi.mock('@/store/useFinanceStore', () => ({
  useFinanceStore: () => ({ syncFinanceGoal: vi.fn() }),
}));

vi.mock('./ItemGoalCard', () => ({
  ItemGoalCard: ({ goal }: { goal: Goal }) => <article>{goal.title}</article>,
}));

vi.mock('./StackedItemGoalCard', () => ({
  StackedItemGoalCard: ({ goals: stackedGoals }: { goals: Goal[] }) => (
    <article>{stackedGoals.map((goal) => goal.title).join(', ')}</article>
  ),
}));

vi.mock('./FinanceGoalCard', () => ({
  FinanceGoalCard: ({ goal }: { goal: Goal }) => <article>{goal.title}</article>,
}));

vi.mock('./ActionGoalCard', () => ({
  ActionGoalCard: ({ goal }: { goal: Goal }) => <article>{goal.title}</article>,
}));

vi.mock('./GroupGoalCard', () => ({
  GroupGoalCard: ({ goal }: { goal: Goal }) => <article>{goal.title}</article>,
}));

import { GoalGrid } from './GoalGrid';

describe('GoalGrid archived visibility', () => {
  it('includes archived goals only when requested', () => {
    const { rerender } = render(
      <MemoryRouter>
        <GoalGrid showArchived={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Active Road Bike')).toBeInTheDocument();
    expect(screen.queryByText('Archived Road Bike')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <GoalGrid showArchived />
      </MemoryRouter>,
    );

    expect(screen.getByText('Archived Road Bike')).toBeInTheDocument();
  });
});
