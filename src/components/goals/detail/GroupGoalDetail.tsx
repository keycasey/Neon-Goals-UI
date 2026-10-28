import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewStore } from '@/store/useViewStore';
import { containerVariants, itemVariants } from './animations';
import type { Goal, GroupGoal, ItemGoal, FinanceGoal, ActionGoal } from '@/types/goals';

interface GroupGoalDetailProps {
  goal: GroupGoal;
}

/* ─── helpers ─── */

/** Group same-type siblings that share a stackId into clusters */
const buildStacks = (goals: Goal[]): { stacks: Record<string, Goal[]>; standalone: Goal[] } => {
  const byStack: Record<string, Goal[]> = {};
  const standalone: Goal[] = [];

  for (const g of goals) {
    const sid = (g as Goal & { stackId?: string }).stackId;
    if (sid) {
      (byStack[sid] ??= []).push(g);
    } else {
      standalone.push(g);
    }
  }

  // Stacks with only 1 member become standalone
  const validStacks: Record<string, Goal[]> = {};
  for (const [id, members] of Object.entries(byStack)) {
    if (members.length >= 2 && members.every(m => m.type === members[0].type)) {
      validStacks[id] = members.sort(
        (a, b) => ((a as Goal & { stackOrder?: number }).stackOrder ?? 0)
          - ((b as Goal & { stackOrder?: number }).stackOrder ?? 0),
      );
    } else {
      standalone.push(...members);
    }
  }

  return { stacks: validStacks, standalone };
};

/* ─── preview rows (shared by list & grid) ─── */

const ItemPreview = ({ item }: { item: ItemGoal }) => (
  <div className="flex items-center gap-4">
    {item.productImage && (
      <img src={item.productImage} className="w-16 h-16 rounded-lg object-cover neon-border" alt={item.title} />
    )}
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-foreground truncate">{item.title}</h3>
      <p className="text-sm text-primary font-bold">${item.bestPrice?.toLocaleString()}</p>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
  </div>
);

const FinancePreview = ({ finance }: { finance: FinanceGoal }) => (
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-lg bg-gradient-sunset flex items-center justify-center text-2xl flex-shrink-0">
      {finance.institutionIcon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-foreground truncate">{finance.title}</h3>
      <p className="text-sm text-muted-foreground">${finance.currentBalance?.toLocaleString()} / ${finance.targetBalance?.toLocaleString()}</p>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
  </div>
);

const ActionPreview = ({ action }: { action: ActionGoal }) => (
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-full border-4 border-primary/30 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-primary">{Math.round(action.completionPercentage)}%</span>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-foreground truncate">{action.title}</h3>
      <p className="text-sm text-muted-foreground">
        {action.tasks?.filter(t => t.completed).length || 0} / {action.tasks?.length || 0} tasks
      </p>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
  </div>
);

const GroupPreview = ({ group }: { group: GroupGoal }) => (
  <div className="flex items-center gap-4">
    <div className={cn(
      "w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 neon-border",
      "bg-gradient-to-br", group.color || "from-cyan-500/20 to-purple-500/20"
    )}>
      {group.icon || '📦'}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-medium text-foreground truncate">{group.title}</h3>
      <p className="text-sm text-muted-foreground">{group.subgoals?.length || 0} items</p>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
  </div>
);

const GoalPreviewRow: React.FC<{ goal: Goal; onClick: () => void }> = ({ goal, onClick }) => (
  <motion.div
    variants={itemVariants}
    className={cn(
      "glass-card p-4 neon-border cursor-pointer hover:neon-glow-cyan transition-all",
      goal.status === 'completed' && "opacity-60"
    )}
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
  >
    {goal.type === 'item' && <ItemPreview item={goal as ItemGoal} />}
    {goal.type === 'finance' && <FinancePreview finance={goal as FinanceGoal} />}
    {goal.type === 'action' && <ActionPreview action={goal as ActionGoal} />}
    {goal.type === 'group' && <GroupPreview group={goal as GroupGoal} />}
  </motion.div>
);

/* ─── stack card (grid mode only) ─── */

const StackCard: React.FC<{ goals: Goal[]; onClick: (id: string) => void }> = ({ goals, onClick }) => {
  const front = goals[0];
  return (
    <motion.div
      variants={itemVariants}
      className="relative cursor-pointer"
      onClick={() => onClick(front.id)}
      whileHover={{ scale: 1.02 }}
    >
      {/* Shadow cards behind */}
      {goals.length > 1 && (
        <>
          <div className="absolute inset-0 glass-card neon-border rounded-xl translate-x-2 translate-y-2 opacity-30" />
          {goals.length > 2 && (
            <div className="absolute inset-0 glass-card neon-border rounded-xl translate-x-1 translate-y-1 opacity-20" />
          )}
        </>
      )}
      <div className="relative glass-card p-4 neon-border">
        {front.type === 'item' && <ItemPreview item={front as ItemGoal} />}
        {front.type === 'finance' && <FinancePreview finance={front as FinanceGoal} />}
        {front.type === 'action' && <ActionPreview action={front as ActionGoal} />}
        {front.type === 'group' && <GroupPreview group={front as GroupGoal} />}
        <div className="absolute top-2 right-2 bg-muted/80 text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full">
          {goals.length} items
        </div>
      </div>
    </motion.div>
  );
};

/* ─── main component ─── */

export const GroupGoalDetail: React.FC<GroupGoalDetailProps> = ({ goal }) => {
  const { drillIntoGoal } = useViewStore();
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');

  const subgoals = useMemo(() => goal.subgoals || [], [goal.subgoals]);
  const { stacks, standalone } = useMemo(() => buildStacks(subgoals), [subgoals]);

  // If only one stack and nothing else, flatten it (per spec)
  const stackEntries = Object.entries(stacks);
  const shouldFlatten = stackEntries.length === 1 && standalone.length === 0;

  const handleClick = (id: string) => drillIntoGoal(id);

  return (
    <div className="w-full lg:max-w-3xl">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center text-6xl mb-4",
          "bg-gradient-to-br neon-border",
          goal.color || "from-cyan-500/20 to-purple-500/20"
        )}>
          {goal.icon || '📦'}
        </div>
        <span className="badge-info mb-2 inline-block">Group Goal</span>
        <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">{goal.title}</h1>
        <p className="text-lg text-muted-foreground mt-2">{goal.description}</p>
      </motion.div>

      {/* Progress */}
      <motion.div variants={itemVariants} className="glass-card p-6 neon-border mb-6">
        <p className="text-sm text-muted-foreground mb-2">Overall Progress</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 rounded-full bg-background/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className="h-full bg-gradient-to-r from-cyan-500 to-lime-400 neon-glow-cyan"
              />
            </div>
          </div>
          <span className="text-2xl font-bold neon-text-cyan min-w-[4rem] text-right">
            {Math.round(goal.progress)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {subgoals.filter(s => s.status === 'completed').length} of {subgoals.length} items completed
        </p>
      </motion.div>

      {/* Grid/List Toggle + Children */}
      <motion.div variants={containerVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-foreground">Items in this Group</h2>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
            <button
              onClick={() => setLayout('grid')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                layout === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                layout === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {layout === 'list' || shouldFlatten ? (
          /* List mode: all goals individually */
          <div className="grid gap-3">
            {subgoals.map(sg => (
              <GoalPreviewRow key={sg.id} goal={sg} onClick={() => handleClick(sg.id)} />
            ))}
          </div>
        ) : (
          /* Grid mode: stacks rendered as stacked cards */
          <div className="grid gap-4 sm:grid-cols-2">
            {stackEntries.map(([stackId, members]) => (
              <StackCard key={stackId} goals={members} onClick={handleClick} />
            ))}
            {standalone.map(sg => (
              <GoalPreviewRow key={sg.id} goal={sg} onClick={() => handleClick(sg.id)} />
            ))}
          </div>
        )}

        {subgoals.length === 0 && (
          <motion.div variants={itemVariants} className="glass-card p-8 text-center">
            <p className="text-muted-foreground">No items in this group yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Ask the AI to add items to this group!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
