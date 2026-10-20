import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('@/store/useViewStore', () => ({
  useViewStore: () => ({
    activeCategory: 'all',
    viewMode: 'card',
    setViewMode: vi.fn(),
  }),
}));

import { GoalSortBar } from './GoalSortBar';

describe('GoalSortBar archived toggle', () => {
  it('requests archived goals when pressed', () => {
    const onShowArchivedChange = vi.fn();

    render(
      <GoalSortBar
        sortBy="createdAt"
        onSortChange={vi.fn()}
        showArchived={false}
        onShowArchivedChange={onShowArchivedChange}
      />,
    );

    const toggle = screen.getByRole('button', { name: 'Show archived' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);

    expect(onShowArchivedChange).toHaveBeenCalledWith(true);
  });
});
