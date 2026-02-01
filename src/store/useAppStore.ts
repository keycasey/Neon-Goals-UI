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
import { authService } from '@/services/authService';
import { goalsService } from '@/services/goalsService';
import { usersService } from '@/services/usersService';
import { chatsService } from '@/services/chatsService';
import { aiService } from '@/services/aiService';
import { aiGoalCreationService } from '@/services/aiGoalCreationService';
import { aiOverviewChatService } from '@/services/aiOverviewChatService';
import { aiGoalChatService } from '@/services/aiGoalChatService';
import { mockOverviewChatService } from '@/services/mockChatService';
import { mockGoalChatService } from '@/services/mockChatService';
import { browserUseService } from '@/services/browserUseService';

interface AppState {
  // View state
  viewMode: ViewMode;
  currentGoalId: string | null;
  sidebarOpen: boolean;
  activeCategory: GoalCategory;
  isChatMinimized: boolean;
  isDemoMode: boolean; // Demo mode flag - offline mode with mock data

  // Data
  goals: Goal[];
  user: User | null;
  settings: Settings;

  // Chat state
  creationChat: ChatState;
  goalChats: Record<string, ChatState>;
  isCreatingGoal: boolean; // Track if in goal creation flow
  pendingCommands: Array<{ type: string; data: any }> | null; // Commands awaiting user confirmation

  // Loading state
  isLoading: boolean;
  error: string | null;

  // View actions
  setViewMode: (mode: ViewMode) => void;
  selectGoal: (id: string | null) => void;
  closeGoal: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveCategory: (category: GoalCategory) => void;
  toggleChatMinimized: () => void;

  // Goal CRUD (local state updates - API calls happen separately)
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => void;
  archiveGoal: (id: string) => void;

  // Chat actions
  sendCreationMessage: (content: string) => void;
  confirmGoalCreation: () => void;
  sendGoalMessage: (goalId: string, content: string) => void;
  startGoalCreation: () => void;
  stopGoalCreation: () => void;

  // Pending commands actions
  cancelPendingCommands: (reason?: string) => Promise<void>;
  confirmPendingCommands: () => Promise<void>;

  // Task actions (for ActionGoals)
  toggleTask: (goalId: string, taskId: string) => void;
  addTask: (goalId: string, title: string) => void;

  // Subgoal actions
  createSubgoal: (data: any, parentGoalId: string) => Promise<void>;
  updateGoalProgress: (goalId: string, data: any) => Promise<void>;

  // Finance actions
  syncFinanceGoal: (goalId: string) => void;

  // Item actions
  searchAndUpdateGoal: (goalId: string, query?: string) => Promise<void>;

  // User actions
  setUser: (user: User | null) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  logout: () => void;
  setDemoMode: (enabled: boolean) => void;

  // API integration methods
  initializeApp: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchUser: () => Promise<void>;
  saveSettings: (settings: Partial<Settings>) => Promise<void>;
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
      sidebarOpen: false, // Start closed; desktop opens via useEffect in Index.tsx
      activeCategory: 'all',
      isChatMinimized: false,
      isDemoMode: false,

      goals: [],
      user: null, // Start with no user - requires login
      settings: defaultSettings,
      isLoading: false,
      error: null,
      isCreatingGoal: false,
      pendingCommands: null,

      creationChat: {
        messages: [
          {
            id: '1',
            role: 'assistant',
            content: "What would you like to work on today? I can help you with:\n\n- **Items** - Products you want to purchase\n- **Finances** - Money goals and tracking\n- **Actions** - Skills to learn or habits to build",
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

      toggleChatMinimized: () => set((state) => ({ isChatMinimized: !state.isChatMinimized })),

      setDemoMode: (isDemoMode) => set({ isDemoMode }),

      // Goal CRUD (local state updates)
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
          currentGoalId: state.currentGoalId === id ? null : state.currentGoalId,
        }));
      },

      archiveGoal: async (id) => {
        // Call the backend API to archive the goal
        try {
          const updated = await goalsService.archive(id);
          // Update local state with backend response
          set((state) => ({
            goals: state.goals.map((goal) =>
              goal.id === id ? { ...goal, status: 'archived', updatedAt: new Date() } : goal
            ),
          }));
        } catch (error) {
          console.error('Failed to archive goal:', error);
        }
      },
      
      // Chat actions
      sendCreationMessage: async (content) => {
        // Clear any pending commands when user sends a new message (edit flow)
        if (get().pendingCommands) {
          set({ pendingCommands: null });
        }

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

        try {
          // Check if in goal creation mode
          if (get().isCreatingGoal) {
            const response = await aiGoalCreationService.chat(content);

            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: response.content,
              timestamp: new Date(),
              goalPreview: response.goalPreview,
              awaitingConfirmation: response.awaitingConfirmation,
            };

            set((state) => ({
              creationChat: {
                ...state.creationChat,
                messages: [...state.creationChat.messages, assistantMessage],
                isLoading: false,
              },
            }));

            // If goal was created, add it to the list and exit creation mode
            if (response.goalCreated && response.goal) {
              set((state) => ({
                goals: [...state.goals, response.goal],
                isCreatingGoal: false,
                // Reset chat with success message
                creationChat: {
                  messages: [{
                    id: 'reset',
                    role: 'assistant',
                    content: "🎉 Your goal has been created! Ready to talk about your next goal!",
                    timestamp: new Date(),
                  }],
                  isLoading: false,
                },
              }));

              // Refresh goals from server
              await get().fetchGoals();
            }
          } else {
            // Regular chat mode with streaming
            // Check if demo mode is enabled
            const isDemo = get().isDemoMode;
            const chatService = isDemo ? mockOverviewChatService : aiOverviewChatService;

            // Create a placeholder assistant message that will be updated as chunks arrive
            const assistantMessageId = (Date.now() + 1).toString();
            const assistantMessage: Message = {
              id: assistantMessageId,
              role: 'assistant',
              content: '',
              timestamp: new Date(),
            };

            set((state) => ({
              creationChat: {
                ...state.creationChat,
                messages: [...state.creationChat.messages, assistantMessage],
              },
            }));

            try {
              // Stream the response using appropriate chat service
              let fullContent = '';
              let commands: any[] = [];
              let finalChunk: any = {};

              // For demo mode, use non-streaming mock service to avoid generator complexity
              console.log('[sendCreationMessage] isDemoMode:', get().isDemoMode, 'captured isDemo:', isDemo);
              if (isDemo) {
                const demoResponse = await mockOverviewChatService.chat(content);
                set((state) => ({
                  creationChat: {
                    ...state.creationChat,
                    messages: state.creationChat.messages.map(msg =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: demoResponse.content }
                        : msg
                    ),
                    isLoading: false,
                  },
                }));

                // Execute commands from demo response
                if (demoResponse.commands.length > 0) {
                  for (const cmd of demoResponse.commands) {
                    if (cmd.type === 'CREATE_GOAL') {
                      // Create a new goal directly in demo mode
                      const newGoal = {
                        ...cmd.data,
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        status: 'active',
                        createdAt: new Date(),
                      };
                      set((state) => ({
                        goals: [...state.goals, newGoal],
                      }));
                      console.log('✅ Demo Mode: Created goal locally:', newGoal.title);
                    } else if (cmd.type === 'CREATE_SUBGOAL') {
                      const parentGoalId = cmd.data.parentGoalId || '';
                      await get().createSubgoal(cmd.data, parentGoalId);
                    }
                  }
                }
                return;
              }

              // Real service: use streaming
              const streamResult = chatService.chatStream({ message: content });
              const fullResponse = await (async () => {
                for await (const chunk of streamResult) {
                  fullContent += chunk.content;

                  // Capture the final chunk with all metadata
                  if (chunk.done) {
                    finalChunk = chunk;
                  }

                  // Update the message with accumulated content and metadata
                  set((state) => ({
                      creationChat: {
                        ...state.creationChat,
                        messages: state.creationChat.messages.map(msg =>
                          msg.id === assistantMessageId
                            ? {
                                ...msg,
                                content: fullContent,
                                ...(chunk.done && (chunk as any).goalPreview && {
                                  goalPreview: (chunk as any).goalPreview,
                                  awaitingConfirmation: (chunk as any).awaitingConfirmation,
                                }),
                              }
                            : msg
                        ),
                        ...(chunk.done && { isLoading: false }),
                      },
                    }));
                }
                // The generator returns the full response (for real service)
                return await streamResult.next().then(r => r.value);
              })();

              // If message has goalPreview awaiting confirmation, store commands and wait for user
              if (finalChunk.awaitingConfirmation && finalChunk.goalPreview) {
                // Store pending commands for later confirmation
                set({ pendingCommands: finalChunk.commands || [] });
                return;
              }

              // Extract commands from the response (if any)
              commands = finalChunk.commands || (fullResponse as any)?.commands || [];

              // Execute commands from the response
              if (commands.length > 0) {
                // For overview chat, commands create goals
                for (const cmd of commands) {
                  if (cmd.type === 'CREATE_SUBGOAL') {
                    // Use parentGoalId from command data if provided, otherwise empty for top-level
                    const parentGoalId = cmd.data.parentGoalId || '';
                    await get().createSubgoal(cmd.data, parentGoalId);
                  }
                }
                // Refresh goals to show new additions
                if (!isDemo) {
                  await get().fetchGoals();
                }
              }

              return;
            } catch (streamError) {
              console.error('Streaming failed, falling back to regular chat:', streamError);
              // Fallback to regular chat - respect demo mode
              const chatResponse = isDemo
                ? await mockOverviewChatService.chat(content)
                : await aiService.chat({
                    messages: get().creationChat.messages,
                    mode: 'creation',
                  });

              set((state) => ({
                creationChat: {
                  ...state.creationChat,
                  messages: state.creationChat.messages.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: chatResponse.content }
                      : msg
                  ),
                  isLoading: false,
                },
              }));

              // Check if AI detected goal creation intent (skip in demo mode)
              if (!isDemo && (chatResponse as any).shouldEnterGoalCreation && !get().isCreatingGoal) {
                await aiGoalCreationService.startSession();
                get().startGoalCreation();

                // Re-send the user's message to the new OpenAI service
                const response = await aiGoalCreationService.chat(content);

                const newAssistantMessage: Message = {
                  id: (Date.now() + 2).toString(),
                  role: 'assistant',
                  content: response.content,
                  timestamp: new Date(),
                  goalPreview: response.goalPreview,
                  awaitingConfirmation: response.awaitingConfirmation,
                };

                set((state) => ({
                  creationChat: {
                    ...state.creationChat,
                    messages: [...state.creationChat.messages, newAssistantMessage],
                    isLoading: false,
                  },
                }));

                // If goal was created, add it to the list and exit creation mode
                if (response.goalCreated && response.goal) {
                  const transformedGoal = response.goal;
                  set((state) => ({
                    goals: [...state.goals, transformedGoal],
                    isCreatingGoal: false,
                    creationChat: {
                      messages: [{
                        id: 'reset',
                        role: 'assistant',
                        content: "🎉 Your goal has been created! Ready to talk about your next goal!",
                        timestamp: new Date(),
                      }],
                      isLoading: false,
                    },
                  }));
                  await get().fetchGoals();
                }

                return; // Exit early since we handled the message with the new service
              }
            }
          }
        } catch (error) {
          console.error('AI chat error:', error);
          // Fallback to mock response on error
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
        }
      },

      sendGoalMessage: async (goalId, content) => {
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

        try {
          // Check if demo mode is enabled
          const isDemo = get().isDemoMode;
          const chatService = isDemo ? mockGoalChatService : aiGoalChatService;

          // Use the appropriate goal chat service - mockGoalChatService takes (goalId, message) while aiGoalChatService takes (goalId, {message})
          const response = isDemo
            ? await mockGoalChatService.chat(goalId, content)
            : await aiGoalChatService.chat(goalId, { message: content });

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.content,
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

          // Execute commands if present
          if (response.commands && response.commands.length > 0) {
            for (const cmd of response.commands) {
              if (cmd.type === 'CREATE_SUBGOAL') {
                // Use parentGoalId from command data if provided, otherwise use current goal
                const parentGoalId = cmd.data.parentGoalId || goalId;
                await get().createSubgoal(cmd.data, parentGoalId);
              } else if (cmd.type === 'UPDATE_PROGRESS') {
                await get().updateGoalProgress(goalId, cmd.data);
              }
            }
            // Refresh goals to show new subgoals (only if not in demo mode)
            if (!isDemo) {
              await get().fetchGoals();
            }
          }
        } catch (error) {
          console.error('AI goal chat error:', error);
          // Fallback to mock response on error
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
        }
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

      // Subgoal actions
      createSubgoal: async (data, parentGoalId) => {
        try {
          const userId = get().user?.id;
          if (!userId) throw new Error('User not authenticated');

          const isDemo = get().isDemoMode;
          let newSubgoal;

          if (isDemo) {
            // Demo mode: create goal locally without API call
            newSubgoal = {
              id: Date.now().toString(),
              ...data,
              parentGoalId,
              userId,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Goal;

            // Add to local state immediately
            set((state) => ({
              goals: [...state.goals, newSubgoal],
            }));

            console.log('✅ Demo Mode: Created subgoal locally:', newSubgoal.title);
          } else {
            // Production mode: create via API
            const goalData = {
              ...data,
              parentGoalId,
              userId,
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

            console.log('✅ Created subgoal:', newSubgoal.title);
          }
        } catch (error) {
          console.error('Failed to create subgoal:', error);
          throw error;
        }
      },

      updateGoalProgress: async (goalId, data) => {
        try {
          // Update progress based on data structure
          // This could update balance, tasks, etc.
          console.log('Updating progress for goal:', goalId, data);

          // For now, trigger a refetch to get updated data
          await get().fetchGoals();
        } catch (error) {
          console.error('Failed to update progress:', error);
          throw error;
        }
      },

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

      // Item actions
      searchAndUpdateGoal: async (goalId, query) => {
        try {
          // Immediately update status to searching
          set((state) => ({
            goals: state.goals.map((goal) =>
              goal.id === goalId && goal.type === 'item'
                ? { ...goal, statusBadge: 'pending_search' }
                : goal
            ),
          }));

          // Call the new endpoint
          await goalsService.refreshCandidates(goalId);

          // Note: The backend will process the job asynchronously
          // Candidates will be updated within ~2 minutes
          console.log('[searchAndUpdateGoal] Scraping job queued for goal:', goalId);
        } catch (error) {
          console.error('Failed to refresh candidates:', error);
          // Revert status on error
          set((state) => ({
            goals: state.goals.map((goal) =>
              goal.id === goalId && (goal as any).statusBadge === 'pending_search'
                ? { ...goal, statusBadge: 'in_stock' }
                : goal
            ),
          }));
        }
      },

      // User actions
      setUser: (user) => set({ user }),

      logout: () => {
        // Use authService to clear tokens
        authService.logout();
        // Clear user data
        set({ user: null, goals: [] });
      },

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

      // Pending commands actions
      cancelPendingCommands: async (reason = 'Changed my mind') => {
        try {
          const token = localStorage.getItem('auth_token');
          const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

          const response = await fetch(`${API_BASE}/ai/overview/chat/cancel-commands`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ reason }),
          });

          if (!response.ok) {
            console.error('Failed to cancel commands:', response.status);
          }

          // Clear pending commands regardless of response
          set({ pendingCommands: null });

          // Add a system message to show cancellation
          set((state) => ({
            creationChat: {
              ...state.creationChat,
              messages: [
                ...state.creationChat.messages,
                {
                  id: 'cancel-' + Date.now(),
                  role: 'assistant',
                  content: `Goal creation cancelled: ${reason}`,
                  timestamp: new Date(),
                },
              ],
            },
          }));
        } catch (error) {
          console.error('Failed to cancel commands:', error);
          // Clear pending commands on error too
          set({ pendingCommands: null });
        }
      },

      confirmPendingCommands: async () => {
        const commands = get().pendingCommands;
        if (!commands || commands.length === 0) {
          console.error('No pending commands to confirm');
          return;
        }

        try {
          const token = localStorage.getItem('auth_token');
          const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

          const response = await fetch(`${API_BASE}/ai/overview/chat/confirm-commands`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ commands }),
          });

          if (!response.ok) {
            throw new Error(`Failed to confirm commands: ${response.status}`);
          }

          // Clear pending commands after successful confirmation
          set({ pendingCommands: null });

          // Refresh goals to show newly created goals
          await get().fetchGoals();

          // Add success message
          set((state) => ({
            creationChat: {
              ...state.creationChat,
              messages: [
                ...state.creationChat.messages,
                {
                  id: 'confirm-' + Date.now(),
                  role: 'assistant',
                  content: '✅ Goals created successfully!',
                  timestamp: new Date(),
                },
              ],
            },
          }));
        } catch (error) {
          console.error('Failed to confirm commands:', error);
          set((state) => ({
            creationChat: {
              ...state.creationChat,
              messages: [
                ...state.creationChat.messages,
                {
                  id: 'error-' + Date.now(),
                  role: 'assistant',
                  content: `❌ Failed to create goals: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  timestamp: new Date(),
                },
              ],
            },
          }));
        }
      },

      // Goal creation mode actions
      startGoalCreation: () => {
        const currentMessages = get().creationChat.messages;

        set({ isCreatingGoal: true });

        // Preserve existing conversation instead of clearing it
        // Only add a transition message if we don't have one yet
        const hasTransitionMessage = currentMessages.some(
          m => m.role === 'assistant' && m.content.includes('help you create a new goal')
        );

        if (!hasTransitionMessage) {
          set((state) => ({
            creationChat: {
              ...state.creationChat,
              messages: [
                ...state.creationChat.messages,
                {
                  id: 'transition-' + Date.now(),
                  role: 'assistant',
                  content: "Great! I'll help you create that goal. Let me ask you a few questions to get the details right.",
                  timestamp: new Date(),
                },
              ],
            },
          }));
        }
      },

      stopGoalCreation: async () => {
        set({ isCreatingGoal: false });
        // Cancel the session and delete the OpenAI thread
        await aiGoalCreationService.cancelSession();
        // Reset chat to default
        set({
          creationChat: {
            messages: [{
              id: '1',
              role: 'assistant',
              content: "What would you like to work on today? I can help you with:\n\n- **Items** - Products you want to purchase\n- **Finances** - Money goals and tracking\n- **Actions** - Skills to learn or habits to build",
              timestamp: new Date(),
            }],
            isLoading: false,
          },
        });
      },

      confirmGoalCreation: async () => {
        try {
          const response = await aiGoalCreationService.confirmGoal();

          // Log the raw goal response for debugging
          console.log('🔍 Raw goal response:', JSON.stringify(response.goal, null, 2));

          // If goal was created, add it to the list, exit creation mode, and reset chat
          if (response.goalCreated && response.goal) {
            // Transform the goal data to flatten nested fields (same as goalsService.transformGoal)
            const goal = response.goal;
            let transformedGoal = goal;
            if (goal.type === 'finance' && goal.financeData) {
              transformedGoal = {
                ...goal,
                institutionIcon: goal.financeData.institutionIcon,
                accountName: goal.financeData.accountName,
                currentBalance: goal.financeData.currentBalance,
                targetBalance: goal.financeData.targetBalance,
                currency: goal.financeData.currency,
                progressHistory: goal.financeData.progressHistory || [],
                lastSync: goal.financeData.lastSync,
              };
            } else if (goal.type === 'item' && goal.itemData) {
              transformedGoal = {
                ...goal,
                productImage: goal.itemData.productImage,
                bestPrice: goal.itemData.bestPrice,
                currency: goal.itemData.currency,
                retailerUrl: goal.itemData.retailerUrl,
                retailerName: goal.itemData.retailerName,
                statusBadge: goal.itemData.statusBadge,
                searchResults: goal.itemData.searchResults,
              };
            } else if (goal.type === 'action' && goal.actionData) {
              transformedGoal = {
                ...goal,
                completionPercentage: goal.actionData.completionPercentage,
                tasks: goal.actionData.tasks || [],
              };
            }

            set((state) => ({
              goals: [...state.goals, transformedGoal],
              isCreatingGoal: false,
              // Reset chat with success message
              creationChat: {
                messages: [{
                  id: 'reset',
                  role: 'assistant',
                  content: "🎉 Your goal has been created! Ready to talk about your next goal!",
                  timestamp: new Date(),
                }],
                isLoading: false,
              },
            }));

            // Refresh goals from server
            await get().fetchGoals();
          }
        } catch (error) {
          console.error('Failed to confirm goal:', error);
        }
      },

      // API integration methods
      initializeApp: async () => {
        const token = authService.initializeAuth();
        if (token) {
          await get().fetchUser();
          await get().fetchGoals();
        }
      },

      fetchUser: async () => {
        try {
          set({ isLoading: true, error: null });
          const user = await authService.getProfile();
          set({ user, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch user:', error);
          // Auto-enable demo mode on 401 Unauthorized
          if (error?.response?.status === 401 || error?.status === 401) {
            console.log('⚠️ Authentication failed - enabling demo mode');
            set({ error: null, isLoading: false, isDemoMode: true });
          } else {
            set({ error: 'Failed to fetch user profile', isLoading: false });
          }
        }
      },

      fetchGoals: async () => {
        try {
          set({ isLoading: true, error: null });
          const category = get().activeCategory;
          const filters = category !== 'all' ? { type: category } : undefined;
          const goals = await goalsService.getAll(filters);
          set({ goals, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch goals:', error);
          // Auto-enable demo mode on 401 Unauthorized
          if (error?.response?.status === 401 || error?.status === 401) {
            console.log('⚠️ Authentication failed - enabling demo mode');
            // Don't overwrite existing goals - they might be from localStorage or demo initialization
            set({ error: null, isLoading: false, isDemoMode: true });
          } else {
            set({ error: 'Failed to fetch goals', isLoading: false });
          }
        }
      },

      saveSettings: async (newSettings) => {
        try {
          set({ isLoading: true, error: null });
          await usersService.updateSettings(newSettings);
          set((state) => ({
            settings: { ...state.settings, ...newSettings },
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to save settings:', error);
          set({ error: 'Failed to save settings', isLoading: false });
        }
      },
    }),
    {
      name: 'goals-af-storage',
      partialize: (state) => ({
        // Persist user for session continuity
        user: state.user,
        // Persist demo mode flag
        isDemoMode: state.isDemoMode,
        // Persist goals for demo mode (real users fetch from API)
        goals: state.goals,
        settings: state.settings,
        viewMode: state.viewMode,
        activeCategory: state.activeCategory,
        isChatMinimized: state.isChatMinimized,
      }),
      onRehydrateStorage: () => (state) => {
        // Reset creation chat to default greeting on page load
        if (state) {
          state.creationChat = {
            messages: [
              {
                id: '1',
                role: 'assistant',
                content: "What would you like to work on today? I can help you with:\n\n- **Items** - Products you want to purchase\n- **Finances** - Money goals and tracking\n- **Actions** - Skills to learn or habits to build",
                timestamp: new Date(),
              }
            ],
            isLoading: false,
          };
        }
      },
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
