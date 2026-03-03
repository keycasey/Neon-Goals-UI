import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewStore } from '@/store/useViewStore';
import { containerVariants, itemVariants } from './animations';
import type { GroupGoal, ItemGoal, FinanceGoal, ActionGoal } from '@/types/goals';

interface GroupGoalDetailProps {
  goal: GroupGoal;
}

// Preview components for each goal type
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

export const GroupGoalDetail: React.FC<GroupGoalDetailProps> = ({ goal }) => {
  const { drillIntoGoal } = useViewStore();

  // Navigate to subgoal detail with drill-down animation
  const handleSubgoalClick = (subgoalId: string) => {
    drillIntoGoal(subgoalId);
  };

  return (
    <div className="w-full lg:max-w-3xl">
      {/* Header with group icon and title */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center text-6xl mb-4",
          "bg-gradient-to-br neon-border",
          goal.color || "from-cyan-500/20 to-purple-500/20"
        )}>
          {goal.icon || '📦'}
        </div>
        <span className="badge-info mb-2 inline-block">Group Goal</span>
        <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">
          {goal.title}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{goal.description}</p>
      </motion.div>

      {/* Progress Card */}
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
          {goal.subgoals?.filter(s => s.status === 'completed').length || 0} of {goal.subgoals?.length || 0} items completed
        </p>
      </motion.div>

      {/* Child Goals Grid */}
      <motion.div variants={containerVariants} className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">Items in this Group</h2>

        <div className="grid gap-4">
          {(goal.subgoals || []).map((subgoal) => (
            <motion.div
              key={subgoal.id}
              variants={itemVariants}
              className={cn(
                "glass-card p-4 neon-border cursor-pointer hover:neon-glow-cyan transition-all",
                subgoal.status === 'completed' && "opacity-60"
              )}
              onClick={() => handleSubgoalClick(subgoal.id)}
              whileHover={{ scale: 1.02 }}
            >
              {/* Render preview based on subgoal type */}
              {subgoal.type === 'item' && <ItemPreview item={subgoal as ItemGoal} />}
              {subgoal.type === 'finance' && <FinancePreview finance={subgoal as FinanceGoal} />}
              {subgoal.type === 'action' && <ActionPreview action={subgoal as ActionGoal} />}
              {subgoal.type === 'group' && <GroupPreview group={subgoal as GroupGoal} />}
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {(!goal.subgoals || goal.subgoals.length === 0) && (
          <motion.div variants={itemVariants} className="glass-card p-8 text-center">
            <p className="text-muted-foreground">No items in this group yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Ask the AI to add items to this group!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
