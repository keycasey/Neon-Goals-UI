import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingUp, Target, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { FinanceGoal } from '@/types/goals';
import { FinancialAccountCard, sampleAccounts, type FinancialAccount } from './FinancialAccountCard';

interface FinancialSummaryProps {
  className?: string;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ className }) => {
  const { goals, syncFinanceGoal } = useAppStore();
  const [showAccounts, setShowAccounts] = useState(false);

  const financeGoals = goals.filter(
    (goal): goal is FinanceGoal => goal.type === 'finance' && goal.status === 'active'
  );

  // Calculate totals from sample accounts
  const accounts = sampleAccounts;
  const totalAssets = accounts
    .filter(a => !a.isDebt)
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const totalDebt = accounts
    .filter(a => a.isDebt)
    .reduce((sum, a) => sum + a.currentBalance, 0);
  const netWorth = totalAssets - totalDebt;

  const totalBalance = financeGoals.reduce((sum, goal) => sum + goal.currentBalance, 0);
  const totalTarget = financeGoals.reduce((sum, goal) => sum + goal.targetBalance, 0);
  const goalsOnTrack = financeGoals.filter(goal => {
    const progress = goal.currentBalance / goal.targetBalance;
    return progress >= 0.5;
  }).length;

  const syncAll = () => {
    financeGoals.forEach(goal => syncFinanceGoal(goal.id));
  };

  const handleAccountSync = (accountId: string) => {
    console.log('Syncing account:', accountId);
    // Future: implement account sync
  };

  const handleAccountClick = (accountId: string) => {
    console.log('Viewing account:', accountId);
    // Future: navigate to account detail
  };

  // Group accounts by type
  const checkingAccounts = accounts.filter(a => a.accountType === 'checking');
  const savingsAccounts = accounts.filter(a => a.accountType === 'savings');
  const investmentAccounts = accounts.filter(a => a.accountType === 'investment' || a.accountType === 'retirement');
  const debtAccounts = accounts.filter(a => a.accountType === 'credit' || a.accountType === 'loan');

  return (
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
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowAccounts(!showAccounts)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {showAccounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Accounts
            </button>
            <button
              onClick={syncAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Sync All
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Worth */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Net Worth
            </p>
            <p className="text-2xl font-heading font-bold neon-text-magenta">
              ${netWorth.toLocaleString()}
            </p>
          </div>

          {/* Total Assets */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Total Assets
            </p>
            <p className="text-2xl font-heading font-bold text-success">
              ${totalAssets.toLocaleString()}
            </p>
          </div>

          {/* Total Debt */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Total Debt</p>
            <p className="text-2xl font-heading font-bold text-destructive">
              -${totalDebt.toLocaleString()}
            </p>
          </div>

          {/* Goals Progress */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground mb-1">Goals On Track</p>
            <p className="text-2xl font-heading font-bold neon-text-cyan">
              {goalsOnTrack} / {financeGoals.length}
            </p>
          </div>
        </div>

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
            <div className="px-6 pb-6 pt-2 border-t border-border/30">
              {/* Checking & Savings */}
              {(checkingAccounts.length > 0 || savingsAccounts.length > 0) && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Cash Accounts
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...checkingAccounts, ...savingsAccounts].map(account => (
                      <FinancialAccountCard
                        key={account.id}
                        account={account}
                        compact
                        onSync={handleAccountSync}
                        onClick={handleAccountClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Investments */}
              {investmentAccounts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Investments & Retirement
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {investmentAccounts.map(account => (
                      <FinancialAccountCard
                        key={account.id}
                        account={account}
                        compact
                        onSync={handleAccountSync}
                        onClick={handleAccountClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Debt */}
              {debtAccounts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Credit & Loans
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {debtAccounts.map(account => (
                      <FinancialAccountCard
                        key={account.id}
                        account={account}
                        compact
                        onSync={handleAccountSync}
                        onClick={handleAccountClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
