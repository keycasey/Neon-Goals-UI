import { beforeEach, describe, expect, it, vi } from 'vitest';

const goalsReset = vi.fn();
const financeReset = vi.fn();
const chatReset = vi.fn();
const projectionReset = vi.fn();
const wishlistReset = vi.fn();

vi.mock('./useGoalsStore', () => ({
  useGoalsStore: {
    getState: () => ({ resetStore: goalsReset }),
  },
}));

vi.mock('./useFinanceStore', () => ({
  useFinanceStore: {
    getState: () => ({ resetStore: financeReset }),
  },
}));

vi.mock('./useChatStore', () => ({
  useChatStore: {
    getState: () => ({ resetStore: chatReset }),
  },
}));

vi.mock('./useProjectionStore', () => ({
  useProjectionStore: {
    getState: () => ({ resetStore: projectionReset }),
  },
}));

vi.mock('./useWishlistStore', () => ({
  useWishlistStore: {
    getState: () => ({ resetStore: wishlistReset }),
  },
}));

import { resetUserScopedState } from './resetUserScopedState';

describe('resetUserScopedState', () => {
  beforeEach(() => {
    goalsReset.mockReset();
    financeReset.mockReset();
    chatReset.mockReset();
    projectionReset.mockReset();
    wishlistReset.mockReset();
  });

  it('clears all user-scoped stores', () => {
    resetUserScopedState();

    expect(goalsReset).toHaveBeenCalledTimes(1);
    expect(financeReset).toHaveBeenCalledTimes(1);
    expect(chatReset).toHaveBeenCalledTimes(1);
    expect(projectionReset).toHaveBeenCalledTimes(1);
    expect(wishlistReset).toHaveBeenCalledTimes(1);
  });
});
