import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingUp, Target, Wallet, ChevronDown, ChevronUp, Landmark, Plus, AlertCircle } from 'lucide-react';
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
import { ProjectionHero } from '@/components/projections/ProjectionHero';
import { ProjectionChartCard } from '@/components/projections/ProjectionChartCard';
import { GoalForecastCard } from '@/components/projections/GoalForecastCard';
import { RecurringCashflowCard } from '@/components/projections/RecurringCashflowCard';
import { ScenarioControls } from '@/components/projections/ScenarioControls';
import { AccountCoverageCard } from '@/components/projections/AccountCoverageCard';

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
  const syncToast = useSyncToast();
  const { open: openPlaidLink, isLoading: isPlaidLoading, error: plaidError, accounts, pendingAccounts, syncAccount, removeAccount, isSyncing, fetchAccounts } = usePlaid();

  // Fetch projection data on mount
  useEffect(() => {
    fetchOverview();
    fetchCashflow();
    fetchGoalForecasts();
    fetchManualAccounts();
    fetchManualCashflows();
  }, []);

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
    syncToast.showSyncing('Updating all accounts...');

    try {
      // Sync Plaid accounts
      for (const account of accounts) {
        await syncAccount(account.id);
      }
      // Sync finance goals
      financeGoals.forEach(goal => syncFinanceGoal(goal.id, goals));
      syncToast.showSuccess(`${accounts.length} accounts synced`);
    } catch (error) {
      syncToast.showError('Could not sync accounts');
    }
  };

  const handleAccountClick = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) setSelectedAccount(account);
  };

  // Group Plaid accounts by type
  const cashAccounts = getCashAccounts(accounts);
  const investmentAccounts = getInvestmentAccounts(accounts);
  const creditAccounts = getCreditAccounts(accounts);

  const hasAnyAccounts = accounts.length > 0;

  // Auto-expand accounts section when linking a new account
  React.useEffect(() => {
    if (isPlaidLoading && !showAccounts) {
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
          
          <div className="flex flex-col gap-1">
            <button
              onClick={syncAll}
              className="flex items-center justify-center p-2.5 rounded-lg bg-muted/50 text-foreground hover:bg-muted transition-colors min-w-[44px] min-h-[44px]"
              aria-label="Sync all accounts"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAccounts(!showAccounts)}
              className="flex items-center justify-center p-2.5 rounded-lg bg-muted/50 text-foreground hover:bg-muted transition-colors min-w-[44px] min-h-[44px]"
              aria-label="Toggle accounts"
            >
              <Landmark className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Worth */}
          <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Net Worth
            </p>
            <p className={cn("text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-bold neon-text-magenta", isPlaidLoading && !hasAnyAccounts && "animate-pulse")}>
              {isPlaidLoading && !hasAnyAccounts ? '...' : hasAnyAccounts ? `$${netWorth.toLocaleString()}` : '—'}
            </p>
          </div>

          {/* Total Assets */}
          <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Total Assets
            </p>
            <p className={cn("text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-bold text-success", isPlaidLoading && !hasAnyAccounts && "animate-pulse")}>
              {isPlaidLoading && !hasAnyAccounts ? '...' : hasAnyAccounts ? `$${totalAssets.toLocaleString()}` : '—'}
            </p>
          </div>

          {/* Total Debt */}
          <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Total Debt</p>
            <p className={cn("text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-bold text-destructive", isPlaidLoading && !hasAnyAccounts && "animate-pulse")}>
              {isPlaidLoading && !hasAnyAccounts ? '...' : totalDebt > 0 ? `-$${totalDebt.toLocaleString()}` : hasAnyAccounts ? '$0' : '—'}
            </p>
          </div>

          {/* Goals Progress */}
          <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Goals On Track</p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-bold neon-text-cyan">
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
      </div>

      {/* Accounts Section (Collapsible) */}
      <AnimatePresence>
        {showAccounts && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-border/30 space-y-4">
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
                onAddAccount={openPlaidLink}
                onSync={syncAccount}
                onClick={handleAccountClick}
                isSyncing={isSyncing}
                isPlaidLoading={isPlaidLoading}
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
                onAddAccount={openPlaidLink}
                onSync={syncAccount}
                onClick={handleAccountClick}
                isSyncing={isSyncing}
                isPlaidLoading={isPlaidLoading}
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
                onAddAccount={openPlaidLink}
                onSync={syncAccount}
                onClick={handleAccountClick}
                isSyncing={isSyncing}
                isPlaidLoading={isPlaidLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
          onClose={() => setSelectedAccount(null)}
          onDelete={removeAccount}
        />
      )}
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
  onClick: (accountId: string) => void;
  isSyncing: string | null;
  isPlaidLoading: boolean;
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
  onClick,
  isSyncing,
  isPlaidLoading,
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map(account => (
            <PlaidAccountCard
              key={account.id}
              account={account}
              onSync={onSync}
              onClick={onClick}
              isSyncing={isSyncing === account.id}
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
