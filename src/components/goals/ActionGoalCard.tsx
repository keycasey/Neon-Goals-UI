import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActionGoal } from '@/types/goals';

interface ActionGoalCardProps {
  goal: ActionGoal;
  onViewDetail: (goalId: string) => void;
  onDelete: (goalId: string) => void;
}

export const ActionGoalCard: React.FC<ActionGoalCardProps> = ({
  goal,
  onViewDetail,
  onDelete,
}) => {
  const completedTasks = goal.tasks.filter(t => t.completed).length;
  const totalTasks = goal.tasks.length;
  const progress = goal.completionPercentage;

  // Get next uncompleted task
  const nextTask = goal.tasks.find(t => !t.completed);

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
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-foreground text-lg mb-1">
            {goal.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {goal.description}
          </p>
        </div>
        
        {/* Delete Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-muted/50 text-muted-foreground hover:text-destructive hover:bg-muted"
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
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
              stroke="url(#progressGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progress}, 100`}
              initial={{ strokeDasharray: '0, 100' }}
              animate={{ strokeDasharray: `${progress}, 100` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--neon-lime)" />
                <stop offset="100%" stopColor="var(--neon-cyan)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-heading font-bold text-foreground text-sm">
              {progress}%
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              "text-sm font-medium",
              progress >= 100 ? "neon-text-cyan" : "text-foreground"
            )}>
              {completedTasks} of {totalTasks} tasks
            </span>
          </div>
          
          {/* Task Dots */}
          <div className="flex flex-wrap gap-1.5">
            {goal.tasks.slice(0, 8).map((task, index) => (
              <div
                key={task.id}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  task.completed 
                    ? "bg-success neon-glow-lime" 
                    : "bg-muted-foreground/30"
                )}
              />
            ))}
            {goal.tasks.length > 8 && (
              <span className="text-xs text-muted-foreground ml-1">
                +{goal.tasks.length - 8}
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
        <div className="flex items-center gap-1 text-sm font-medium text-primary group-hover:neon-text-cyan transition-all">
          View Tasks
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};
