import type { Goal, ActionGoal, FinanceGoal, ItemGoal } from '@/types/goals';

/**
 * Modular Assembly Progress Calculator
 * 
 * Parent goal progress = (Local Tasks Completion + Subgoal Completion) / Total Objectives
 * 
 * For a parent goal to be 100%:
 * - Part A: All local tasks must be completed
 * - Part B: All subgoals must be at 100%
 */

export interface ProgressBreakdown {
  localTasksCompleted: number;
  localTasksTotal: number;
  subgoalsCompleted: number;
  subgoalsTotal: number;
  totalProgress: number;
  isFullyComplete: boolean;
  // Detailed subgoal progress
  subgoalProgress: Array<{
    id: string;
    title: string;
    type: string;
    progress: number;
    isComplete: boolean;
  }>;
}

/**
 * Calculate progress for any goal type
 */
export function calculateGoalProgress(goal: Goal): number {
  switch (goal.type) {
    case 'action':
      return calculateActionGoalProgress(goal as ActionGoal);
    case 'finance':
      return calculateFinanceGoalProgress(goal as FinanceGoal);
    case 'item':
      return calculateItemGoalProgress(goal as ItemGoal);
    default:
      return 0;
  }
}

/**
 * Calculate detailed progress breakdown for action goals
 */
export function calculateActionGoalProgress(goal: ActionGoal): number {
  const breakdown = getProgressBreakdown(goal);
  return breakdown.totalProgress;
}

/**
 * Calculate progress for finance goals
 */
export function calculateFinanceGoalProgress(goal: FinanceGoal): number {
  if (!goal.targetBalance || goal.targetBalance <= 0) return 0;
  
  const localProgress = Math.min((goal.currentBalance / goal.targetBalance) * 100, 100);
  
  // If no subgoals, just return local progress
  if (!goal.subgoals || goal.subgoals.length === 0) {
    return localProgress;
  }
  
  // Calculate subgoal progress
  const subgoalProgress = goal.subgoals.reduce((sum, subgoal) => {
    return sum + calculateGoalProgress(subgoal);
  }, 0) / goal.subgoals.length;
  
  // Weight: 60% local balance, 40% subgoals
  return Math.round((localProgress * 0.6) + (subgoalProgress * 0.4));
}

/**
 * Calculate progress for item goals
 */
export function calculateItemGoalProgress(goal: ItemGoal): number {
  // Item is "complete" if it has a selected candidate
  const localComplete = goal.selectedCandidateId ? 100 : 0;
  
  // If no subgoals, just return local progress
  if (!goal.subgoals || goal.subgoals.length === 0) {
    return localComplete;
  }
  
  // Calculate subgoal progress (each item subgoal is complete if it has a selected candidate)
  const subgoalProgress = goal.subgoals.reduce((sum, subgoal) => {
    return sum + calculateGoalProgress(subgoal);
  }, 0) / goal.subgoals.length;
  
  // Weight: 50% local, 50% subgoals
  return Math.round((localComplete * 0.5) + (subgoalProgress * 0.5));
}

/**
 * Get detailed progress breakdown for a goal with tasks and subgoals
 */
export function getProgressBreakdown(goal: ActionGoal): ProgressBreakdown {
  const tasks = goal.tasks || [];
  const subgoals = goal.subgoals || [];
  
  const localTasksCompleted = tasks.filter(t => t.completed).length;
  const localTasksTotal = tasks.length;
  
  // Calculate each subgoal's progress
  const subgoalProgress = subgoals.map(subgoal => {
    const progress = calculateGoalProgress(subgoal);
    return {
      id: subgoal.id,
      title: subgoal.title,
      type: subgoal.type,
      progress,
      isComplete: progress >= 100,
    };
  });
  
  const subgoalsCompleted = subgoalProgress.filter(s => s.isComplete).length;
  const subgoalsTotal = subgoals.length;
  
  // Total objectives = tasks + subgoals
  const totalObjectives = localTasksTotal + subgoalsTotal;
  const completedObjectives = localTasksCompleted + subgoalsCompleted;
  
  // Calculate total progress
  let totalProgress = 0;
  if (totalObjectives > 0) {
    totalProgress = Math.round((completedObjectives / totalObjectives) * 100);
  }
  
  // For true 100%, ALL tasks AND ALL subgoals must be complete
  const isFullyComplete = 
    localTasksCompleted === localTasksTotal && 
    subgoalsCompleted === subgoalsTotal &&
    totalObjectives > 0;
  
  // Enforce 100% only when truly complete
  if (!isFullyComplete && totalProgress === 100) {
    totalProgress = 99;
  }
  if (isFullyComplete) {
    totalProgress = 100;
  }
  
  return {
    localTasksCompleted,
    localTasksTotal,
    subgoalsCompleted,
    subgoalsTotal,
    totalProgress,
    isFullyComplete,
    subgoalProgress,
  };
}

/**
 * Check if goal is ready for review (>=80% complete)
 */
export function isReadyForReview(goal: Goal): boolean {
  const progress = calculateGoalProgress(goal);
  return progress >= 80 && progress < 100;
}

/**
 * Check if goal is fully complete (requires all children to be 100%)
 */
export function isFullyComplete(goal: Goal): boolean {
  if (goal.type === 'action') {
    const breakdown = getProgressBreakdown(goal as ActionGoal);
    return breakdown.isFullyComplete;
  }
  return calculateGoalProgress(goal) >= 100;
}
