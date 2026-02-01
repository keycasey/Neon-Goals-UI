import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Goal, FinanceGoal } from '@/types/goals';

interface NestedProgressBarProps {
  parentGoal: FinanceGoal;
  subgoals: Goal[];
  className?: string;
}

/**
 * Nested Progress Bar for Financial Goals
 * Shows main progress bar with mini-bars for each subgoal
 */
export const NestedProgressBar: React.FC<NestedProgressBarProps> = ({
  parentGoal,
  subgoals,
  className,
}) => {
  const mainProgress = Math.min((parentGoal.currentBalance / parentGoal.targetBalance) * 100, 100);
  const remaining = parentGoal.targetBalance - parentGoal.currentBalance;

  // Calculate subgoal contributions
  const financeSubgoals = subgoals.filter(s => s.type === 'finance') as FinanceGoal[];
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground font-medium">
            ${parentGoal.currentBalance.toLocaleString()} / ${parentGoal.targetBalance.toLocaleString()}
          </span>
          <span className={cn(
            "font-semibold",
            mainProgress >= 100 ? "text-white" : "neon-text-magenta"
          )}>
            {mainProgress.toFixed(1)}%
          </span>
        </div>

        {/* Main progress bar with liquid fill effect */}
        <div className="relative h-6 rounded-full overflow-hidden bg-muted/30 border border-border/50">
          {/* Background grid pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)',
            }}
          />
          
          {/* Main fill */}
          <motion.div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              mainProgress >= 100 
                ? "bg-white" 
                : "bg-gradient-to-r from-[var(--neon-magenta)] to-[var(--neon-cyan)]"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${mainProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              boxShadow: mainProgress >= 100
                ? '0 0 20px white, 0 0 40px white'
                : '0 0 10px var(--neon-magenta), 0 0 20px rgba(255,0,255,0.3)',
            }}
          />

          {/* Liquid shine effect */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full opacity-30"
            initial={{ width: 0 }}
            animate={{ width: `${mainProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
            }}
          />

          {/* Value indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-foreground drop-shadow-lg">
              ${remaining.toLocaleString()} to go
            </span>
          </div>
        </div>
      </div>

      {/* Subgoal mini-bars */}
      {financeSubgoals.length > 0 && (
        <div className="space-y-3 pl-4 border-l-2 border-[var(--neon-magenta)]/30">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Sub-Savings Targets
          </p>
          
          {financeSubgoals.map((subgoal, index) => {
            const subProgress = Math.min((subgoal.currentBalance / subgoal.targetBalance) * 100, 100);
            const isComplete = subProgress >= 100;

            return (
              <motion.div
                key={subgoal.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={cn(
                    "font-medium",
                    isComplete ? "text-white" : "text-foreground"
                  )}>
                    {subgoal.title}
                  </span>
                  <span className={cn(
                    isComplete ? "text-white font-bold" : "text-muted-foreground"
                  )}>
                    ${subgoal.currentBalance} / ${subgoal.targetBalance}
                  </span>
                </div>

                {/* Mini progress bar */}
                <div className="relative h-2 rounded-full overflow-hidden bg-muted/20">
                  <motion.div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full",
                      isComplete 
                        ? "bg-white" 
                        : "bg-[var(--neon-magenta)]/60"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${subProgress}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                    style={{
                      boxShadow: isComplete
                        ? '0 0 10px white, 0 0 20px white'
                        : '0 0 5px var(--neon-magenta)',
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NestedProgressBar;
