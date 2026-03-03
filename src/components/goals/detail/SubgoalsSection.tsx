import React from 'react';
import { motion } from 'framer-motion';
import { Layers, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewStore } from '@/store/useViewStore';
import { itemVariants } from './animations';
import type { Goal } from '@/types/goals';

interface SubgoalsSectionProps {
  goal: Goal;
}

export const SubgoalsSection: React.FC<SubgoalsSectionProps> = ({ goal }) => {
  const { drillIntoGoal } = useViewStore();

  if (!goal.subgoals || goal.subgoals.length === 0) {
    return null;
  }

  return (
    <motion.div variants={itemVariants} className="glass-card p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="font-heading font-semibold text-lg text-foreground">
          Subgoals ({goal.subgoals.length})
        </h3>
      </div>

      <div className="space-y-3">
        {goal.subgoals.map((subgoal, index) => (
          <motion.button
            key={subgoal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-[hsl(var(--neon-magenta)/0.3)] hover:border-[hsl(var(--neon-magenta)/0.6)] hover:shadow-[0_0_15px_hsl(var(--neon-magenta)/0.2)] transition-all cursor-pointer text-left"
            onClick={() => drillIntoGoal(subgoal.id)}
          >
            <div className="w-1 h-8 rounded-full bg-[var(--neon-magenta)]" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground">{subgoal.title}</span>
              <p className="text-xs text-muted-foreground truncate">{subgoal.description}</p>
            </div>
            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              subgoal.type === 'item' && "badge-info",
              subgoal.type === 'finance' && "badge-accent",
              subgoal.type === 'action' && "badge-success"
            )}>
              {subgoal.type}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
