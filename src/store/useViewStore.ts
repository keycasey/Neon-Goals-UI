import { create } from 'zustand';
import type { ViewMode, GoalCategory } from '@/types/goals';

// Read initial state from useAppStore's localStorage
// This keeps the slice in sync with the main store during the migration
const getInitialState = () => {
  try {
    const stored = localStorage.getItem('goals-af-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        viewMode: parsed?.state?.viewMode ?? 'card',
        currentGoalId: parsed?.state?.currentGoalId ?? null,
        goalNavigationStack: parsed?.state?.goalNavigationStack ?? [],
        navigationDirection: parsed?.state?.navigationDirection ?? null,
        sidebarOpen: parsed?.state?.sidebarOpen ?? true,
        activeCategory: parsed?.state?.activeCategory ?? 'all',
        isChatMinimized: parsed?.state?.isChatMinimized ?? false,
        chatPulseTrigger: parsed?.state?.chatPulseTrigger ?? 0,
      };
    }
  } catch (e) {
    console.error('Failed to parse stored view state:', e);
  }
  return {
    viewMode: 'card' as ViewMode,
    currentGoalId: null,
    goalNavigationStack: [],
    navigationDirection: null as 'forward' | 'back' | null,
    sidebarOpen: true,
    activeCategory: 'all' as GoalCategory,
    isChatMinimized: false,
    chatPulseTrigger: 0,
  };
};

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

export const useViewStore = create<ViewState>()((set, get) => ({
  // Initial state from localStorage (synced with useAppStore)
  ...getInitialState(),

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
}));
