import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Route, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGoalsStore } from '@/store/useGoalsStore';
import type { ActionGoal } from '@/types/goals';

interface GoalPlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialGoalId?: string;
}

const localDateValue = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

export function GoalPlanningDialog({ open, onOpenChange, initialGoalId }: GoalPlanningDialogProps) {
  const goals = useGoalsStore((state) => state.goals);
  const updateGoal = useGoalsStore((state) => state.updateGoal);
  const scheduleTask = useGoalsStore((state) => state.scheduleTask);
  const actionGoals = useMemo(
    () => goals.filter((goal): goal is ActionGoal => goal.type === 'action' && goal.status === 'active'),
    [goals],
  );
  const [goalId, setGoalId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [scheduledFor, setScheduledFor] = useState(localDateValue());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const candidate = actionGoals.find((goal) => goal.id === initialGoalId) || actionGoals[0];
    setGoalId(candidate?.id || '');
    setDeadline(candidate?.deadline ? localDateValue(new Date(candidate.deadline)) : '');
    setNextAction('');
    setScheduledFor(localDateValue());
  }, [open, initialGoalId, actionGoals]);

  const selectedGoal = actionGoals.find((goal) => goal.id === goalId);

  const save = async () => {
    if (!selectedGoal || !nextAction.trim()) return;
    setSaving(true);
    try {
      if (deadline) {
        await updateGoal(selectedGoal.id, {
          deadline: new Date(`${deadline}T23:59:59`).toISOString(),
        });
      }
      await scheduleTask(
        selectedGoal.id,
        nextAction.trim(),
        new Date(`${scheduledFor}T12:00:00`).toISOString(),
      );
      toast.success('Next action scheduled');
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Could not schedule that action');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-primary/25 bg-card sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Route className="h-5 w-5" />
          </div>
          <DialogTitle className="font-heading text-xl">Turn a goal into a next action</DialogTitle>
          <DialogDescription>
            Give the larger goal a horizon, then choose one concrete move for the day. No fifty-task AI confetti.
          </DialogDescription>
        </DialogHeader>

        {actionGoals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Create an Action Goal first, then return here to schedule its next move.
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Larger goal</Label>
              <Select value={goalId} onValueChange={setGoalId}>
                <SelectTrigger><SelectValue placeholder="Choose a goal" /></SelectTrigger>
                <SelectContent>
                  {actionGoals.map((goal) => <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedGoal?.description && <p className="text-xs text-muted-foreground">Done means: {selectedGoal.description}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="goal-deadline">Target date</Label>
                <Input id="goal-deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled-for">Do this on</Label>
                <Input id="scheduled-for" type="date" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="next-action" className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-accent" /> Next physical action</Label>
              <Input
                id="next-action"
                value={nextAction}
                onChange={(event) => setNextAction(event.target.value)}
                placeholder="e.g. Measure the bathroom's available space"
                maxLength={500}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void save();
                }}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!selectedGoal || !nextAction.trim() || !scheduledFor || saving}>
            Schedule action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
