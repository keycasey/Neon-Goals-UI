import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaidLinkOnSuccess } from 'react-plaid-link';
import type { PlaidAccount } from '@/services/plaidService';

const mocks = vi.hoisted(() => ({
  createLinkToken: vi.fn(),
  linkAccount: vi.fn(),
  fetchPlaidAccounts: vi.fn(),
  addPlaidAccounts: vi.fn(),
  removePlaidAccount: vi.fn(),
  syncPlaidAccount: vi.fn(),
  fetchOverview: vi.fn(),
  fetchCashflow: vi.fn(),
  fetchGoalForecasts: vi.fn(),
  capturedOnSuccess: null as PlaidLinkOnSuccess | null,
  isDemoMode: false,
  plaidAccounts: [] as PlaidAccount[],
}));

vi.mock('react-plaid-link', () => ({
  usePlaidLink: (config: { onSuccess: PlaidLinkOnSuccess }) => {
    mocks.capturedOnSuccess = config.onSuccess;
    return { open: vi.fn(), ready: true };
  },
}));

vi.mock('@/services/plaidService', () => ({
  plaidService: {
    createLinkToken: mocks.createLinkToken,
    linkAccount: mocks.linkAccount,
  },
}));

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({
    isDemoMode: mocks.isDemoMode,
  }),
}));

vi.mock('@/store/useFinanceStore', () => ({
  useFinanceStore: () => ({
    plaidAccounts: mocks.plaidAccounts,
    fetchPlaidAccounts: mocks.fetchPlaidAccounts,
    addPlaidAccounts: mocks.addPlaidAccounts,
    removePlaidAccount: mocks.removePlaidAccount,
    syncPlaidAccount: mocks.syncPlaidAccount,
  }),
}));

vi.mock('@/store/useProjectionStore', () => ({
  useProjectionStore: (selector: (state: unknown) => unknown) =>
    selector({
      fetchOverview: mocks.fetchOverview,
      fetchCashflow: mocks.fetchCashflow,
      fetchGoalForecasts: mocks.fetchGoalForecasts,
    }),
}));

import { usePlaid } from './usePlaidLink';

describe('usePlaid link success', () => {
  beforeEach(() => {
    mocks.isDemoMode = false;
    mocks.plaidAccounts = [];
    mocks.capturedOnSuccess = null;
    mocks.createLinkToken.mockReset();
    mocks.linkAccount.mockReset();
    mocks.fetchPlaidAccounts.mockReset();
    mocks.addPlaidAccounts.mockReset();
    mocks.removePlaidAccount.mockReset();
    mocks.syncPlaidAccount.mockReset();
    mocks.fetchOverview.mockReset();
    mocks.fetchCashflow.mockReset();
    mocks.fetchGoalForecasts.mockReset();
  });

  it('fetches backend-backed plaid accounts in demo mode instead of seeding local placeholders', () => {
    mocks.isDemoMode = true;

    renderHook(() => usePlaid());

    expect(mocks.fetchPlaidAccounts).toHaveBeenCalledTimes(1);
    expect(mocks.addPlaidAccounts).not.toHaveBeenCalled();
  });

  it('requests a real link token when opening link flow in demo mode', async () => {
    mocks.isDemoMode = true;
    mocks.createLinkToken.mockResolvedValue({
      link_token: 'demo-link-token',
      expiration: '2026-04-07T00:00:00.000Z',
      request_id: 'req_1',
    });
    const { result } = renderHook(() => usePlaid());

    await act(async () => {
      await result.current.open();
    });

    expect(mocks.addPlaidAccounts).not.toHaveBeenCalled();
    expect(mocks.createLinkToken).toHaveBeenCalledTimes(1);
  });

  it('refreshes projection data after linking accounts', async () => {
    mocks.linkAccount.mockResolvedValue({
      accounts: [
        {
          id: 'acct_1',
          plaidAccountId: 'plaid_1',
          accountName: 'Checking',
          accountType: 'depository',
          accountSubtype: 'checking',
          currentBalance: 1200,
          currency: 'USD',
          institutionName: 'Capital One',
        },
      ],
    });

    renderHook(() => usePlaid());

    expect(mocks.capturedOnSuccess).toBeTruthy();

    await act(async () => {
      await mocks.capturedOnSuccess?.('public-token', {
        institution: { name: 'Capital One', institution_id: 'ins_1' },
        accounts: [],
        link_session_id: 'session_1',
      });
    });

    expect(mocks.addPlaidAccounts).toHaveBeenCalledTimes(1);
    expect(mocks.fetchOverview).toHaveBeenCalledTimes(1);
    expect(mocks.fetchCashflow).toHaveBeenCalledTimes(1);
    expect(mocks.fetchGoalForecasts).toHaveBeenCalledTimes(1);
  });
});
