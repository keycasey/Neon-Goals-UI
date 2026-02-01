import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Layers, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Goal, ActionGoal, ActionTask } from '@/types/goals';

interface ObjectiveListProps {
  tasks: ActionTask[];
  subgoals: Goal[];
  onTaskToggle: (taskId: string) => void;
  onSubgoalClick: (subgoalId: string) => void;
  className?: string;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

const itemVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { ...springConfig, delay: index * 0.05 },
  }),
  exit: { opacity: 0, x: -20, scale: 0.95 },
};

/**
 * Unified Objective List - Blends local tasks (cyan) and subgoals (magenta)
 * Part of the "Modular Assembly" system for parent goals
 */
export const ObjectiveList: React.FC<ObjectiveListProps> = ({
  tasks,
  subgoals,
  onTaskToggle,
  onSubgoalClick,
  className,
}) => {
  // Combine and sort: incomplete first, then by creation date
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn("space-y-2", className)}
    >
      {/* Local Tasks - Cyan Neon Line */}
      <AnimatePresence mode="popLayout">
        {sortedTasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            index={index}
            onToggle={() => onTaskToggle(task.id)}
          />
        ))}
      </AnimatePresence>

      {/* Subgoals - Magenta Neon Border */}
      {subgoals.length > 0 && (
        <>
          {tasks.length > 0 && (
            <div className="py-2 flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--neon-magenta)]/30 to-transparent" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Subgoals</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--neon-magenta)]/30 to-transparent" />
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {subgoals.map((subgoal, index) => (
              <SubgoalItem
                key={subgoal.id}
                subgoal={subgoal}
                index={tasks.length + index}
                onClick={() => onSubgoalClick(subgoal.id)}
              />
            ))}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

// Task Item Component - Cyan accent
interface TaskItemProps {
  task: ActionTask;
  index: number;
  onToggle: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, index, onToggle }) => {
  return (
    <motion.button
      variants={itemVariants}
      custom={index}
      layout
      onClick={onToggle}
      className={cn(
        "w-full relative flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group",
        task.completed
          ? "bg-success/10 border border-success/30"
          : "bg-muted/30 border border-border/30 hover:border-primary/30"
      )}
    >
      {/* Cyan accent line on left */}
      <div className={cn(
        "absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-all",
        task.completed 
          ? "bg-success" 
          : "bg-[var(--neon-cyan)] group-hover:shadow-[0_0_8px_var(--neon-cyan)]"
      )} />
      
      <div className="pl-2 flex items-center gap-3 flex-1">
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-[var(--neon-cyan)] flex-shrink-0" />
        )}
        <span className={cn(
          "flex-1 text-sm transition-all",
          task.completed 
            ? "text-muted-foreground glitch-strike" 
            : "text-foreground"
        )}>
          {task.title}
        </span>
      </div>
    </motion.button>
  );
};

// Subgoal Item Component - Magenta accent
interface SubgoalItemProps {
  subgoal: Goal;
  index: number;
  onClick: () => void;
}

const SubgoalItem: React.FC<SubgoalItemProps> = ({ subgoal, index, onClick }) => {
  // Calculate completion percentage
  const getCompletion = () => {
    if (subgoal.type === 'action' && 'completionPercentage' in subgoal) {
      return (subgoal as ActionGoal).completionPercentage;
    }
    return subgoal.status === 'completed' ? 100 : 0;
  };

  const completion = getCompletion();
  const isCompleted = completion === 100;
  const isReady = completion >= 80 && completion < 100;

  return (
    <motion.button
      variants={itemVariants}
      custom={index}
      layout
      onClick={onClick}
      className={cn(
        "w-full relative flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group overflow-hidden",
        isCompleted
          ? "bg-success/10 border-2 border-success/50"
          : "bg-[hsl(var(--neon-magenta)/0.05)] border-2 border-[hsl(var(--neon-magenta)/0.3)]",
        isReady && "border-[hsl(var(--neon-magenta)/0.6)]",
        !isCompleted && "hover:border-[hsl(var(--neon-magenta)/0.6)] hover:shadow-[0_0_15px_hsl(var(--neon-magenta)/0.2)]"
      )}
    >
      {/* Magenta accent line on left */}
      <div className={cn(
        "absolute left-0 top-2 bottom-2 w-1 rounded-full transition-all",
        isCompleted 
          ? "bg-success" 
          : "bg-[var(--neon-magenta)]",
        isReady && "animate-pulse"
      )} />
      
      {/* Progress fill bar (background) */}
      <motion.div
        className={cn(
          "absolute inset-0 opacity-20",
          isCompleted
            ? "bg-gradient-to-r from-success/30 to-transparent"
            : "bg-gradient-to-r from-[hsl(var(--neon-magenta)/0.3)] to-transparent"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${completion}%` }}
        transition={{ duration: 0.5 }}
      />

      <div className="pl-3 flex items-center gap-3 flex-1 relative z-10">
        <Layers className={cn(
          "w-5 h-5 flex-shrink-0",
          isCompleted ? "text-success" : "text-[var(--neon-magenta)]"
        )} />
        
        <div className="flex-1 min-w-0">
          <span className={cn(
            "text-sm font-medium block",
            isCompleted ? "text-muted-foreground line-through decoration-success/50" : "text-foreground"
          )}>
            {subgoal.title}
          </span>
          {subgoal.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {subgoal.description}
            </span>
          )}
        </div>

        {/* Type Badge */}
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-medium",
          subgoal.type === 'item' && "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]",
          subgoal.type === 'finance' && "bg-[var(--neon-magenta)]/20 text-[var(--neon-magenta)]",
          subgoal.type === 'action' && "bg-[var(--neon-lime)]/20 text-[var(--neon-lime)]"
        )}>
          {subgoal.type}
        </span>

        {/* Completion indicator */}
        {subgoal.type === 'action' && (
          <span className={cn(
            "text-xs font-medium",
            isCompleted ? "text-success" : "text-muted-foreground"
          )}>
            {completion}%
          </span>
        )}

        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[var(--neon-magenta)] transition-colors" />
      </div>
    </motion.button>
  );
};

export default ObjectiveList;
