import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewMode, GoalCategory } from '@/types/goals';

interface ViewState {
  // State
  viewMode: ViewMode;
  currentGoalId: string | null;
  goalNavigationStack: string[];
  navigationDirection: 'forward' | 'back' | null;
  sidebarOpen: boolean;
  activeCategory: GoalCategory;
  isChatMinimized: boolean;
  chatPulseTrigger: number;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  selectGoal: (id: string | null) => void;
  drillIntoGoal: (id: string) => void;
  navigateBack: () => void;
  navigateToGoal: (id: string | null) => void;
  closeGoal: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveCategory: (category: GoalCategory) => void;
  setChatMinimized: (minimized: boolean) => void;
  toggleChatMinimized: () => void;
  triggerChatPulse: () => void;
}

export const useViewStore = create<ViewState>()(
  persist(
  (set, get) => ({
  // Default initial state (overridden by persisted values on load)
  viewMode: 'card' as ViewMode,
  currentGoalId: null,
  goalNavigationStack: [],
  navigationDirection: null as 'forward' | 'back' | null,
  sidebarOpen: true,
  activeCategory: 'today' as GoalCategory,
  isChatMinimized: false,
  chatPulseTrigger: 0,

  // Actions
  setViewMode: (viewMode) => set({ viewMode }),

  selectGoal: (currentGoalId) => set({ currentGoalId }),

  // Drill into a subgoal - push current goal to stack
  drillIntoGoal: (id) => set((state) => {
    const newStack = state.currentGoalId
      ? [...state.goalNavigationStack, state.currentGoalId]
      : state.goalNavigationStack;
    return {
      currentGoalId: id,
      goalNavigationStack: newStack,
      navigationDirection: 'forward' as const,
    };
  }),

  // Navigate back one level
  navigateBack: () => set((state) => {
    const newStack = [...state.goalNavigationStack];
    const previousGoalId = newStack.pop() || null;
    return {
      currentGoalId: previousGoalId,
      goalNavigationStack: newStack,
      navigationDirection: 'back' as const,
    };
  }),

  // Direct navigation - clears stack (e.g., from breadcrumb)
  navigateToGoal: (id) => set((state) => {
    if (id === null) {
      // Navigate to root - clear everything
      return {
        currentGoalId: null,
        goalNavigationStack: [],
        navigationDirection: 'back' as const,
      };
    }

    // Find position in stack - keep everything up to that point
    const stackIndex = state.goalNavigationStack.indexOf(id);
    if (stackIndex !== -1) {
      // Navigating to a parent in the stack
      return {
        currentGoalId: id,
        goalNavigationStack: state.goalNavigationStack.slice(0, stackIndex),
        navigationDirection: 'back' as const,
      };
    }

    // Not in stack - direct navigation (new context)
    return {
      currentGoalId: id,
      goalNavigationStack: [],
      navigationDirection: null,
    };
  }),

  closeGoal: () => set({
    currentGoalId: null,
    goalNavigationStack: [],
    navigationDirection: 'back' as const,
  }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  setActiveCategory: (activeCategory) => set({ activeCategory }),

  setChatMinimized: (isChatMinimized) => set({ isChatMinimized }),

  toggleChatMinimized: () => set((state) => ({ isChatMinimized: !state.isChatMinimized })),

  triggerChatPulse: () => set((state) => ({ chatPulseTrigger: state.chatPulseTrigger + 1 })),
  }),
  {
    name: 'goals-view-storage',
    version: 2,
    migrate: (persistedState, version) => {
      const state = persistedState as Partial<ViewState>;
      // Today became the primary dashboard in v2. Move existing installs there
      // once; subsequent category choices continue to persist normally.
      if (version < 2 && state.activeCategory === 'all') {
        return { ...state, activeCategory: 'today' as GoalCategory };
      }
      return state;
    },
    // Only persist user preferences — not transient navigation state
    partialize: (state) => ({
      viewMode: state.viewMode,
      activeCategory: state.activeCategory,
      isChatMinimized: state.isChatMinimized,
      sidebarOpen: state.sidebarOpen,
    }),
  }
));
