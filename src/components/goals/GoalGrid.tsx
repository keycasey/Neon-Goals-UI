import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { ItemGoalCard } from './ItemGoalCard';
import { FinanceGoalCard } from './FinanceGoalCard';
import { ActionGoalCard } from './ActionGoalCard';
import type { Goal, ItemGoal, FinanceGoal, ActionGoal } from '@/types/goals';
import { cn } from '@/lib/utils';

interface GoalGridProps {
  className?: string;
}

export const GoalGrid: React.FC<GoalGridProps> = ({ className }) => {
  const { 
    goals, 
    activeCategory, 
    selectGoal, 
    deleteGoal, 
    archiveGoal,
    syncFinanceGoal 
  } = useAppStore();

  const filteredGoals = goals.filter(goal => {
    if (goal.status !== 'active') return false;
    if (activeCategory === 'all') return true;
    if (activeCategory === 'items') return goal.type === 'item';
    if (activeCategory === 'finances') return goal.type === 'finance';
    if (activeCategory === 'actions') return goal.type === 'action';
    return false;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (filteredGoals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <span className="text-4xl">🎯</span>
        </div>
        <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
          No goals yet
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Start a conversation with the AI assistant to create your first goal!
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn(
        "grid gap-4 md:gap-6",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {filteredGoals.map((goal) => (
          <GoalCardWrapper
            key={goal.id}
            goal={goal}
            onViewDetail={selectGoal}
            onDelete={deleteGoal}
            onArchive={archiveGoal}
            onSync={syncFinanceGoal}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

interface GoalCardWrapperProps {
  goal: Goal;
  onViewDetail: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onSync: (id: string) => void;
}

const GoalCardWrapper: React.FC<GoalCardWrapperProps> = ({
  goal,
  onViewDetail,
  onDelete,
  onArchive,
  onSync,
}) => {
  switch (goal.type) {
    case 'item':
      return (
        <ItemGoalCard
          goal={goal as ItemGoal}
          onViewDetail={onViewDetail}
          onDelete={onDelete}
          onArchive={onArchive}
        />
      );
    case 'finance':
      return (
        <FinanceGoalCard
          goal={goal as FinanceGoal}
          onViewDetail={onViewDetail}
          onSync={onSync}
          onDelete={onDelete}
        />
      );
    case 'action':
      return (
        <ActionGoalCard
          goal={goal as ActionGoal}
          onViewDetail={onViewDetail}
          onDelete={onDelete}
        />
      );
    default:
      return null;
  }
};
