import { useMemo, useState } from 'react';
import { differenceInCalendarDays, format, isBefore, isSameDay, startOfDay } from 'date-fns';
import { AlertTriangle, CalendarCheck2, Check, ChevronRight, Plus, Route, Sparkles, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useViewStore } from '@/store/useViewStore';
import type { ActionGoal, ActionTask, Goal } from '@/types/goals';
import { GoalPlanningDialog } from './GoalPlanningDialog';
import { getGoalPulseEntries } from '@/lib/goalPulse';

interface ScheduledAction {
  goal: ActionGoal;
  task: ActionTask;
  date: Date;
}

const deadlineCopy = (goal: Goal) => {
  if (!goal.deadline) return 'No target date';
  const days = differenceInCalendarDays(new Date(goal.deadline), new Date());
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  return `${days}d remaining`;
};

export function TodayDashboard() {
  const goals = useGoalsStore((state) => state.goals);
  const toggleTask = useGoalsStore((state) => state.toggleTask);
  const selectGoal = useViewStore((state) => state.selectGoal);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plannerGoalId, setPlannerGoalId] = useState<string>();
  const today = useMemo(() => startOfDay(new Date()), []);

  const actions = useMemo(() => {
    const scheduled: ScheduledAction[] = [];
    goals.forEach((goal) => {
      if (goal.type !== 'action' || goal.status !== 'active') return;
      const actionGoal = goal as ActionGoal;
      actionGoal.tasks.forEach((task) => {
        if (!task.scheduledFor) return;
        const date = new Date(task.scheduledFor);
        if (!task.completed && (isSameDay(date, today) || isBefore(date, today))) {
          scheduled.push({ goal: actionGoal, task, date });
        }
      });
    });
    return scheduled.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [goals, today]);

  const completedToday = useMemo(() => {
    const result: ScheduledAction[] = [];
    goals.forEach((goal) => {
      if (goal.type !== 'action') return;
      const actionGoal = goal as ActionGoal;
      actionGoal.tasks.forEach((task) => {
        if (task.completed && task.scheduledFor && isSameDay(new Date(task.scheduledFor), today)) {
          result.push({ goal: actionGoal, task, date: new Date(task.scheduledFor) });
        }
      });
    });
    return result;
  }, [goals, today]);

  const goalPulse = useMemo(() => getGoalPulseEntries(goals).slice(0, 5), [goals]);

  const openPlanner = (goalId?: string) => {
    setPlannerGoalId(goalId);
    setPlannerOpen(true);
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-accent/10 p-5 lg:p-7">
        <div className="absolute -right-8 -top-16 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <CalendarCheck2 className="h-4 w-4" />
              {format(new Date(), 'EEEE, MMMM d')}
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground lg:text-3xl">
              {actions.length > 0 ? `${actions.length} move${actions.length === 1 ? '' : 's'} for today` : 'Choose one useful move'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Daily work stays connected to the goal it advances. Three meaningful actions beats seventeen decorative checkboxes.
            </p>
          </div>
          <Button onClick={() => openPlanner()} className="gap-2 shadow-[0_0_28px_hsl(var(--primary)/0.22)]">
            <Plus className="h-4 w-4" /> Plan next action
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold">Today’s commitments</h3>
            {actions.length > 3 && <span className="text-xs text-muted-foreground">Top 3 first</span>}
          </div>
          {actions.length === 0 ? (
            <button
              onClick={() => openPlanner()}
              className="w-full rounded-xl border border-dashed border-primary/35 bg-card/40 p-10 text-center transition hover:bg-primary/5"
            >
              <Sparkles className="mx-auto mb-3 h-6 w-6 text-primary" />
              <span className="block font-medium text-foreground">Nothing scheduled. Deliciously uncluttered.</span>
              <span className="mt-1 block text-sm text-muted-foreground">Choose one next action from a larger goal.</span>
            </button>
          ) : (
            <div className="space-y-3">
              {actions.map(({ goal, task, date }, index) => {
                const overdue = isBefore(date, today) && !isSameDay(date, today);
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.25) }}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card/80 p-4 hover:border-primary/30"
                  >
                    <Checkbox
                      className="mt-1 h-5 w-5"
                      checked={task.completed}
                      onCheckedChange={() => {
                        toggleTask(goal.id, task.id).catch(() => toast.error('Could not update that action'));
                      }}
                      aria-label={`Complete ${task.title}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{task.title}</p>
                      <button onClick={() => selectGoal(goal.id)} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                        {goal.title}<ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    {overdue && <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs text-destructive">{format(date, 'MMM d')}</span>}
                  </motion.div>
                );
              })}
            </div>
          )}
          {completedToday.length > 0 && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-400"><Check className="h-4 w-4" /> Completed today</div>
              {completedToday.map(({ task }) => <p key={task.id} className="text-sm text-muted-foreground line-through">{task.title}</p>)}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Route className="h-5 w-5 text-accent" />
            <h3 className="font-heading text-lg font-semibold">Goal pulse</h3>
          </div>
          <div className="space-y-3">
            {goalPulse.map(({ goal, needsAction, deadline }) => (
              <article key={goal.id} className="rounded-xl border border-border bg-card/70 p-4">
                <button onClick={() => selectGoal(goal.id)} className="flex w-full items-start justify-between gap-3 text-left">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{goal.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{deadlineCopy(goal)}</p>
                  </div>
                  <Target className="h-4 w-4 shrink-0 text-primary" />
                </button>
                {needsAction && (
                  <button onClick={() => openPlanner(goal.id)} className="mt-3 flex w-full items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-left text-xs text-amber-300 hover:bg-amber-500/15">
                    <AlertTriangle className="h-3.5 w-3.5" /> No next action — plan one
                  </button>
                )}
                {!needsAction && deadline && (
                  <p className="mt-3 text-xs text-muted-foreground">Target: {format(deadline, 'MMM d, yyyy')}</p>
                )}
              </article>
            ))}
            {goalPulse.length === 0 && <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No active goals yet.</div>}
          </div>
        </section>
      </div>

      <GoalPlanningDialog open={plannerOpen} onOpenChange={setPlannerOpen} initialGoalId={plannerGoalId} />
    </div>
  );
}
