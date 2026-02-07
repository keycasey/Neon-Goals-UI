import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Trash2, Archive, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GroupGoal, ItemGoal, FinanceGoal, ActionGoal } from '@/types/goals';

interface GroupGoalCardProps {
  goal: GroupGoal;
  onViewDetail: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onArchive: (goalId: string) => void;
  animationIndex: number;
}

export const GroupGoalCard: React.FC<GroupGoalCardProps> = ({
  goal,
  onViewDetail,
  onDelete,
  onArchive,
  animationIndex,
}) => {
  const shouldAnimate = animationIndex >= 0;

  // Get preview of first 3-4 child goals
  const previewGoals = useMemo(() => {
    return goal.subgoals?.slice(0, 4) || [];
  }, [goal.subgoals]);

  const totalItems = goal.subgoals?.length || 0;
  const hiddenCount = Math.max(0, totalItems - 4);

  // Calculate completion stats
  const completedCount = useMemo(() => {
    return goal.subgoals?.filter(g => g.status === 'completed').length || 0;
  }, [goal.subgoals]);

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.8, y: 30 } : { opacity: 1, scale: 1, y: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -30 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: shouldAnimate ? animationIndex * 0.05 : 0,
      }}
      className="group relative"
    >
      {/* Glass card container */}
      <div
        onClick={() => onViewDetail(goal.id)}
        className={cn(
          'glass-card overflow-hidden cursor-pointer',
          'neon-border hover:neon-glow-cyan transition-all duration-300',
          'transform hover:scale-[1.02]'
        )}
      >
        {/* Action buttons (hover) */}
        <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(goal.id);
            }}
            className="p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-accent transition-colors neon-border-subtle"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(goal.id);
            }}
            className="p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-destructive/20 transition-colors neon-border-subtle"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Header Section */}
        <div className="p-6 border-b border-border/30">
          <div className="flex items-start gap-4">
            {/* Group Icon */}
            <div
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-3xl',
                'neon-border bg-gradient-to-br',
                goal.color || 'from-cyan-500/20 to-purple-500/20'
              )}
            >
              {goal.icon || '📦'}
            </div>

            {/* Title and Stats */}
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-xl font-bold mb-1 truncate">
                {goal.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {goal.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{totalItems} items</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-primary font-bold">{completedCount}/{totalItems}</span>
                  <span className="text-muted-foreground">completed</span>
                </div>
              </div>
            </div>

            {/* Chevron */}
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-background/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: shouldAnimate ? 0.3 : 0 }}
                className="h-full bg-gradient-to-r from-cyan-500 to-lime-400 neon-glow-cyan"
              />
            </div>
            <span className="text-sm font-bold neon-text-cyan min-w-[3rem] text-right">
              {Math.round(goal.progress)}%
            </span>
          </div>
        </div>

        {/* Preview Grid */}
        {previewGoals.length > 0 && (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2">
              {previewGoals.map((subgoal, idx) => (
                <div
                  key={subgoal.id}
                  className={cn(
                    'p-3 rounded-lg bg-background/30 backdrop-blur-sm',
                    'border border-border/20',
                    'flex items-center gap-2',
                    'transition-colors',
                    subgoal.status === 'completed' ? 'opacity-60' : ''
                  )}
                >
                  {/* Type indicator */}
                  <div className="flex-shrink-0 w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        subgoal.type === 'item' ? '#06b6d4' :
                        subgoal.type === 'finance' ? '#10b981' :
                        subgoal.type === 'action' ? '#f59e0b' :
                        '#8b5cf6'
                    }}
                  />

                  {/* Title */}
                  <span className="text-xs truncate flex-1">
                    {subgoal.title}
                  </span>

                  {/* Status */}
                  {subgoal.status === 'completed' && (
                    <span className="text-xs text-green-400">✓</span>
                  )}
                </div>
              ))}
            </div>

            {/* Hidden count */}
            {hiddenCount > 0 && (
              <div className="mt-2 text-center text-xs text-muted-foreground">
                +{hiddenCount} more item{hiddenCount === 1 ? '' : 's'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stacked card shadow effect */}
      <div className="absolute inset-0 -z-10 translate-y-2 translate-x-2 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 blur-sm" />
    </motion.div>
  );
};
