import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const openPlaidLink = vi.fn();
const syncAccount = vi.fn();
const reconnectAccount = vi.fn();
const removeAccount = vi.fn();
const fetchAccounts = vi.fn();
const showSyncing = vi.fn();
const showSuccess = vi.fn();
const showError = vi.fn();
const fetchOverview = vi.fn();
const fetchCashflow = vi.fn();
const fetchGoalForecasts = vi.fn();
const fetchManualAccounts = vi.fn();
const fetchManualCashflows = vi.fn();
let reconnectRequiredAccounts: Record<string, string> = {};

vi.mock('@/store/useGoalsStore', () => ({
  useGoalsStore: () => ({ goals: [] }),
}));

vi.mock('@/store/useFinanceStore', () => ({
  useFinanceStore: () => ({ syncFinanceGoal: vi.fn() }),
}));

vi.mock('@/store/useProjectionStore', () => ({
  useProjectionStore: (selector: (state: unknown) => unknown) =>
    selector({
      fetchOverview,
      fetchCashflow,
      fetchGoalForecasts,
      fetchManualAccounts,
      fetchManualCashflows,
    }),
}));

vi.mock('@/hooks/usePlaidLink', () => ({
  usePlaid: () => ({
    open: openPlaidLink,
    ready: true,
    isLoading: false,
    error: null,
    accounts: [
      {
        id: 'acct_1',
        plaidAccountId: 'plaid_1',
        accountName: 'Checking',
        accountType: 'depository',
        accountSubtype: 'checking',
        currentBalance: 1200,
        currency: 'USD',
        mask: '1234',
        institutionName: 'Capital One',
      },
    ],
    pendingAccounts: [],
    fetchAccounts,
    syncAccount,
    reconnectAccount,
    removeAccount,
    isSyncing: null,
    reconnectRequiredAccounts,
  }),
}));

vi.mock('@/components/projections/ProjectionHero', () => ({
  ProjectionHero: () => <div>ProjectionHero</div>,
}));

vi.mock('@/components/projections/ProjectionChartCard', () => ({
  ProjectionChartCard: () => <div>ProjectionChartCard</div>,
}));

vi.mock('@/components/projections/GoalForecastCard', () => ({
  GoalForecastCard: () => <div>GoalForecastCard</div>,
}));

vi.mock('@/components/projections/RecurringCashflowCard', () => ({
  RecurringCashflowCard: () => <div>RecurringCashflowCard</div>,
}));

vi.mock('@/components/projections/ScenarioControls', () => ({
  ScenarioControls: () => <div>ScenarioControls</div>,
}));

vi.mock('@/components/projections/AccountCoverageCard', () => ({
  AccountCoverageCard: () => <div>AccountCoverageCard</div>,
}));

vi.mock('@/components/plaid/TransactionModal', () => ({
  TransactionModal: () => null,
}));

vi.mock('@/components/ui/SyncToast', () => ({
  SyncToast: () => null,
  useSyncToast: () => ({
    isVisible: false,
    status: 'idle',
    message: '',
    close: vi.fn(),
    showSyncing,
    showSuccess,
    showError,
  }),
}));

vi.mock('@/services/finicityService', () => ({
  finicityService: {
    createConnectUrl: vi.fn(),
  },
}));

import { FinancialSummary } from './FinancialSummary';

describe('FinancialSummary add account modal', () => {
  beforeEach(() => {
    openPlaidLink.mockReset();
    syncAccount.mockReset();
    reconnectAccount.mockReset();
    showSyncing.mockReset();
    showSuccess.mockReset();
    showError.mockReset();
    reconnectRequiredAccounts = {};
    fetchOverview.mockReset();
    fetchCashflow.mockReset();
    fetchGoalForecasts.mockReset();
    fetchManualAccounts.mockReset();
    fetchManualCashflows.mockReset();
  });

  it('opens the shared add-account chooser from an account section plus button', async () => {
    render(<FinancialSummary />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle accounts' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add Cash Accounts' }));

    expect(await screen.findByRole('heading', { name: 'Add Account' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Link with Plaid/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Manual Account/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Manual Cashflow/ })).not.toBeInTheDocument();
  }, 15_000);

  it('toggles between the overview and bank accounts in the same content area', async () => {
    render(<FinancialSummary />);

    const toggle = screen.getByRole('button', { name: 'Toggle accounts' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('ProjectionHero')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bank accounts' })).not.toBeInTheDocument();

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('heading', { name: 'Bank accounts' })).toBeInTheDocument();
      expect(screen.queryByText('ProjectionHero')).not.toBeInTheDocument();
    });

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByText('ProjectionHero')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Bank accounts' })).not.toBeInTheDocument();
    });
  });

  it('shows an error toast when bulk sync fails', async () => {
    syncAccount.mockRejectedValueOnce(new Error('Internal server error'));

    render(<FinancialSummary />);

    fireEvent.click(screen.getByRole('button', { name: 'Sync all accounts' }));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith('Could not sync accounts');
    });
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it('refetches projections after a successful bulk sync', async () => {
    syncAccount.mockResolvedValueOnce(undefined);

    render(<FinancialSummary />);

    fetchOverview.mockClear();
    fetchCashflow.mockClear();
    fetchGoalForecasts.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Sync all accounts' }));

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalledWith('1 accounts synced');
    });
    expect(fetchOverview).toHaveBeenCalledTimes(1);
    expect(fetchCashflow).toHaveBeenCalledTimes(1);
    expect(fetchGoalForecasts).toHaveBeenCalledTimes(1);
  });

  it('renders a reconnect action for accounts that require investment consent', () => {
    reconnectRequiredAccounts = {
      acct_1: 'Reconnect this investment account to grant investments access.',
    };

    render(<FinancialSummary />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle accounts' }));

    expect(screen.getByRole('button', { name: 'Reconnect account' })).toBeInTheDocument();
  });

  it('opens Plaid reconnect flow from a reconnect-required account card', () => {
    reconnectRequiredAccounts = {
      acct_1: 'Reconnect this investment account to grant investments access.',
    };

    render(<FinancialSummary />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle accounts' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reconnect account' }));

    expect(reconnectAccount).toHaveBeenCalledWith('acct_1');
  });
});
