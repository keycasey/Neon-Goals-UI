import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ExternalLink, TrendingUp, CheckCircle2, Circle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { SIDEBAR_HANDLE_WIDTH } from '@/components/layout/Sidebar';
import type { Goal, ItemGoal, FinanceGoal, ActionGoal } from '@/types/goals';

interface GoalDetailViewProps {
  goal: Goal;
  onClose: () => void;
}

// Spring animation config for bouncy effect
const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

// Staggered children animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfig,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export const GoalDetailView: React.FC<GoalDetailViewProps> = ({ goal, onClose }) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const { isChatMinimized } = useAppStore();

  // Track desktop breakpoint for sidebar handle margin
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.4, delay: 0.2 },
      }}
      className="fixed inset-0 z-40 bg-background/95 backdrop-blur-md overflow-hidden"
    >
      {/* Close Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ ...springConfig, delay: 0.2 }}
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-3 rounded-xl glass-card neon-border text-foreground hover:neon-glow-cyan transition-all"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </motion.button>

      {/* Goal Details Content - respects sidebar handle on desktop */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{
          opacity: 1,
          x: 0,
          left: isDesktop ? SIDEBAR_HANDLE_WIDTH : 0,
        }}
        exit={{
          opacity: 0,
          x: -40,
          left: 0,
        }}
        transition={springConfig}
        className={cn(
          "absolute top-16 bottom-0 overflow-y-auto p-6 lg:p-8 scrollbar-neon",
          isChatMinimized ? "right-0" : "lg:right-[416px]"
        )}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {goal.type === 'item' && <ItemGoalDetail goal={goal as ItemGoal} />}
          {goal.type === 'finance' && <FinanceGoalDetail goal={goal as FinanceGoal} />}
          {goal.type === 'action' && <ActionGoalDetail goal={goal as ActionGoal} />}
        </motion.div>
      </motion.div>

    </motion.div>
  );
};

// Item Goal Detail
const ItemGoalDetail: React.FC<{ goal: ItemGoal }> = ({ goal }) => {
  return (
    <div className="max-w-3xl">
      {/* Image */}
      <motion.div 
        variants={itemVariants}
        className="relative h-64 lg:h-80 rounded-2xl overflow-hidden mb-6"
      >
        <img
          src={goal.productImage}
          alt={goal.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <div className="space-y-6">
        <motion.div variants={itemVariants}>
          <span className="badge-info mb-2 inline-block">Item Goal</span>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-2">
            {goal.title}
          </h1>
          <p className="text-lg text-muted-foreground">{goal.description}</p>
        </motion.div>

        {/* Price Card */}
        <motion.div variants={itemVariants} className="glass-card p-6 neon-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Best Price</p>
              <p className="text-4xl font-heading font-bold neon-text-cyan">
                ${goal.bestPrice.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Available at {goal.retailerName}
              </p>
            </div>
            <a
              href={goal.retailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-neon text-primary-foreground font-semibold transition-all hover:scale-105 neon-glow-cyan"
            >
              Purchase Now
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </motion.div>

        {/* Specs */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
            Product Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Status</p>
              <p className="text-foreground font-medium capitalize">
                {goal.statusBadge.replace('-', ' ').replace('_', ' ')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Currency</p>
              <p className="text-foreground font-medium">{goal.currency}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Added</p>
              <p className="text-foreground font-medium">
                {new Date(goal.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Last Updated</p>
              <p className="text-foreground font-medium">
                {new Date(goal.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Finance Goal Detail
const FinanceGoalDetail: React.FC<{ goal: FinanceGoal }> = ({ goal }) => {
  const progress = Math.min((goal.currentBalance / goal.targetBalance) * 100, 100);
  const remaining = goal.targetBalance - goal.currentBalance;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-sunset flex items-center justify-center text-3xl">
          {goal.institutionIcon}
        </div>
        <div>
          <span className="badge-accent mb-2 inline-block">Finance Goal</span>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">
            {goal.title}
          </h1>
          <p className="text-lg text-muted-foreground">{goal.accountName}</p>
        </div>
      </motion.div>

      {/* Balance Card */}
      <motion.div variants={itemVariants} className="glass-card p-6 neon-border mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className="text-5xl font-heading font-bold neon-text-magenta">
              ${goal.currentBalance.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Target</p>
            <p className="text-2xl font-heading font-semibold text-foreground">
              ${goal.targetBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>${remaining.toLocaleString()} remaining</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="progress-neon h-3">
            <motion.div
              className="progress-neon-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div variants={itemVariants} className="glass-card p-6 mb-6">
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          Balance History
        </h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {goal.progressHistory.map((value, index) => {
            const maxVal = Math.max(...goal.progressHistory);
            const height = (value / maxVal) * 100;
            const isLast = index === goal.progressHistory.length - 1;

            return (
              <motion.div
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ ...springConfig, delay: 0.4 + index * 0.05 }}
                style={{ originY: 1 }}
              >
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    isLast ? "bg-gradient-neon neon-glow-magenta" : "bg-muted-foreground/40"
                  )}
                  style={{ height: `${Math.max(height, 10)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {index + 1}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants} className="glass-card p-4 text-center">
          <p className="text-2xl font-heading font-bold neon-text-cyan">
            {progress.toFixed(0)}%
          </p>
          <p className="text-sm text-muted-foreground">Complete</p>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-foreground">
            {goal.progressHistory.length}
          </p>
          <p className="text-sm text-muted-foreground">Updates</p>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-success">
            +{((goal.currentBalance / goal.progressHistory[0] - 1) * 100).toFixed(0)}%
          </p>
          <p className="text-sm text-muted-foreground">Growth</p>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-foreground">
            {Math.ceil(remaining / (goal.currentBalance / goal.progressHistory.length))}
          </p>
          <p className="text-sm text-muted-foreground">Est. Weeks</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Action Goal Detail
const ActionGoalDetail: React.FC<{ goal: ActionGoal }> = ({ goal }) => {
  const { toggleTask, addTask } = useAppStore();
  const [newTask, setNewTask] = React.useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTask(goal.id, newTask.trim());
      setNewTask('');
    }
  };

  return (
    <div className="max-w-3xl">
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

      {/* Progress Card */}
      <motion.div variants={itemVariants} className="glass-card p-6 neon-border mb-6">
        <div className="flex items-center gap-6">
          {/* Circular Progress */}
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
              <motion.circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="url(#detailProgressGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${goal.completionPercentage}, 100`}
                initial={{ strokeDasharray: '0, 100' }}
                animate={{ strokeDasharray: `${goal.completionPercentage}, 100` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              />
              <defs>
                <linearGradient id="detailProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--neon-lime)" />
                  <stop offset="100%" stopColor="var(--neon-cyan)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-heading font-bold text-2xl text-foreground">
                {goal.completionPercentage}%
              </span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-2xl font-heading font-semibold text-foreground mb-1">
              {goal.tasks.filter(t => t.completed).length} of {goal.tasks.length} tasks
            </p>
            <p className="text-muted-foreground">
              {goal.tasks.length - goal.tasks.filter(t => t.completed).length} remaining
            </p>
          </div>
        </div>
      </motion.div>

      {/* Task List */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          Tasks
        </h3>
        
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

        {/* Tasks */}
        <motion.div 
          variants={containerVariants}
          className="space-y-2"
        >
          {goal.tasks.map((task, index) => (
            <motion.button
              key={task.id}
              variants={itemVariants}
              custom={index}
              layout
              onClick={() => toggleTask(goal.id, task.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                task.completed
                  ? "bg-success/10 border border-success/30"
                  : "bg-muted/30 border border-border/30 hover:border-primary/30"
              )}
            >
              {task.completed ? (
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              <span className={cn(
                "flex-1 text-sm",
                task.completed ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                {task.title}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};
