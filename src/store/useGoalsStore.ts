import { create } from 'zustand';
import type { Goal, ActionGoal } from '@/types/goals';
import { goalsService } from '@/services/goalsService';
import { useAuthStore } from './useAuthStore';

// Read initial state from useAppStore's localStorage
// This keeps the slice in sync with the main store during the migration
const getInitialState = () => {
  try {
    const stored = localStorage.getItem('goals-af-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        goals: parsed?.state?.goals ?? [],
        goalsVersion: parsed?.state?.goalsVersion ?? 0,
        isLoading: parsed?.state?.isLoading ?? false,
        error: parsed?.state?.error ?? null,
      };
    }
  } catch (e) {
    console.error('Failed to parse stored goals state:', e);
  }
  return {
    goals: [],
    goalsVersion: 0,
    isLoading: false,
    error: null,
  };
};

interface GoalsState {
  goals: Goal[];
  goalsVersion: number;
  isLoading: boolean;
  error: string | null;

  // Goal CRUD actions
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => void;
  archiveGoal: (id: string) => void;

  // Subgoal actions
  createSubgoal: (data: any, parentGoalId: string) => Promise<void>;

  // Task actions (for ActionGoals)
  toggleTask: (goalId: string, taskId: string) => void;
  addTask: (goalId: string, title: string) => void;

  // Item search/update
  searchAndUpdateGoal: (goalId: string, query?: string) => Promise<void>;

  // Progress update
  updateGoalProgress: (goalId: string, data: any) => Promise<void>;
}

export const useGoalsStore = create<GoalsState>()((set, get) => ({
  // Initial state from localStorage (synced with useAppStore)
  ...getInitialState(),

  // Goal CRUD actions
  fetchGoals: async () => {
    // Skip API call in demo mode
    if (useAuthStore.getState().isDemoMode) {
      return;
    }
    try {
      set({ isLoading: true, error: null });
      const goals = await goalsService.getAll();
      set({ goals, isLoading: false, goalsVersion: get().goalsVersion + 1 });
    } catch (error: any) {
      console.error('Failed to fetch goals:', error);
      set({ error: 'Failed to fetch goals', isLoading: false });
    }
  },

  addGoal: (goal) => set((state) => ({
    goals: [...state.goals, goal]
  })),

  updateGoal: async (id, updates) => {
    // Update local state immediately for optimistic UI
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === id ? { ...goal, ...updates, updatedAt: new Date() } : goal
      ),
    }));

    // Persist to backend
    try {
      const goal = get().goals.find(g => g.id === id);
      if (!goal) return;

      // Use the appropriate update method based on goal type
      if (goal.type === 'item') {
        await goalsService.updateItemGoal(id, updates);
      } else if (goal.type === 'finance') {
        await goalsService.updateFinanceGoal(id, updates);
      } else if (goal.type === 'action') {
        await goalsService.updateActionGoal(id, updates);
      } else {
        await goalsService.update(id, updates);
      }
    } catch (error) {
      console.error('Failed to update goal:', error);
      // Optionally: revert optimistic update on error
      // For now, we keep the optimistic update
    }
  },

  deleteGoal: async (id) => {
    // Call the backend API to delete the goal
    try {
      await goalsService.delete(id);
    } catch (error) {
      console.error('Failed to delete goal:', error);
      // Only remove from local state if backend delete succeeded
      return;
    }
    // Remove from local state after successful backend delete
    set((state) => ({
      goals: state.goals.filter((goal) => goal.id !== id),
    }));
  },

  archiveGoal: async (id) => {
    // Call the backend API to archive the goal
    try {
      await goalsService.archive(id);
      // Update local state with archived status
      set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === id ? { ...goal, status: 'archived', updatedAt: new Date() } : goal
        ),
      }));
    } catch (error) {
      console.error('Failed to archive goal:', error);
    }
  },

  // Subgoal actions
  createSubgoal: async (data, parentGoalId) => {
    try {
      let newSubgoal;

      const goalData = {
        ...data,
        parentGoalId,
        status: 'active',
      };

      if (data.type === 'item') {
        newSubgoal = await goalsService.createItemGoal(goalData);
      } else if (data.type === 'finance') {
        newSubgoal = await goalsService.createFinanceGoal(goalData);
      } else {
        newSubgoal = await goalsService.createActionGoal(goalData);
      }

      // Add to local state
      set((state) => ({
        goals: [...state.goals, newSubgoal],
      }));

      console.log('Created subgoal:', newSubgoal.title);
    } catch (error) {
      console.error('Failed to create subgoal:', error);
      throw error;
    }
  },

  // Task actions (for ActionGoals)
  toggleTask: (goalId, taskId) => set((state) => ({
    goals: state.goals.map((goal) => {
      if (goal.id === goalId && goal.type === 'action') {
        const actionGoal = goal as ActionGoal;
        const updatedTasks = actionGoal.tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        const completedCount = updatedTasks.filter((t) => t.completed).length;
        const completionPercentage = Math.round((completedCount / updatedTasks.length) * 100);

        return {
          ...actionGoal,
          tasks: updatedTasks,
          completionPercentage,
          updatedAt: new Date(),
        };
      }
      return goal;
    }),
  })),

  addTask: (goalId, title) => set((state) => ({
    goals: state.goals.map((goal) => {
      if (goal.id === goalId && goal.type === 'action') {
        const actionGoal = goal as ActionGoal;
        const newTask = {
          id: Date.now().toString(),
          title,
          completed: false,
          createdAt: new Date(),
        };
        const updatedTasks = [...actionGoal.tasks, newTask];
        const completedCount = updatedTasks.filter((t) => t.completed).length;
        const completionPercentage = Math.round((completedCount / updatedTasks.length) * 100);

        return {
          ...actionGoal,
          tasks: updatedTasks,
          completionPercentage,
          updatedAt: new Date(),
        };
      }
      return goal;
    }),
  })),

  searchAndUpdateGoal: async (goalId, _query) => {
    try {
      set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === goalId && goal.type === 'item'
            ? { ...goal, statusBadge: 'pending_search' }
            : goal
        ),
        goalsVersion: get().goalsVersion + 1,
      }));
      await goalsService.refreshCandidates(goalId);
    } catch (error) {
      console.error('Failed to refresh candidates:', error);
      set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === goalId && (goal as any).statusBadge === 'pending_search'
            ? { ...goal, statusBadge: 'in_stock' }
            : goal
        ),
        goalsVersion: get().goalsVersion + 1,
      }));
    }
  },

  updateGoalProgress: async (_goalId, _data) => {
    try {
      await get().fetchGoals();
    } catch (error) {
      console.error('Failed to update progress:', error);
      throw error;
    }
  },
}));
