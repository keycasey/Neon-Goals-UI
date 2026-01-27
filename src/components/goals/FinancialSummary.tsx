import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, Target, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { FinanceGoal } from '@/types/goals';

interface FinancialSummaryProps {
  className?: string;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({ className }) => {
  const { goals, syncFinanceGoal } = useAppStore();

  const financeGoals = goals.filter(
    (goal): goal is FinanceGoal => goal.type === 'finance' && goal.status === 'active'
  );

  if (financeGoals.length === 0) return null;

  const totalBalance = financeGoals.reduce((sum, goal) => sum + goal.currentBalance, 0);
  const totalTarget = financeGoals.reduce((sum, goal) => sum + goal.targetBalance, 0);
  const goalsOnTrack = financeGoals.filter(goal => {
    const progress = goal.currentBalance / goal.targetBalance;
    return progress >= 0.5; // Consider on track if at least 50% complete
  }).length;

  const syncAll = () => {
    financeGoals.forEach(goal => syncFinanceGoal(goal.id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-card p-6 neon-border", className)}
    >
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
              {financeGoals.length} active financial goals
            </p>
          </div>
        </div>
        
        <button
          onClick={syncAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Sync All
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Total Balance
          </p>
          <p className="text-2xl font-heading font-bold neon-text-magenta">
            ${totalBalance.toLocaleString()}
          </p>
        </div>

        {/* Target Total */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Target Total
          </p>
          <p className="text-2xl font-heading font-bold text-foreground">
            ${totalTarget.toLocaleString()}
          </p>
        </div>

        {/* Goals On Track */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground mb-1">On Track</p>
          <p className="text-2xl font-heading font-bold text-success">
            {goalsOnTrack} / {financeGoals.length}
          </p>
        </div>

        {/* Overall Progress */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground mb-1">Overall Progress</p>
          <p className="text-2xl font-heading font-bold neon-text-cyan">
            {((totalBalance / totalTarget) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Mini Progress Bars */}
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
    </motion.div>
  );
};
