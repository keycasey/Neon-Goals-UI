import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, RefreshCw, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionGoal, FinanceGoal } from '@/types/goals';

interface FinanceGoalCardProps {
  goal: FinanceGoal;
  allFinanceGoals: FinanceGoal[];
  onViewDetail: (goalId: string) => void;
  onSync: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onArchive: (goalId: string) => void;
  animationIndex: number;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

export const FinanceGoalCard: React.FC<FinanceGoalCardProps> = ({
  goal,
  allFinanceGoals,
  onViewDetail,
  onSync,
  onDelete,
  onArchive,
  animationIndex,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const subgoalsRef = useRef<HTMLDivElement>(null);
  const progress = Math.min((goal.currentBalance / goal.targetBalance) * 100, 100);
  const remaining = goal.targetBalance - goal.currentBalance;
  const shouldAnimate = animationIndex >= 0;
  const subgoals = goal.subgoals || [];

  // Calculate trend from history
  const historyLength = goal.progressHistory.length;
  const previousBalance = historyLength > 1 ? goal.progressHistory[historyLength - 2] : goal.currentBalance;
  const trend = goal.currentBalance - previousBalance;
  const trendPercent = previousBalance > 0 ? ((trend / previousBalance) * 100).toFixed(1) : '0';

  // Mini sparkline calculation
  const maxVal = Math.max(...goal.progressHistory);
  const minVal = Math.min(...goal.progressHistory);
  const range = maxVal - minVal || 1;

  // Toggle expansion and scroll into view
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    // If expanding, scroll into view after animation completes
    if (!isExpanded) {
      setTimeout(() => {
        subgoalsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      }, 400); // Wait for spring animation to complete
    }
  };

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.8, y: 30 } : { opacity: 1, scale: 1, y: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        ...springConfig,
        delay: shouldAnimate ? animationIndex * 0.03 : 0,
      }}
      className="relative"
    >
      {/* Main Card */}
      <motion.div
        whileHover={!isExpanded ? { y: -4, scale: 1.02, transition: springConfig } : undefined}
        whileTap={!isExpanded ? { scale: 0.98 } : undefined}
        className="glass-card hover-lift cursor-pointer group p-5 relative z-10"
        onClick={() => !isExpanded && onViewDetail(goal.id)}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="size-10 aspect-square rounded-xl bg-gradient-sunset flex items-center justify-center text-xl flex-shrink-0">
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

        {/* Top Right Actions - absolute positioned */}
        <div className="absolute top-5 right-5 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onSync(goal.id); }}
            className="p-3 rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Sync"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {goal.status !== 'archived' && (
            <button
              onClick={(e) => { e.stopPropagation(); onArchive(goal.id); }}
              className="p-3 rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-warning transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Archive"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
            className="p-3 rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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

        {/* Comparative Progress Chart */}
        <div className="flex items-end justify-between h-10 gap-1">
          {allFinanceGoals.map((fg) => {
            const fgProgress = Math.min((fg.currentBalance / fg.targetBalance) * 100, 100);
            const isCurrent = fg.id === goal.id;

            return (
              <div
                key={fg.id}
                className={cn(
                  "flex-1 rounded-t transition-all",
                  isCurrent ? "bg-gradient-neon" : "bg-muted-foreground/30"
                )}
                style={{ height: `${Math.max(fgProgress, 5)}%` }}
                title={`${fg.title}: ${fgProgress.toFixed(0)}%`}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            Target: ${goal.targetBalance.toLocaleString()}
            {goal.targetDate && (
              <span className="ml-2">
                by {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </p>
          {subgoals.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:neon-text-magenta transition-all"
            >
              {isExpanded ? 'Collapse' : 'View Subgoals'}
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </motion.div>

      {/* Expanded Subgoals */}
      <AnimatePresence>
        {isExpanded && subgoals.length > 0 && (
          <motion.div
            ref={subgoalsRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springConfig}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {subgoals.map((subgoal, idx) => (
              <motion.div
                key={subgoal.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ ...springConfig, delay: idx * 0.05 }}
                onClick={() => onViewDetail(subgoal.id)}
                className="glass-card p-3 cursor-pointer hover:neon-border transition-all group/subgoal"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm">
                      {subgoal.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {subgoal.description}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    subgoal.status === 'completed' && "bg-success/20 text-success",
                    subgoal.status === 'active' && "bg-primary/20 text-primary",
                    subgoal.status === 'archived' && "bg-muted/50 text-muted-foreground"
                  )}>
                    {subgoal.status}
                  </span>
                </div>

                {/* Finance Goal Progress (if it's a finance goal subgoal) */}
                {subgoal.type === 'finance' && 'currentBalance' in subgoal && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-sunset"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(
                            ((subgoal as FinanceGoal).currentBalance / (subgoal as FinanceGoal).targetBalance) * 100,
                            100
                          )}%`
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ${(subgoal as FinanceGoal).currentBalance?.toLocaleString() || 0} / ${(subgoal as FinanceGoal).targetBalance?.toLocaleString() || 0}
                    </span>
                  </div>
                )}

                {/* Action Goal Progress (if it's an action goal subgoal) */}
                {subgoal.type === 'action' && 'tasks' in subgoal && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-neon"
                        initial={{ width: 0 }}
                        animate={{ width: `${(subgoal as ActionGoal).completionPercentage || 0}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {(subgoal as ActionGoal).tasks?.filter((task) => task.completed).length || 0}/{(subgoal as ActionGoal).tasks?.length || 0}
                    </span>
                  </div>
                )}

                {/* Target Date (if set) */}
                {subgoal.targetDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Target: {new Date(subgoal.targetDate).toLocaleDateString()}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
