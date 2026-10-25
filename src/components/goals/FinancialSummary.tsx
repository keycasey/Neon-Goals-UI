import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingUp, Target, Wallet, Landmark, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useProjectionStore } from '@/store/useProjectionStore';
import type { FinanceGoal } from '@/types/goals';
import { PlaidAccountCard } from '@/components/plaid/PlaidAccountCard';
import { AccountSectionEmpty } from '@/components/plaid/AccountSectionEmpty';
import { TransactionModal } from '@/components/plaid/TransactionModal';
import { usePlaid, type PendingPlaidAccount } from '@/hooks/usePlaidLink';
import { SyncToast, useSyncToast } from '@/components/ui/SyncToast';
import type { PlaidAccount } from '@/services/plaidService';
import { ApiClientError } from '@/services/apiClient';
import { ProjectionHero } from '@/components/projections/ProjectionHero';
import { ProjectionChartCard } from '@/components/projections/ProjectionChartCard';
import { GoalForecastCard } from '@/components/projections/GoalForecastCard';
import { RecurringCashflowCard } from '@/components/projections/RecurringCashflowCard';
import { ScenarioControls } from '@/components/projections/ScenarioControls';
import { AccountLinkDialog } from '@/components/projections/AccountLinkDialog';
import { ManualAccountDialog } from '@/components/projections/ManualAccountDialog';
import { ManualCashflowDialog } from '@/components/projections/ManualCashflowDialog';
import { finicityService } from '@/services/finicityService';
import { projectionsService } from '@/services/projectionsService';
import type { RecurringItem } from '@/types/projections';

interface FinancialSummaryProps {
  className?: string;
}

// Map Plaid account types to our section categories
// Also check accountSubtype since Plaid uses 'depository' type with 'checking'/'savings' subtype
const getCashAccounts = (accounts: PlaidAccount[]) =>
  accounts.filter(a => {
    const type = a.accountType.toLowerCase();
    const subtype = a.accountSubtype?.toLowerCase() || '';
    // Cash: depository accounts (checking, savings, money market, cd)
    return (
      type === 'depository' ||
      ['checking', 'savings', 'money_market', 'cd', 'paypal'].includes(subtype)
    );
  });

const getInvestmentAccounts = (accounts: PlaidAccount[]) =>
  accounts.filter(a => {
    const type = a.accountType.toLowerCase();
    const subtype = a.accountSubtype?.toLowerCase() || '';
    // Investments & Retirement: investment/brokerage accounts
    return (
      type === 'investment' ||
      type === 'brokerage' ||
      ['ira', '401k', 'roth', 'brokerage', 'hsa'].includes(subtype)
    );
  });

const getCreditAccounts = (accounts: PlaidAccount[]) =>
  accounts.filter(a => {
    const type = a.accountType.toLowerCase();
    const subtype = a.accountSubtype?.toLowerCase() || '';
    // Credit & Loans: credit cards and loans
    return (
      type === 'credit' ||
      type === 'loan' ||
      ['credit_card', 'auto', 'mortgage', 'student', 'loan'].includes(subtype)
    );
  });

const isDebtType = (type: string, subtype?: string) => {
  const typeLower = type.toLowerCase();
  const subtypeLower = subtype?.toLowerCase() || '';
  return (
    ['credit', 'loan'].includes(typeLower) ||
    ['credit_card', 'auto', 'mortgage', 'student', 'loan'].includes(subtypeLower)
  );
};

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ className }) => {
  const { goals } = useGoalsStore();
  const { syncFinanceGoal } = useFinanceStore();
  const fetchOverview = useProjectionStore((s) => s.fetchOverview);
  const fetchCashflow = useProjectionStore((s) => s.fetchCashflow);
  const fetchGoalForecasts = useProjectionStore((s) => s.fetchGoalForecasts);
  const fetchManualAccounts = useProjectionStore((s) => s.fetchManualAccounts);
  const fetchManualCashflows = useProjectionStore((s) => s.fetchManualCashflows);
  const [showAccounts, setShowAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<PlaidAccount | null>(null);
  const [selectedRecurringItem, setSelectedRecurringItem] = useState<RecurringItem | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showCashflowDialog, setShowCashflowDialog] = useState(false);
  const [isOpeningFinicity, setIsOpeningFinicity] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [manualCashflowDefaults, setManualCashflowDefaults] = useState<{
    label?: string;
    amount?: number;
    type?: 'income' | 'expense';
    category?: string;
  } | null>(null);
  const syncToast = useSyncToast();
  const {
    open: openPlaidLink,
    isLoading: isPlaidLoading,
    error: plaidError,
    accounts,
    pendingAccounts,
    syncAccount,
    reconnectAccount,
    removeAccount,
    isSyncing,
    fetchAccounts,
    reconnectRequiredAccounts,
  } = usePlaid();
  const finicityEnabled = import.meta.env.VITE_ENABLE_FINICITY_PROBE === 'true';
  const refreshProjectionData = React.useCallback(async () => {
    await Promise.all([
      fetchOverview(),
      fetchCashflow(),
      fetchGoalForecasts(),
    ]);
  }, [fetchOverview, fetchCashflow, fetchGoalForecasts]);

  // Fetch projection data on mount
  useEffect(() => {
    refreshProjectionData();
    fetchManualAccounts();
    fetchManualCashflows();
  }, [refreshProjectionData, fetchManualAccounts, fetchManualCashflows]);

  const financeGoals = goals.filter(
    (goal): goal is FinanceGoal => goal.type === 'finance' && goal.status === 'active'
  );

  // Calculate totals from Plaid accounts
  const totalAssets = accounts
    .filter(a => !isDebtType(a.accountType, a.accountSubtype) && !a.isDebt)
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const totalDebt = accounts
    .filter(a => isDebtType(a.accountType, a.accountSubtype) || a.isDebt)
    .reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);
  const netWorth = totalAssets - totalDebt;

  const totalBalance = financeGoals.reduce((sum, goal) => sum + goal.currentBalance, 0);
  const totalTarget = financeGoals.reduce((sum, goal) => sum + goal.targetBalance, 0);
  const goalsOnTrack = financeGoals.filter(goal => {
    const progress = goal.currentBalance / goal.targetBalance;
    return progress >= 0.5;
  }).length;

  const syncAll = async () => {
    if (isSyncingAll) {
      return;
    }

    setIsSyncingAll(true);
    syncToast.showSyncing('Updating all accounts...');

    try {
      let syncedCount = 0;
      let reconnectCount = 0;

      // Sync Plaid accounts
      for (const account of accounts) {
        try {
          await syncAccount(account.id);
          syncedCount += 1;
        } catch (error) {
          if (error instanceof ApiClientError && error.code === 'PLAID_INVESTMENTS_CONSENT_REQUIRED') {
            reconnectCount += 1;
            continue;
          }
          throw error;
        }
      }
      // Sync finance goals
      financeGoals.forEach(goal => syncFinanceGoal(goal.id, goals));
      await refreshProjectionData();
      if (reconnectCount > 0) {
        syncToast.showError(
          reconnectCount === 1
            ? '1 investment account needs reconnect'
            : `${reconnectCount} investment accounts need reconnect`
        );
      } else {
        syncToast.showSuccess(`${syncedCount} accounts synced`);
      }
    } catch (error) {
      syncToast.showError('Could not sync accounts');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleAccountSync = async (accountId: string) => {
    try {
      await syncAccount(accountId);
      await refreshProjectionData();
    } catch (error) {
      if (error instanceof ApiClientError && error.code === 'PLAID_INVESTMENTS_CONSENT_REQUIRED') {
        syncToast.showError('Reconnect this investment account to grant investments access');
        return;
      }
      throw error;
    }
  };

  const handleAccountClick = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setSelectedAccount(account);
      setSelectedRecurringItem(null);
    }
  };

  const handleRecurringItemSelect = (
    item: RecurringItem,
    direction: 'income' | 'expense',
  ) => {
    if (!item.accountId) {
      return;
    }

    const account = accounts.find((candidate) => candidate.id === item.accountId);
    if (!account) {
      return;
    }

    setSelectedAccount(account);
    setSelectedRecurringItem({
      ...item,
      source: item.source,
      mergedSources: item.mergedSources,
      sourceTransactionIds: item.sourceTransactionIds,
      id: item.id,
      label: item.label,
      amount: item.amount,
      cadence: item.cadence,
      confidence: item.confidence,
      category: item.category,
    });
  };

  const openAddDialog = () => {
    setShowLinkDialog(true);
  };

  const openPlaid = () => {
    setShowLinkDialog(false);
    openPlaidLink();
  };

  const openManualAccount = () => {
    setShowLinkDialog(false);
    setShowAccountDialog(true);
  };

  const openManualCashflow = () => {
    setShowLinkDialog(false);
    setManualCashflowDefaults(null);
    setShowCashflowDialog(true);
  };

  const openManualCashflowFromTransaction = (prefill: {
    label: string;
    amount: number;
    type: 'income' | 'expense';
    category?: string;
  }) => {
    setManualCashflowDefaults(prefill);
    setShowCashflowDialog(true);
  };

  const handleMergeRecurringItems = async (
    source: RecurringItem,
    target: RecurringItem,
    direction: 'income' | 'expense',
  ) => {
    await projectionsService.mergeRecurringItems(target.id, source.id, direction);
    await refreshProjectionData();
  };

  const handleUnmergeRecurringSource = async (sourceItemId: string) => {
    if (!selectedRecurringItem) {
      return;
    }

    const direction = selectedRecurringItem.id.startsWith('income:') ? 'income' : 'expense';
    await projectionsService.unmergeRecurringItems(selectedRecurringItem.id, sourceItemId, direction);
    await refreshProjectionData();

    const refreshedCashflow = await projectionsService.getCashflow();
    const nextItem = [
      ...refreshedCashflow.recurringIncome,
      ...refreshedCashflow.recurringExpenses,
    ].find((item) => item.id === selectedRecurringItem.id);

    if (nextItem && selectedAccount) {
      setSelectedRecurringItem(nextItem);
    } else {
      setSelectedRecurringItem(null);
    }
  };

  const openFinicity = async () => {
    setIsOpeningFinicity(true);
    try {
      const response = await finicityService.createConnectUrl();
      setShowLinkDialog(false);
      window.open(response.connectUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to open Finicity probe:', error);
    } finally {
      setIsOpeningFinicity(false);
    }
  };

  // Group Plaid accounts by type
  const cashAccounts = getCashAccounts(accounts);
  const investmentAccounts = getInvestmentAccounts(accounts);
  const creditAccounts = getCreditAccounts(accounts);

  const hasAnyAccounts = accounts.length > 0;

  // Auto-expand accounts section when linking a new account
  React.useEffect(() => {
    if (isPlaidLoading) {
      setShowAccounts(true);
    }
  }, [isPlaidLoading]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("glass-card neon-border overflow-hidden", className)}
      >
        {/* Main Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-sunset flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground">
                Financial Overview
              </h3>
              <p className="text-xs text-muted-foreground">
                {accounts.length} linked accounts • {financeGoals.length} active goals
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative rounded-lg">
              {isSyncingAll && (
                <div className="pointer-events-none absolute inset-0 rounded-lg overflow-hidden">
                  <div className="absolute inset-[-80%] animate-spin bg-[conic-gradient(from_0deg,rgba(34,211,238,0.15),rgba(244,114,182,0.9),rgba(34,211,238,0.15))]" />
                  <div className="absolute inset-[1px] rounded-[7px] bg-background/90" />
                </div>
              )}
              <button
                onClick={syncAll}
                disabled={isSyncingAll}
                className={cn(
                  "relative z-10 flex items-center justify-center p-2.5 rounded-lg min-w-[44px] min-h-[44px] transition-colors",
                  isSyncingAll
                    ? "cursor-not-allowed bg-background/90 text-primary"
                    : "bg-muted/50 text-foreground hover:bg-muted"
                )}
                aria-label="Sync all accounts"
              >
                <RefreshCw className={cn("w-4 h-4", isSyncingAll && "animate-spin")} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowAccounts((isVisible) => !isVisible)}
              aria-pressed={showAccounts}
              aria-label="Toggle accounts"
              title={showAccounts ? 'Show financial overview' : 'Show bank accounts'}
              className={cn(
                "group flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3 py-2.5 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                showAccounts
                  ? "border-primary/60 bg-primary/15 text-primary shadow-[0_0_18px_hsl(var(--primary)/0.18)]"
                  : "border-transparent bg-muted/50 text-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
              )}
            >
              <Landmark className={cn("h-4 w-4 transition-transform duration-200", showAccounts && "scale-110")} />
              <span className="hidden text-sm font-medium sm:inline">Accounts</span>
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!showAccounts ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
        {/* Stats Grid - flex-wrap so cards become rows when container is narrow or values are wide */}
        <div className="flex flex-wrap gap-4">
          {/* Net Worth */}
          <div className="min-w-[140px] flex-1 basis-[calc(50%-0.5rem)] lg:basis-0 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/30 overflow-hidden">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 flex-shrink-0" />
              Net Worth
            </p>
            <p className={cn("text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-bold neon-text-magenta truncate", isPlaidLoading && !hasAnyAccounts && "animate-pulse")}>
              {isPlaidLoading && !hasAnyAccounts ? '...' : hasAnyAccounts ? `$${netWorth.toLocaleString()}` : '—'}
            </p>
          </div>

          {/* Total Assets */}
          <div className="min-w-[140px] flex-1 basis-[calc(50%-0.5rem)] lg:basis-0 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/30 overflow-hidden">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Target className="w-3 h-3 flex-shrink-0" />
              Total Assets
            </p>
            <p className={cn("text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-bold text-success truncate", isPlaidLoading && !hasAnyAccounts && "animate-pulse")}>
              {isPlaidLoading && !hasAnyAccounts ? '...' : hasAnyAccounts ? `$${totalAssets.toLocaleString()}` : '—'}
            </p>
          </div>

          {/* Total Debt */}
          <div className="min-w-[140px] flex-1 basis-[calc(50%-0.5rem)] lg:basis-0 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/30 overflow-hidden">
            <p className="text-xs text-muted-foreground mb-1">Total Debt</p>
            <p className={cn("text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-bold text-destructive truncate", isPlaidLoading && !hasAnyAccounts && "animate-pulse")}>
              {isPlaidLoading && !hasAnyAccounts ? '...' : totalDebt > 0 ? `-$${totalDebt.toLocaleString()}` : hasAnyAccounts ? '$0' : '—'}
            </p>
          </div>

          {/* Goals Progress */}
          <div className="min-w-[140px] flex-1 basis-[calc(50%-0.5rem)] lg:basis-0 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/30 overflow-hidden">
            <p className="text-xs text-muted-foreground mb-1">Goals On Track</p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-bold neon-text-cyan truncate">
              {goalsOnTrack} / {financeGoals.length}
            </p>
          </div>
        </div>

        {/* Plaid Error */}
        {plaidError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{plaidError}</p>
          </motion.div>
        )}

        {/* Goal Progress Bars */}
        {financeGoals.length > 0 && (
          <div className="mt-6 space-y-3">
            {financeGoals.slice(0, 3).map((goal) => {
              const progress = Math.min((goal.currentBalance / goal.targetBalance) * 100, 100);
              
              return (
                <div key={goal.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium truncate">
                      {goal.institutionIcon} {goal.title}
                    </span>
                    <span className="text-muted-foreground">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="progress-neon">
                    <div
                      className="progress-neon-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Projection Components */}
        <div className="mt-6 space-y-4">
          <ProjectionHero />
          <ProjectionChartCard />
          <GoalForecastCard />
          <RecurringCashflowCard
            onSelectItem={handleRecurringItemSelect}
            onAddManualCashflow={openManualCashflow}
            onMergeItems={handleMergeRecurringItems}
          />
          <ScenarioControls />
        </div>
            </motion.div>
          ) : (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              aria-label="Bank accounts"
              className="space-y-5"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border/30 pb-4">
                <div>
                  <h4 className="font-heading font-semibold text-foreground">Bank accounts</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review balances, reconnect institutions, and add accounts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAddDialog}
                  disabled={isPlaidLoading}
                  className="flex min-h-[40px] shrink-0 items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-all hover:border-primary/60 hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className={cn("h-4 w-4", isPlaidLoading && "animate-pulse")} />
                  <span className="hidden sm:inline">Add account</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>

              {/* Cash Accounts Section */}
              <AccountSection
                title="Cash Accounts"
                accounts={cashAccounts}
                pendingAccounts={pendingAccounts.filter(a => {
                  const t = a.type.toLowerCase();
                  const s = a.subtype.toLowerCase();
                  return t === 'depository' || ['checking', 'savings', 'money_market', 'cd'].includes(s);
                })}
                emptyType="cash"
                onAddAccount={openAddDialog}
                onSync={handleAccountSync}
                onReconnect={reconnectAccount}
                onClick={handleAccountClick}
                isSyncing={isSyncing}
                isPlaidLoading={isPlaidLoading}
                reconnectRequiredAccounts={reconnectRequiredAccounts}
              />

              {/* Investments & Retirement Section */}
              <AccountSection
                title="Investments & Retirement"
                accounts={investmentAccounts}
                pendingAccounts={pendingAccounts.filter(a => {
                  const t = a.type.toLowerCase();
                  const s = a.subtype.toLowerCase();
                  return t === 'investment' || t === 'brokerage' || ['ira', '401k', 'roth', 'brokerage', 'hsa'].includes(s);
                })}
                emptyType="investments"
                onAddAccount={openAddDialog}
                onSync={handleAccountSync}
                onReconnect={reconnectAccount}
                onClick={handleAccountClick}
                isSyncing={isSyncing}
                isPlaidLoading={isPlaidLoading}
                reconnectRequiredAccounts={reconnectRequiredAccounts}
              />

              {/* Credit & Loans Section */}
              <AccountSection
                title="Credit & Loans"
                accounts={creditAccounts}
                pendingAccounts={pendingAccounts.filter(a => {
                  const t = a.type.toLowerCase();
                  const s = a.subtype.toLowerCase();
                  return t === 'credit' || t === 'loan' || ['credit_card', 'auto', 'mortgage', 'student', 'loan'].includes(s);
                })}
                emptyType="credit"
                onAddAccount={openAddDialog}
                onSync={handleAccountSync}
                onReconnect={reconnectAccount}
                onClick={handleAccountClick}
                isSyncing={isSyncing}
                isPlaidLoading={isPlaidLoading}
                reconnectRequiredAccounts={reconnectRequiredAccounts}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </motion.div>

      {/* Sync Toast */}
      <SyncToast
        isVisible={syncToast.isVisible}
        status={syncToast.status}
        message={syncToast.message}
        onClose={syncToast.close}
      />

      {/* Transaction Modal */}
      {selectedAccount && (
        <TransactionModal
          account={selectedAccount}
          isOpen={!!selectedAccount}
          onClose={() => {
            setSelectedAccount(null);
            setSelectedRecurringItem(null);
          }}
          onDelete={removeAccount}
          highlightTransactionIds={selectedRecurringItem?.sourceTransactionIds}
          highlightedItemLabel={selectedRecurringItem?.label}
          highlightedItemDirection={selectedRecurringItem?.id.startsWith('income:') ? 'income' : selectedRecurringItem ? 'expense' : undefined}
          mergedSources={selectedRecurringItem?.mergedSources}
          onUnmergeRecurringSource={handleUnmergeRecurringSource}
          onAddManualCashflow={openManualCashflowFromTransaction}
        />
      )}

      <AccountLinkDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        onOpenPlaid={openPlaid}
        onOpenFinicity={openFinicity}
        onOpenManualAccount={openManualAccount}
        isPlaidLoading={isPlaidLoading}
        isFinicityLoading={isOpeningFinicity}
        finicityEnabled={finicityEnabled}
      />
      <ManualAccountDialog
        open={showAccountDialog}
        onOpenChange={setShowAccountDialog}
      />
      <ManualCashflowDialog
        open={showCashflowDialog}
        onOpenChange={setShowCashflowDialog}
        initialValues={manualCashflowDefaults}
      />
    </>
  );
};

// Reusable account section component
interface AccountSectionProps {
  title: string;
  accounts: PlaidAccount[];
  pendingAccounts: PendingPlaidAccount[];
  emptyType: 'cash' | 'investments' | 'credit';
  onAddAccount: () => void;
  onSync: (accountId: string) => void;
  onReconnect: (accountId: string) => void;
  onClick: (accountId: string) => void;
  isSyncing: string | null;
  isPlaidLoading: boolean;
  reconnectRequiredAccounts: Record<string, string>;
}

// Skeleton card that mimics PlaidAccountCard shape, optionally showing real account info
const AccountCardSkeleton: React.FC<{ pending?: PendingPlaidAccount }> = ({ pending }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 animate-pulse">
    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-lg">
      {pending ? '🔄' : ''}
    </div>
    <div className="flex-1 min-w-0">
      {pending ? (
        <>
          <p className="text-sm font-medium text-muted-foreground truncate">
            {pending.name}{pending.mask && <span> ••{pending.mask}</span>}
          </p>
          <p className="text-xs text-muted-foreground/60 truncate">{pending.institutionName}</p>
        </>
      ) : (
        <div className="space-y-2">
          <div className="h-3.5 bg-muted/50 rounded w-3/4" />
          <div className="h-2.5 bg-muted/50 rounded w-1/2" />
        </div>
      )}
    </div>
    <div className="h-4 bg-muted/50 rounded w-16" />
  </div>
);

const AccountSection: React.FC<AccountSectionProps> = ({
  title,
  accounts,
  pendingAccounts,
  emptyType,
  onAddAccount,
  onSync,
  onReconnect,
  onClick,
  isSyncing,
  isPlaidLoading,
  reconnectRequiredAccounts,
}) => {
  const hasPending = pendingAccounts.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          {title}
        </h4>
        {(accounts.length > 0 || hasPending) && (
          <button
            onClick={onAddAccount}
            disabled={isPlaidLoading}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
            aria-label={`Add ${title}`}
          >
            <Plus className={cn("w-4 h-4", isPlaidLoading && "animate-pulse")} />
          </button>
        )}
      </div>

      {accounts.length > 0 || hasPending ? (
        <div className="grid grid-cols-1 2xl:grid-cols-2 min-[1800px]:grid-cols-3 gap-3">
          {accounts.map(account => (
            <PlaidAccountCard
              key={account.id}
              account={account}
              onSync={onSync}
              onReconnect={onReconnect}
              onClick={onClick}
              isSyncing={isSyncing === account.id}
              reconnectRequiredMessage={reconnectRequiredAccounts[account.id]}
            />
          ))}
          {pendingAccounts.map((pending, i) => (
            <AccountCardSkeleton key={`pending-${i}`} pending={pending} />
          ))}
        </div>
      ) : (
        <AccountSectionEmpty
          sectionType={emptyType}
          onAddAccount={onAddAccount}
          isLoading={isPlaidLoading}
        />
      )}
    </div>
  );
};
