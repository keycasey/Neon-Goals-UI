import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewStore } from '@/store/useViewStore';
import { CompletionBurst } from '../CompletionBurst';
import { NestedProgressBar } from '../NestedProgressBar';
import { containerVariants, itemVariants, springConfig } from './animations';
import type { FinanceGoal } from '@/types/goals';

interface FinanceGoalDetailProps {
  goal: FinanceGoal;
}

export const FinanceGoalDetail: React.FC<FinanceGoalDetailProps> = ({ goal }) => {
  const { drillIntoGoal } = useViewStore();
  const progress = Math.min((goal.currentBalance / goal.targetBalance) * 100, 100);
  const remaining = goal.targetBalance - goal.currentBalance;
  const isComplete = progress >= 100;
  const subgoals = goal.subgoals || [];

  // Calculate weeks to target date
  const weeksToTarget = goal.targetDate
    ? Math.max(0, Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)))
    : null;

  // Calculate estimated weeks based on current savings rate
  const avgSavingsPerWeek = goal.currentBalance > 0 && goal.progressHistory.length > 0
    ? goal.currentBalance / goal.progressHistory.length
    : 0;
  const estWeeksAtCurrentRate = avgSavingsPerWeek > 0
    ? Math.ceil(remaining / avgSavingsPerWeek)
    : null;

  // Navigate to subgoal detail with drill-down animation
  const handleSubgoalClick = (subgoalId: string) => {
    drillIntoGoal(subgoalId);
  };

  return (
    <div className="w-full lg:max-w-3xl">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-sunset flex items-center justify-center text-3xl">
          {goal.institutionIcon}
        </div>
        <div>
          <span className="badge-accent mb-2 inline-block">Finance Goal</span>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">
            {goal.title}
          </h1>
          <p className="text-lg text-muted-foreground">{goal.accountName}</p>
        </div>
      </motion.div>

      {/* Balance Card with Completion Burst */}
      <motion.div variants={itemVariants}>
        <CompletionBurst isComplete={isComplete}>
          <div className="glass-card p-6 neon-border mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                <p className={cn(
                  "text-5xl font-heading font-bold",
                  isComplete ? "text-white" : "neon-text-magenta"
                )}
                style={{
                  textShadow: isComplete ? '0 0 20px white, 0 0 40px white' : undefined,
                }}>
                  ${goal.currentBalance.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Target</p>
                <p className="text-2xl font-heading font-semibold text-foreground">
                  ${goal.targetBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Nested Progress Bar with subgoals */}
            <NestedProgressBar
              parentGoal={goal}
              subgoals={subgoals}
              onSubgoalClick={handleSubgoalClick}
            />
          </div>
        </CompletionBurst>
      </motion.div>

      {/* Chart */}
      <motion.div variants={itemVariants} className="glass-card p-6 mb-6">
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          Balance History
        </h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {goal.progressHistory.map((value, index) => {
            const maxVal = Math.max(...goal.progressHistory);
            const height = (value / maxVal) * 100;
            const isLast = index === goal.progressHistory.length - 1;

            return (
              <motion.div
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ ...springConfig, delay: 0.4 + index * 0.05 }}
                style={{ originY: 1 }}
              >
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    isLast ? "bg-gradient-neon neon-glow-magenta" : "bg-muted-foreground/40"
                  )}
                  style={{ height: `${Math.max(height, 10)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {index + 1}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants} className="glass-card p-4 text-center">
          <p className={cn(
            "text-2xl font-heading font-bold",
            isComplete ? "text-white" : "neon-text-cyan"
          )}
          style={{
            textShadow: isComplete ? '0 0 10px white' : undefined,
          }}>
            {progress.toFixed(0)}%
          </p>
          <p className="text-sm text-muted-foreground">Complete</p>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-foreground">
            {goal.progressHistory.length}
          </p>
          <p className="text-sm text-muted-foreground">Updates</p>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-success">
            {goal.progressHistory.length > 0 && goal.progressHistory[0] > 0
              ? `+${((goal.currentBalance / goal.progressHistory[0] - 1) * 100).toFixed(0)}%`
              : '0%'}
          </p>
          <p className="text-sm text-muted-foreground">Growth</p>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-foreground">
            {estWeeksAtCurrentRate !== null ? estWeeksAtCurrentRate : weeksToTarget ?? '—'}
          </p>
          <p className="text-sm text-muted-foreground">Est. Weeks</p>
          {weeksToTarget !== null && estWeeksAtCurrentRate !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              Target: {weeksToTarget}w
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* Non-finance subgoals section */}
      {subgoals.filter(s => s.type !== 'finance').length > 0 && (
        <motion.div variants={itemVariants} className="glass-card p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-semibold text-lg text-foreground">
              Related Goals
            </h3>
          </div>
          <div className="space-y-2">
            {subgoals.filter(s => s.type !== 'finance').map((subgoal) => (
              <motion.button
                key={subgoal.id}
                onClick={() => handleSubgoalClick(subgoal.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-[hsl(var(--neon-magenta)/0.3)] hover:border-[hsl(var(--neon-magenta)/0.6)] transition-all text-left"
              >
                <div className="w-1 h-8 rounded-full bg-[var(--neon-magenta)]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{subgoal.title}</span>
                  <span className="text-xs text-muted-foreground block">{subgoal.description}</span>
                </div>
                <span className="text-xs text-muted-foreground">{subgoal.type}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
