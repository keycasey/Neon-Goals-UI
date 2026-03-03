import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useViewStore } from '@/store/useViewStore';
import { ObjectiveList } from '../ObjectiveList';
import { CompletionBurst } from '../CompletionBurst';
import { getProgressBreakdown, isFullyComplete } from '@/lib/progressCalculator';
import { itemVariants } from './animations';
import type { ActionGoal } from '@/types/goals';

interface ActionGoalDetailProps {
  goal: ActionGoal;
}

export const ActionGoalDetail: React.FC<ActionGoalDetailProps> = ({ goal }) => {
  const { toggleTask, addTask } = useGoalsStore();
  const { drillIntoGoal } = useViewStore();
  const [newTask, setNewTask] = useState('');

  // Calculate progress using Modular Assembly logic
  const progressBreakdown = getProgressBreakdown(goal);
  const isComplete = isFullyComplete(goal);
  const subgoals = goal.subgoals || [];

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTask(goal.id, newTask.trim());
      setNewTask('');
    }
  };

  // Navigate to subgoal detail with drill-down animation
  const handleSubgoalClick = (subgoalId: string) => {
    drillIntoGoal(subgoalId);
  };

  return (
    <div className="w-full lg:max-w-3xl">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <span className="badge-success mb-2 inline-block">Action Goal</span>
        <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-2">
          {goal.title}
        </h1>
        <p className="text-lg text-muted-foreground">{goal.description}</p>
      </motion.div>

      {/* Motivation Card */}
      {goal.motivation && (
        <motion.div variants={itemVariants} className="glass-card p-6 neon-border mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-neon flex items-center justify-center flex-shrink-0">
              <span className="text-lg">💭</span>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-1">
                Your Why
              </h3>
              <p className="text-muted-foreground">{goal.motivation}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Card with Completion Burst */}
      <motion.div variants={itemVariants}>
        <CompletionBurst isComplete={isComplete}>
          <div className="glass-card p-6 neon-border mb-6">
            <div className="flex items-center gap-6">
              {/* Circular Progress with Modular Assembly */}
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="3"
                  />
                  {/* Cyan arc for tasks */}
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke={isComplete ? "white" : "url(#detailProgressGradient)"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${progressBreakdown.totalProgress}, 100`}
                    initial={{ strokeDasharray: '0, 100' }}
                    animate={{ strokeDasharray: `${progressBreakdown.totalProgress}, 100` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    style={{
                      filter: isComplete ? 'drop-shadow(0 0 10px white)' : undefined,
                    }}
                  />
                  <defs>
                    <linearGradient id="detailProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--neon-lime)" />
                      <stop offset="100%" stopColor="var(--neon-cyan)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn(
                    "font-heading font-bold text-2xl",
                    isComplete ? "text-white" : "text-foreground"
                  )}
                  style={{
                    textShadow: isComplete ? '0 0 10px white' : undefined,
                  }}>
                    {progressBreakdown.totalProgress}%
                  </span>
                </div>
              </div>

              <div className="flex-1">
                {/* Modular Assembly Stats */}
                <p className="text-2xl font-heading font-semibold text-foreground mb-2">
                  Command Center
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--neon-cyan)]" />
                    <span className="text-muted-foreground">
                      Tasks: <span className="text-foreground font-medium">
                        {progressBreakdown.localTasksCompleted}/{progressBreakdown.localTasksTotal}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--neon-magenta)]" />
                    <span className="text-muted-foreground">
                      Subgoals: <span className="text-foreground font-medium">
                        {progressBreakdown.subgoalsCompleted}/{progressBreakdown.subgoalsTotal}
                      </span>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isComplete
                    ? "✨ All modules powered up!"
                    : `${progressBreakdown.localTasksTotal + progressBreakdown.subgoalsTotal - progressBreakdown.localTasksCompleted - progressBreakdown.subgoalsCompleted} objectives remaining`
                  }
                </p>
              </div>
            </div>
          </div>
        </CompletionBurst>
      </motion.div>

      {/* Unified Objective List */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-background" />
            </span>
            Objective Stack
          </h3>
          <span className="text-sm text-muted-foreground">
            {progressBreakdown.localTasksTotal} tasks • {progressBreakdown.subgoalsTotal} subgoals
          </span>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 focus-within:border-primary/50 transition-all">
            <Plus className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!newTask.trim()}
            className={cn(
              "px-4 py-3 rounded-xl font-medium transition-all",
              newTask.trim()
                ? "bg-gradient-neon text-primary-foreground hover:scale-105"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Add
          </button>
        </form>

        {/* Unified ObjectiveList Component */}
        <ObjectiveList
          tasks={goal.tasks}
          subgoals={subgoals}
          onTaskToggle={(taskId) => toggleTask(goal.id, taskId)}
          onSubgoalClick={handleSubgoalClick}
        />
      </motion.div>
    </div>
  );
};
