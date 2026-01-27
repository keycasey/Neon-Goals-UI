import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Goal, 
  ItemGoal, 
  FinanceGoal, 
  ActionGoal, 
  User, 
  Settings, 
  ChatState, 
  Message,
  GoalCategory,
  ViewMode
} from '@/types/goals';
import { mockGoals, mockUser } from './mockData';

interface AppState {
  // View state
  viewMode: ViewMode;
  currentGoalId: string | null;
  sidebarOpen: boolean;
  activeCategory: GoalCategory;
  
  // Data
  goals: Goal[];
  user: User | null;
  settings: Settings;
  
  // Chat state
  creationChat: ChatState;
  goalChats: Record<string, ChatState>;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  selectGoal: (id: string | null) => void;
  closeGoal: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveCategory: (category: GoalCategory) => void;
  
  // Goal CRUD
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  archiveGoal: (id: string) => void;
  
  // Chat actions
  sendCreationMessage: (content: string) => void;
  sendGoalMessage: (goalId: string, content: string) => void;
  
  // Task actions (for ActionGoals)
  toggleTask: (goalId: string, taskId: string) => void;
  addTask: (goalId: string, title: string) => void;
  
  // Finance actions
  syncFinanceGoal: (goalId: string) => void;
  
  // User actions
  setUser: (user: User | null) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  theme: 'miami-vice',
  chatModel: 'gpt-4',
  displayName: 'User',
};

const defaultChatState: ChatState = {
  messages: [],
  isLoading: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      viewMode: 'card',
      currentGoalId: null,
      sidebarOpen: true,
      activeCategory: 'all',
      
      goals: mockGoals,
      user: mockUser,
      settings: defaultSettings,
      
      creationChat: {
        messages: [
          {
            id: '1',
            role: 'assistant',
            content: "Hey there! 🌴 I'm your Goals-AF assistant. Ready to help you crush some goals?\n\nWhat would you like to work on today? I can help you with:\n\n• **Items** - Products you want to purchase\n• **Finances** - Money goals and tracking\n• **Actions** - Skills to learn or habits to build",
            timestamp: new Date(),
          }
        ],
        isLoading: false,
      },
      goalChats: {},
      
      // View actions
      setViewMode: (mode) => set({ viewMode: mode }),
      
      selectGoal: (id) => set({ currentGoalId: id }),
      
      closeGoal: () => set({ currentGoalId: null }),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      setActiveCategory: (category) => set({ activeCategory: category }),
      
      // Goal CRUD
      addGoal: (goal) => set((state) => ({ 
        goals: [...state.goals, goal] 
      })),
      
      updateGoal: (id, updates) => set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === id ? { ...goal, ...updates, updatedAt: new Date() } : goal
        ),
      })),
      
      deleteGoal: (id) => set((state) => ({
        goals: state.goals.filter((goal) => goal.id !== id),
        currentGoalId: state.currentGoalId === id ? null : state.currentGoalId,
      })),
      
      archiveGoal: (id) => set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === id ? { ...goal, status: 'archived', updatedAt: new Date() } : goal
        ),
      })),
      
      // Chat actions
      sendCreationMessage: (content) => {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        };
        
        set((state) => ({
          creationChat: {
            ...state.creationChat,
            messages: [...state.creationChat.messages, userMessage],
            isLoading: true,
          },
        }));
        
        // Simulate AI response
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: getCreationResponse(content),
            timestamp: new Date(),
          };
          
          set((state) => ({
            creationChat: {
              ...state.creationChat,
              messages: [...state.creationChat.messages, assistantMessage],
              isLoading: false,
            },
          }));
        }, 1000);
      },
      
      sendGoalMessage: (goalId, content) => {
        const goal = get().goals.find(g => g.id === goalId);
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        };
        
        set((state) => ({
          goalChats: {
            ...state.goalChats,
            [goalId]: {
              messages: [...(state.goalChats[goalId]?.messages || []), userMessage],
              isLoading: true,
            },
          },
        }));
        
        // Simulate AI response
        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: getGoalResponse(goal?.type || 'action', content),
            timestamp: new Date(),
          };
          
          set((state) => ({
            goalChats: {
              ...state.goalChats,
              [goalId]: {
                messages: [...(state.goalChats[goalId]?.messages || []), assistantMessage],
                isLoading: false,
              },
            },
          }));
        }, 1200);
      },
      
      // Task actions
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
      
      // Finance actions
      syncFinanceGoal: (goalId) => set((state) => ({
        goals: state.goals.map((goal) => {
          if (goal.id === goalId && goal.type === 'finance') {
            const financeGoal = goal as FinanceGoal;
            // Simulate sync with random balance change
            const change = (Math.random() - 0.3) * 500;
            const newBalance = Math.max(0, financeGoal.currentBalance + change);
            
            return {
              ...financeGoal,
              currentBalance: Math.round(newBalance * 100) / 100,
              progressHistory: [...financeGoal.progressHistory.slice(-11), newBalance],
              lastSync: new Date(),
              updatedAt: new Date(),
            };
          }
          return goal;
        }),
      })),
      
      // User actions
      setUser: (user) => set({ user }),
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),
    }),
    {
      name: 'goals-af-storage',
      partialize: (state) => ({
        goals: state.goals,
        settings: state.settings,
        viewMode: state.viewMode,
        activeCategory: state.activeCategory,
      }),
    }
  )
);

// Helper functions for mock responses
function getCreationResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  
  if (lower.includes('buy') || lower.includes('purchase') || lower.includes('product') || lower.includes('item')) {
    return "Awesome! 🛍️ Sounds like you want to track a product purchase. Tell me more about what you're looking for - brand, specs, budget - and I'll help you find the best deals!";
  }
  
  if (lower.includes('save') || lower.includes('money') || lower.includes('invest') || lower.includes('finance') || lower.includes('budget')) {
    return "Let's get that money right! 💰 Tell me about your financial goal - are you saving for something specific, investing, or trying to hit a certain net worth target?";
  }
  
  if (lower.includes('learn') || lower.includes('skill') || lower.includes('habit') || lower.includes('goal') || lower.includes('action')) {
    return "Love the growth mindset! 🚀 What skill or habit are you working on? I can help break it down into actionable steps and keep you accountable.";
  }
  
  return "I'm picking up what you're putting down! 🌴 Could you tell me a bit more? Is this about something you want to **buy**, a **financial goal**, or a **skill/habit** you're building?";
}

function getGoalResponse(goalType: string, userMessage: string): string {
  switch (goalType) {
    case 'item':
      return "I'm scanning the best retailers for you! 🔍 I'll keep an eye on prices and let you know when there's a deal worth grabbing. Any specific features or price point you're targeting?";
    case 'finance':
      return "Looking good! 📈 Your progress is tracking well. Remember, consistency is key. Would you like me to suggest some strategies to accelerate your savings, or set up some milestones?";
    case 'action':
      return "You're making moves! 💪 Keep that momentum going. Would you like me to break down your next step further, or add some accountability checkpoints?";
    default:
      return "Got it! How else can I help you with this goal?";
  }
}
