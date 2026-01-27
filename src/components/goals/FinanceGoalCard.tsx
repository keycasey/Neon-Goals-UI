import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FinanceGoal } from '@/types/goals';

interface FinanceGoalCardProps {
  goal: FinanceGoal;
  onViewDetail: (goalId: string) => void;
  onSync: (goalId: string) => void;
  onDelete: (goalId: string) => void;
}

export const FinanceGoalCard: React.FC<FinanceGoalCardProps> = ({
  goal,
  onViewDetail,
  onSync,
  onDelete,
}) => {
  const progress = Math.min((goal.currentBalance / goal.targetBalance) * 100, 100);
  const remaining = goal.targetBalance - goal.currentBalance;
  
  // Calculate trend from history
  const historyLength = goal.progressHistory.length;
  const previousBalance = historyLength > 1 ? goal.progressHistory[historyLength - 2] : goal.currentBalance;
  const trend = goal.currentBalance - previousBalance;
  const trendPercent = previousBalance > 0 ? ((trend / previousBalance) * 100).toFixed(1) : '0';

  // Mini sparkline calculation
  const maxVal = Math.max(...goal.progressHistory);
  const minVal = Math.min(...goal.progressHistory);
  const range = maxVal - minVal || 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="glass-card hover-lift cursor-pointer group p-5"
      onClick={() => onViewDetail(goal.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-sunset flex items-center justify-center text-2xl">
            {goal.institutionIcon}
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">
              {goal.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {goal.accountName}
            </p>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onSync(goal.id); }}
            className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
            aria-label="Sync"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
            className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="flex items-baseline gap-3">
          <p className="text-3xl font-heading font-bold neon-text-magenta">
            ${goal.currentBalance.toLocaleString()}
          </p>
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend >= 0 ? "text-success" : "text-destructive"
          )}>
            {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend >= 0 ? '+' : ''}{trendPercent}%
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          ${remaining.toLocaleString()} to goal
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progress</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="progress-neon">
          <motion.div
            className="progress-neon-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Mini Sparkline */}
      <div className="flex items-end justify-between h-10 gap-0.5">
        {goal.progressHistory.map((value, index) => {
          const height = ((value - minVal) / range) * 100;
          const isLast = index === goal.progressHistory.length - 1;
          
          return (
            <div
              key={index}
              className={cn(
                "flex-1 rounded-t transition-all",
                isLast ? "bg-gradient-neon" : "bg-muted-foreground/30"
              )}
              style={{ height: `${Math.max(height, 10)}%` }}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Target: ${goal.targetBalance.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">
          Synced {new Date(goal.lastSync).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
};
