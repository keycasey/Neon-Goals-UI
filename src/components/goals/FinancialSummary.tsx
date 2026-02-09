import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingUp, Target, Wallet, ChevronDown, ChevronUp, Landmark, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { FinanceGoal } from '@/types/goals';
import { PlaidAccountCard } from '@/components/plaid/PlaidAccountCard';
import { AccountSectionEmpty } from '@/components/plaid/AccountSectionEmpty';
import { TransactionModal } from '@/components/plaid/TransactionModal';
import { usePlaid } from '@/hooks/usePlaidLink';
import { SyncToast, useSyncToast } from '@/components/ui/SyncToast';
import type { PlaidAccount } from '@/services/plaidService';

interface FinancialSummaryProps {
  className?: string;
}

// Map Plaid account types to our section categories
const getCashAccounts = (accounts: PlaidAccount[]) =>
  accounts.filter(a => ['checking', 'savings', 'depository'].includes(a.accountType));

const getInvestmentAccounts = (accounts: PlaidAccount[]) =>
  accounts.filter(a => ['investment', 'retirement', 'brokerage'].includes(a.accountType));

const getCreditAccounts = (accounts: PlaidAccount[]) =>
  accounts.filter(a => ['credit', 'loan'].includes(a.accountType));

const isDebtType = (type: string) => ['credit', 'loan'].includes(type);

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ className }) => {
  const { goals, syncFinanceGoal } = useAppStore();
  const [showAccounts, setShowAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<PlaidAccount | null>(null);
  const syncToast = useSyncToast();
  const { open: openPlaidLink, isLoading: isPlaidLoading, error: plaidError, accounts, syncAccount, isSyncing, fetchAccounts } = usePlaid();

  const financeGoals = goals.filter(
    (goal): goal is FinanceGoal => goal.type === 'finance' && goal.status === 'active'
  );

  // Calculate totals from Plaid accounts
  const totalAssets = accounts
    .filter(a => !isDebtType(a.accountType) && !a.isDebt)
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const totalDebt = accounts
    .filter(a => isDebtType(a.accountType) || a.isDebt)
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
      financeGoals.forEach(goal => syncFinanceGoal(goal.id));
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
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-bold neon-text-magenta">
              {hasAnyAccounts ? `$${netWorth.toLocaleString()}` : '—'}
            </p>
          </div>

          {/* Total Assets */}
          <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Total Assets
            </p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-bold text-success">
              {hasAnyAccounts ? `$${totalAssets.toLocaleString()}` : '—'}
            </p>
          </div>

          {/* Total Debt */}
          <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Total Debt</p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-heading font-bold text-destructive">
              {hasAnyAccounts ? `-$${totalDebt.toLocaleString()}` : '—'}
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
        />
      )}
    </>
  );
};

// Reusable account section component
interface AccountSectionProps {
  title: string;
  accounts: PlaidAccount[];
  emptyType: 'cash' | 'investments' | 'credit';
  onAddAccount: () => void;
  onSync: (accountId: string) => void;
  onClick: (accountId: string) => void;
  isSyncing: string | null;
  isPlaidLoading: boolean;
}

const AccountSection: React.FC<AccountSectionProps> = ({
  title,
  accounts,
  emptyType,
  onAddAccount,
  onSync,
  onClick,
  isSyncing,
  isPlaidLoading,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          {title}
        </h4>
        {accounts.length > 0 && (
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

      {accounts.length > 0 ? (
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
