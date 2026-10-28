import { differenceInCalendarDays } from 'date-fns';
import type { ActionGoal, Goal } from '@/types/goals';

export interface GoalPulseEntry {
  goal: Goal;
  needsAction: boolean;
  deadline: Date | null;
  urgencyScore: number;
}

export function getGoalPulseEntries(goals: Goal[], now = new Date()): GoalPulseEntry[] {
  return goals
    .filter((goal) => goal.status === 'active')
    .map((goal) => {
      const actionGoal = goal.type === 'action' ? goal as ActionGoal : null;
      const openTasks = actionGoal?.tasks.filter((task) => !task.completed) || [];
      const needsAction = goal.type === 'action' && openTasks.length === 0;
      const deadline = goal.deadline ? new Date(goal.deadline) : null;
      const daysUntilDeadline = deadline ? differenceInCalendarDays(deadline, now) : null;

      let urgencyScore = 0;
      if (needsAction) urgencyScore += 100;
      if (daysUntilDeadline !== null) {
        urgencyScore += daysUntilDeadline < 0 ? 90 : Math.max(0, 80 - daysUntilDeadline);
      }
      if (goal.type === 'group') urgencyScore += 50;
      if (goal.type === 'action') urgencyScore += 40;
      if (goal.type === 'finance') urgencyScore += 20;

      return { goal, needsAction, deadline, urgencyScore };
    })
    // Product candidates belong in Product Research unless they have a real deadline.
    .filter(({ goal, deadline }) => goal.type !== 'item' || deadline !== null)
    .sort((a, b) => (
      b.urgencyScore - a.urgencyScore
      || new Date(b.goal.updatedAt).getTime() - new Date(a.goal.updatedAt).getTime()
    ));
}
