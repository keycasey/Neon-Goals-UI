import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProgressBreakdown, isFullyComplete } from '@/lib/progressCalculator';
import type { ActionGoal } from '@/types/goals';

interface ActionGoalCardProps {
  goal: ActionGoal;
  onViewDetail: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  animationIndex: number;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

export const ActionGoalCard: React.FC<ActionGoalCardProps> = ({
  goal,
  onViewDetail,
  onDelete,
  animationIndex,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const subgoalsRef = useRef<HTMLDivElement>(null);
  
  // Use Modular Assembly progress calculation
  const progressBreakdown = getProgressBreakdown(goal);
  const isComplete = isFullyComplete(goal);
  const progress = progressBreakdown.totalProgress;
  const completedTasks = progressBreakdown.localTasksCompleted;
  const totalTasks = progressBreakdown.localTasksTotal;
  const shouldAnimate = animationIndex >= 0;
  const subgoals = goal.subgoals || [];

  // Get next uncompleted task
  const nextTask = goal.tasks.find(t => !t.completed);

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
        delay: shouldAnimate ? animationIndex * 0.08 : 0,
      }}
      className="relative"
    >
      {/* Main Card - with supercritical glow when 100% complete */}
      <motion.div
        whileHover={!isExpanded ? { y: -4, scale: 1.02, transition: springConfig } : undefined}
        whileTap={!isExpanded ? { scale: 0.98 } : undefined}
        className={cn(
          "glass-card hover-lift cursor-pointer group p-5 relative z-10",
          isComplete && "supercritical-glow border-white/30"
        )}
        onClick={() => !isExpanded && onViewDetail(goal.id)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-foreground text-lg mb-1">
              {goal.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {goal.description}
            </p>
          </div>

          {/* Top Right Actions */}
          <div className="flex gap-2">
            {/* Delete Button */}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
              className="p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-muted/50 text-muted-foreground hover:text-destructive hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* Progress Circle */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
            />
            {/* Progress circle */}
            <motion.circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke={isComplete ? "white" : "url(#progressGradient)"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progress}, 100`}
              initial={{ strokeDasharray: '0, 100' }}
              animate={{ strokeDasharray: `${progress}, 100` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                filter: isComplete ? 'drop-shadow(0 0 8px white)' : undefined,
              }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--neon-lime)" />
                <stop offset="100%" stopColor="var(--neon-cyan)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              "font-heading font-bold text-sm",
              isComplete ? "text-white" : "text-foreground"
            )}
            style={{
              textShadow: isComplete ? '0 0 8px white' : undefined,
            }}>
              {progress}%
            </span>
          </div>
        </div>

        <div className="flex-1">
          {/* Modular Assembly Stats */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--neon-cyan)]" />
              <span className={cn(
                "text-sm font-medium",
                isComplete ? "text-white" : "text-foreground"
              )}>
                {completedTasks}/{totalTasks} tasks
              </span>
            </div>
            {subgoals.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--neon-magenta)]" />
                <span className="text-sm text-muted-foreground">
                  {progressBreakdown.subgoalsCompleted}/{progressBreakdown.subgoalsTotal} subgoals
                </span>
              </div>
            )}
          </div>
          
          {/* Task & Subgoal Dots */}
          <div className="flex flex-wrap gap-1.5">
            {/* Task dots - cyan */}
            {goal.tasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  task.completed 
                    ? "bg-success neon-glow-lime" 
                    : "bg-[var(--neon-cyan)]/30"
                )}
              />
            ))}
            {/* Subgoal dots - magenta */}
            {subgoals.slice(0, 4).map((subgoal) => (
              <div
                key={subgoal.id}
                className={cn(
                  "w-2.5 h-2.5 rounded-sm transition-all",
                  subgoal.status === 'completed' 
                    ? "bg-success neon-glow-lime" 
                    : "bg-[var(--neon-magenta)]/30"
                )}
              />
            ))}
            {(goal.tasks.length > 6 || subgoals.length > 4) && (
              <span className="text-xs text-muted-foreground ml-1">
                +{Math.max(0, goal.tasks.length - 6) + Math.max(0, subgoals.length - 4)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Next Task Preview */}
      {nextTask && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground mb-1">Next up:</p>
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground truncate">{nextTask.title}</span>
          </div>
        </div>
      )}

      {/* View Tasks Button */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
        <span className="text-xs text-muted-foreground">
          Updated {new Date(goal.updatedAt).toLocaleDateString()}
        </span>
        {subgoals.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:neon-text-cyan transition-all"
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
                className={cn(
                  "relative p-3 cursor-pointer transition-all group/subgoal",
                  "glass-card",
                  // Magenta border for subgoals (distinct from cyan tasks)
                  "border-2 border-[hsl(var(--neon-magenta)/0.4)]",
                  "hover:border-[hsl(var(--neon-magenta)/0.8)]",
                  "hover:shadow-[0_0_15px_hsl(var(--neon-magenta)/0.3)]"
                )}
              >
                {/* Magenta accent line on left edge */}
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-[hsl(var(--neon-magenta))] rounded-full" />
                
                {/* Header */}
                <div className="flex items-start justify-between mb-2 pl-2">
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
                    subgoal.status === 'active' && "bg-[hsl(var(--neon-magenta)/0.2)] text-[hsl(var(--neon-magenta))]",
                    subgoal.status === 'archived' && "bg-muted/50 text-muted-foreground"
                  )}>
                    {subgoal.status}
                  </span>
                </div>

                {/* Subgoal Tasks Progress (if it's an action goal subgoal) */}
                {subgoal.type === 'action' && (
                  <div className="flex items-center gap-2 pl-2">
                    <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[hsl(var(--neon-magenta))] to-[hsl(var(--neon-cyan))]"
                        initial={{ width: 0 }}
                        animate={{ width: `${(subgoal as ActionGoal).completionPercentage || 0}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {(subgoal as ActionGoal).tasks?.filter(t => t.completed).length || 0}/{(subgoal as ActionGoal).tasks?.length || 0}
                    </span>
                  </div>
                )}

                {/* Target Date (if set) */}
                {subgoal.targetDate && (
                  <p className="text-xs text-muted-foreground mt-2 pl-2">
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
