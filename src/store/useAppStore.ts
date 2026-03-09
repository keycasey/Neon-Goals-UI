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
import type { PlaidAccount } from '@/services/plaidService';
import { authService } from '@/services/authService';
import { goalsService } from '@/services/goalsService';
import { usersService } from '@/services/usersService';
import { chatsService } from '@/services/chatsService';
import { aiGoalCreationService } from '@/services/aiGoalCreationService';
import { aiOverviewChatService } from '@/services/aiOverviewChatService';
import { aiGoalChatService } from '@/services/aiGoalChatService';
import { aiSpecialistChatService } from '@/services/aiSpecialistChatService';
import { mockOverviewChatService } from '@/services/mockChatService';
import { mockGoalChatService } from '@/services/mockChatService';
import { browserUseService } from '@/services/browserUseService';
import { plaidService } from '@/services/plaidService';

// Re-export types from ./types for backward compatibility
export type { ChatCommand, PendingCommandsState } from './types';
import type { ChatCommand, PendingCommandsState } from './types';

interface AppState {
  // View state
  viewMode: ViewMode;
  currentGoalId: string | null;
  goalNavigationStack: string[]; // Stack of parent goal IDs for drill-down navigation
  navigationDirection: 'forward' | 'back' | null; // Track animation direction
  sidebarOpen: boolean;
  activeCategory: GoalCategory;
  isChatMinimized: boolean;
  isDemoMode: boolean; // Demo mode flag - offline mode with mock data
  chatPulseTrigger: number; // Counter to trigger chat pulse animation

  // Data
  goals: Goal[];
  goalsVersion: number; // Increment when goals are fetched to force re-renders
  plaidAccounts: PlaidAccount[]; // Linked bank/credit accounts
  plaidAccountsVersion: number; // Increment for re-renders
  user: User | null;
  settings: Settings;

  // Chat state
  creationChat: ChatState; // Goal creation chat (temporary workflow)
  goalChats: Record<string, ChatState>; // Per-goal chats
  overviewChat: ChatState | null; // Persistent overview chat (separate from creation)
  categoryChats: {
    items: ChatState | null;
    finances: ChatState | null;
    actions: ChatState | null;
  }; // Category specialist chats
  isCreatingGoal: boolean; // Track if in goal creation flow
  pendingCommands: PendingCommandsState | null; // Commands awaiting user confirmation (with chatId)
  handledProposals: Set<string>; // Track which proposal messages have had actions taken
  latestProposalMessageIds: Record<string, string | null>; // Track latest proposal message ID per chat (chatId -> messageId)
  activeStreams: Set<string>; // Track active stream IDs for streaming management

  // Loading state
  isLoading: boolean;
  error: string | null;

  // View actions
  setViewMode: (mode: ViewMode) => void;
  selectGoal: (id: string | null) => void;
  drillIntoGoal: (id: string) => void; // Navigate into a subgoal (pushes current to stack)
  navigateBack: () => void; // Go back one level in navigation stack
  navigateToGoal: (id: string | null) => void; // Direct navigation (clears stack)
  closeGoal: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveCategory: (category: GoalCategory) => void;
  toggleChatMinimized: () => void;
  triggerChatPulse: () => void;

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
  addAssistantMessage: (mode: 'creation' | 'goal', goalId: string | undefined, content: string) => void;
  markProposalHandled: (messageId: string) => void;
  isProposalHandled: (messageId: string) => boolean;
  isLatestProposal: (chatId: string, messageId: string) => boolean;
  setLatestProposal: (chatId: string, messageId: string) => void;

  // Pending commands actions
  cancelPendingCommands: (reason?: string) => Promise<void>;
  confirmPendingCommands: () => Promise<void>;

  // Overview chat actions
  fetchOverviewChat: () => Promise<void>;
  sendOverviewMessage: (content: string) => Promise<void>;
  stopOverviewStream: () => Promise<void>;

  // Category specialist chat actions
  fetchCategoryChat: (categoryId: 'items' | 'finances' | 'actions') => Promise<void>;
  sendCategoryMessage: (categoryId: 'items' | 'finances' | 'actions', content: string) => Promise<void>;
  stopCategoryStream: (categoryId: 'items' | 'finances' | 'actions') => Promise<void>;

  // Goal chat actions
  fetchGoalChat: (goalId: string) => Promise<void>;

  // Stream management actions
  setActiveStream: (streamId: string, active: boolean) => void;
  isStreamActive: (streamId: string) => boolean;

  // Message editing actions
  editMessage: (chatType: 'overview' | 'category' | 'goal', chatId: string, messageId: string, newContent: string) => Promise<void>;

  // Command execution helper
  executeChatCommand: (command: ChatCommand) => Promise<void>;

  // Task actions (for ActionGoals)
  toggleTask: (goalId: string, taskId: string) => void;
  addTask: (goalId: string, title: string) => void;

  // Subgoal actions
  createSubgoal: (data: any, parentGoalId: string) => Promise<void>;
  updateGoalProgress: (goalId: string, data: any) => Promise<void>;

  // Finance actions
  syncFinanceGoal: (goalId: string) => void;

  // Plaid actions
  fetchPlaidAccounts: () => Promise<void>;
  addPlaidAccounts: (accounts: PlaidAccount[]) => void;
  removePlaidAccount: (accountId: string) => Promise<void>;
  syncPlaidAccount: (accountId: string) => Promise<void>;

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

const toMessageContent = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      viewMode: 'card',
      currentGoalId: null,
      goalNavigationStack: [], // Stack of parent goal IDs for drill-down
      navigationDirection: null, // Track animation direction
      sidebarOpen: false, // Start closed; desktop opens via useEffect in Index.tsx
      activeCategory: 'all',
      isChatMinimized: false,
      isDemoMode: false,
      chatPulseTrigger: 0,

      goals: [],
      goalsVersion: 0,
      plaidAccounts: [],
      plaidAccountsVersion: 0,
      user: null, // Start with no user - requires login
      settings: defaultSettings,
      isLoading: false,
      error: null,
      isCreatingGoal: false,
      pendingCommands: null,
      handledProposals: new Set<string>(), // Track which proposal messages have had actions taken
      latestProposalMessageIds: {}, // Track latest proposal message ID per chat
      overviewChat: null,
      categoryChats: {
        items: null,
        finances: null,
        actions: null,
      },
      activeStreams: new Set<string>(),

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

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setActiveCategory: (category) => set({ activeCategory: category }),

      toggleChatMinimized: () => set((state) => ({ isChatMinimized: !state.isChatMinimized })),

      triggerChatPulse: () => set((state) => ({ chatPulseTrigger: state.chatPulseTrigger + 1 })),

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
              proposalType: (response as any).proposalType,
            };

            set((state) => ({
              creationChat: {
                ...state.creationChat,
                messages: [...state.creationChat.messages, assistantMessage],
                isLoading: false,
              },
            }));

            // Track latest proposal
            if (response.awaitingConfirmation) {
              get().setLatestProposal('creation', assistantMessage.id);
            }

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
                                ...(chunk.done && chunk.goalPreview && {
                                  goalPreview: chunk.goalPreview,
                                  awaitingConfirmation: chunk.awaitingConfirmation,
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
                set({
                  pendingCommands: {
                    chatId: 'creation',
                    commands: finalChunk.commands || [],
                    timestamp: Date.now(),
                  },
                });
                // Track latest proposal
                get().setLatestProposal('creation', assistantMessageId);
                return;
              }

              // Extract commands from the response (if any)
              commands = finalChunk.commands || [];

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
              console.error('Streaming failed, falling back to non-streaming chat:', streamError);
              // Fallback to non-streaming overview chat (OpenAI) - respect demo mode
              const chatResponse = isDemo
                ? await mockOverviewChatService.chat(content)
                : await aiOverviewChatService.chat({ message: content });

              set((state) => ({
                creationChat: {
                  ...state.creationChat,
                  messages: state.creationChat.messages.map(msg =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: chatResponse.content,
                          ...(chatResponse.commands && {
                            goalPreview: chatResponse.commands[0]?.data ? JSON.stringify(chatResponse.commands[0].data, null, 2) : undefined,
                            awaitingConfirmation: (chatResponse.commands?.length || 0) > 0,
                            proposalType: chatResponse.commands?.[0]?.data?.proposalType || 'accept_decline',
                          }),
                        }
                      : msg
                  ),
                  isLoading: false,
                },
              }));

              // Handle commands from non-streaming response (OpenAI format)
              if (!isDemo && chatResponse.commands && chatResponse.commands.length > 0) {
                set({
                  pendingCommands: {
                    chatId: 'creation',
                    commands: chatResponse.commands as unknown as ChatCommand[],
                    timestamp: Date.now(),
                  },
                });
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
            goalPreview: (response as any).goalPreview,
            awaitingConfirmation: (response as any).awaitingConfirmation,
            proposalType: (response as any).proposalType,
            commands: response.commands,
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

          // Track latest proposal
          if ((response as any).awaitingConfirmation) {
            get().setLatestProposal(`goal-${goalId}`, assistantMessage.id);
          }

          // Store pending commands for user confirmation (goal chat)
          if ((response as any).awaitingConfirmation && response.commands?.length > 0) {
            set({
              pendingCommands: {
                chatId: `goal-${goalId}`,
                commands: response.commands,
                timestamp: Date.now(),
              },
            });
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

      // Plaid actions
      fetchPlaidAccounts: async () => {
        const isDemo = get().isDemoMode;
        if (isDemo) {
          // Demo mode: use mock accounts from usePlaidLink
          return;
        }

        try {
          const fetchedAccounts = await plaidService.getAccounts();
          console.log('[store] Fetched Plaid accounts:', fetchedAccounts.map(a => ({
            id: a.id,
            name: a.accountName,
            type: a.accountType,
            subtype: a.accountSubtype,
          })));
          // Deduplicate by plaidAccountId
          const uniqueAccounts = fetchedAccounts.filter((account, index, self) =>
            index === self.findIndex(a => a.plaidAccountId === account.plaidAccountId)
          );
          set({
            plaidAccounts: uniqueAccounts,
            plaidAccountsVersion: get().plaidAccountsVersion + 1,
          });
        } catch (err) {
          console.error('[store] Failed to fetch Plaid accounts:', err);
          set({ plaidAccounts: [] });
        }
      },

      addPlaidAccounts: (accounts) => set((state) => {
        // Deduplicate by plaidAccountId
        const existingIds = new Set(state.plaidAccounts.map(a => a.plaidAccountId));
        const newAccounts = accounts.filter(a => !existingIds.has(a.plaidAccountId));
        return {
          plaidAccounts: [...state.plaidAccounts, ...newAccounts],
          plaidAccountsVersion: state.plaidAccountsVersion + 1,
        };
      }),

      removePlaidAccount: async (accountId) => {
        try {
          const isDemo = get().isDemoMode;
          if (!isDemo) {
            try {
              await plaidService.deleteAccount(accountId);
            } catch (err) {
              // If endpoint doesn't exist, still remove from local state
              if (err instanceof Error && !err.message.includes('404')) {
                throw err;
              }
              console.log('[store] Delete endpoint not available, removing from local state only');
            }
          }
          // Remove from local state
          set((state) => ({
            plaidAccounts: state.plaidAccounts.filter(a => a.id !== accountId),
            plaidAccountsVersion: state.plaidAccountsVersion + 1,
          }));
        } catch (err) {
          console.error('[store] Failed to remove Plaid account:', err);
          throw err;
        }
      },

      syncPlaidAccount: async (accountId) => {
        try {
          const isDemo = get().isDemoMode;
          if (!isDemo) {
            await plaidService.syncAccount(accountId);
          }
          // Refresh all accounts after sync
          await get().fetchPlaidAccounts();
        } catch (err) {
          console.error('[store] Failed to sync Plaid account:', err);
        }
      },

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
            goalsVersion: state.goalsVersion + 1, // Force re-renders
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
            goalsVersion: state.goalsVersion + 1, // Force re-renders
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
        const pending = get().pendingCommands;
        if (!pending) {
          console.error('No pending commands to cancel');
          return;
        }

        const { chatId } = pending;

        try {
          const isDemo = get().isDemoMode;
          if (!isDemo) {
            // Production mode: call the appropriate cancel endpoint
            if (chatId === 'overview' || chatId === 'creation') {
              await aiOverviewChatService.cancelCommands(reason);
            } else if (chatId === 'items' || chatId === 'finances' || chatId === 'actions') {
              await aiSpecialistChatService.cancelCommands(chatId, reason);
            }
          }

          // Clear pending commands
          set({ pendingCommands: null });

          // Add cancellation message to the appropriate chat
          const cancelMessage: Message = {
            id: 'cancel-' + Date.now(),
            role: 'assistant',
            content: `Commands cancelled: ${reason}`,
            timestamp: new Date(),
          };

          if (chatId === 'overview') {
            set((state) => ({
              overviewChat: state.overviewChat ? {
                ...state.overviewChat,
                messages: [...state.overviewChat.messages, cancelMessage],
              } : null,
            }));
          } else if (chatId === 'creation') {
            set((state) => ({
              creationChat: {
                ...state.creationChat,
                messages: [...state.creationChat.messages, cancelMessage],
              },
            }));
          } else if (chatId === 'items' || chatId === 'finances' || chatId === 'actions') {
            set((state) => ({
              categoryChats: {
                ...state.categoryChats,
                [chatId]: state.categoryChats[chatId] ? {
                  ...state.categoryChats[chatId],
                  messages: [...state.categoryChats[chatId].messages, cancelMessage],
                } : null,
              },
            }));
          }
        } catch (error) {
          console.error('Failed to cancel commands:', error);
          // Clear pending commands on error too
          set({ pendingCommands: null });
        }
      },

      confirmPendingCommands: async () => {
        const pending = get().pendingCommands;
        if (!pending || !pending.commands || pending.commands.length === 0) {
          console.error('No pending commands to confirm');
          return;
        }

        const { chatId, commands } = pending;

        try {
          const isDemo = get().isDemoMode;
          if (!isDemo) {
            // Production mode: call the appropriate confirm endpoint
            if (chatId === 'overview' || chatId === 'creation') {
              await aiOverviewChatService.confirmCommands(commands as any);
            } else if (chatId?.startsWith('goal-')) {
              // Goal chat: extract goalId from chatId (format: "goal-{goalId}")
              const goalId = chatId.replace('goal-', '');
              await aiGoalChatService.confirmCommands(goalId, commands);
            } else if (chatId === 'items' || chatId === 'finances' || chatId === 'actions') {
              await aiSpecialistChatService.confirmCommands(chatId, commands);
            }
          } else {
            // Demo mode: execute commands locally
            for (const cmd of commands) {
              await get().executeChatCommand(cmd);
            }
          }

          // Clear pending commands after successful confirmation
          set({ pendingCommands: null });

          // Refresh goals to show changes
          await get().fetchGoals();

          // Add success message to the appropriate chat
          const successMessage: Message = {
            id: 'confirm-' + Date.now(),
            role: 'assistant',
            content: '✅ Commands executed successfully!',
            timestamp: new Date(),
          };

          if (chatId === 'overview') {
            set((state) => ({
              overviewChat: state.overviewChat ? {
                ...state.overviewChat,
                messages: [...state.overviewChat.messages, successMessage],
              } : null,
            }));
          } else if (chatId === 'creation') {
            set((state) => ({
              creationChat: {
                ...state.creationChat,
                messages: [...state.creationChat.messages, successMessage],
              },
            }));
          } else if (chatId?.startsWith('goal-')) {
            // Goal chat: extract goalId and add success message
            const goalId = chatId.replace('goal-', '');
            set((state) => ({
              goalChats: {
                ...state.goalChats,
                [goalId]: state.goalChats[goalId] ? {
                  ...state.goalChats[goalId],
                  messages: [...state.goalChats[goalId].messages, successMessage],
                } : { messages: [successMessage], isLoading: false },
              },
            }));
          } else if (chatId === 'items' || chatId === 'finances' || chatId === 'actions') {
            set((state) => ({
              categoryChats: {
                ...state.categoryChats,
                [chatId]: state.categoryChats[chatId] ? {
                  ...state.categoryChats[chatId],
                  messages: [...state.categoryChats[chatId].messages, successMessage],
                } : null,
              },
            }));
          }
        } catch (error) {
          console.error('Failed to confirm commands:', error);

          // Add error message to the appropriate chat
          const errorMessage: Message = {
            id: 'error-' + Date.now(),
            role: 'assistant',
            content: `❌ Failed to execute commands: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
          };

          if (chatId === 'overview') {
            set((state) => ({
              overviewChat: state.overviewChat ? {
                ...state.overviewChat,
                messages: [...state.overviewChat.messages, errorMessage],
              } : null,
            }));
          } else if (chatId === 'creation') {
            set((state) => ({
              creationChat: {
                ...state.creationChat,
                messages: [...state.creationChat.messages, errorMessage],
              },
            }));
          } else if (chatId?.startsWith('goal-')) {
            // Goal chat: extract goalId and add error message
            const goalId = chatId.replace('goal-', '');
            set((state) => ({
              goalChats: {
                ...state.goalChats,
                [goalId]: state.goalChats[goalId] ? {
                  ...state.goalChats[goalId],
                  messages: [...state.goalChats[goalId].messages, errorMessage],
                } : { messages: [errorMessage], isLoading: false },
              },
            }));
          } else if (chatId === 'items' || chatId === 'finances' || chatId === 'actions') {
            set((state) => ({
              categoryChats: {
                ...state.categoryChats,
                [chatId]: state.categoryChats[chatId] ? {
                  ...state.categoryChats[chatId],
                  messages: [...state.categoryChats[chatId].messages, errorMessage],
                } : null,
              },
            }));
          }
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

      // Add an assistant message without triggering API call (for Edit action)
      addAssistantMessage: (mode: 'creation' | 'goal', goalId: string | undefined, content: string) => {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content,
          timestamp: new Date(),
        };

        if (mode === 'creation') {
          set((state) => ({
            creationChat: {
              ...state.creationChat,
              messages: [...state.creationChat.messages, assistantMessage],
            },
          }));
        } else if (goalId) {
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

      // Mark a proposal message as handled (action button clicked)
      markProposalHandled: (messageId: string) => {
        set((state) => ({
          handledProposals: new Set([...state.handledProposals, messageId]),
        }));
      },

      // Check if a proposal message has been handled
      isProposalHandled: (messageId: string) => {
        return get().handledProposals.has(messageId);
      },

      // Check if a proposal is the latest one for its chat
      isLatestProposal: (chatId: string, messageId: string) => {
        return get().latestProposalMessageIds[chatId] === messageId;
      },

      // Set the latest proposal message ID for a chat
      setLatestProposal: (chatId: string, messageId: string) => {
        set((state) => ({
          latestProposalMessageIds: {
            ...state.latestProposalMessageIds,
            [chatId]: messageId,
          },
        }));
      },

      // ========== Overview Chat Actions ==========

      fetchOverviewChat: async () => {
        try {
          const isDemo = get().isDemoMode;
          if (isDemo) {
            // Demo mode: initialize with empty chat
            set({
              overviewChat: {
                messages: [],
                isLoading: false,
              },
            });
            return;
          }

          // Production mode: fetch from API
          const chat = await chatsService.getOverviewChat() as any;
          set({
            overviewChat: {
              messages: ((chat?.messages as any[]) || []).map((m: any) => ({
                id: m.id,
                role: m.role === 'user' ? 'user' : 'assistant',
                content: toMessageContent(m.content),
                timestamp: new Date(m.createdAt || m.timestamp),
                goalPreview: m.metadata?.goalPreview,
                awaitingConfirmation: m.metadata?.awaitingConfirmation,
                proposalType: m.metadata?.proposalType,
                commands: m.metadata?.commands,
              })),
              isLoading: false,
            },
          });
        } catch (error) {
          console.error('Failed to fetch overview chat:', error);
          // Initialize empty chat on error
          set({
            overviewChat: {
              messages: [],
              isLoading: false,
            },
          });
        }
      },

      sendOverviewMessage: async (content: string) => {
        const isDemo = get().isDemoMode;
        const streamId = `overview-${Date.now()}`;

        // Add user message
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        };

        set((state) => ({
          overviewChat: {
            ...state.overviewChat!,
            messages: [...(state.overviewChat?.messages || []), userMessage],
            isLoading: true,
          },
          activeStreams: new Set([...state.activeStreams, streamId]),
        }));

        // Create placeholder for assistant message
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };

        set((state) => ({
          overviewChat: {
            ...state.overviewChat!,
            messages: [...(state.overviewChat?.messages || []), assistantMessage],
          },
        }));

        try {
          if (isDemo) {
            // Demo mode: use mock service
            const response = await mockOverviewChatService.chat(content);
            set((state) => ({
              overviewChat: {
                ...state.overviewChat!,
                messages: state.overviewChat!.messages.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: response.content,
                        goalPreview: (response as any).goalPreview,
                        awaitingConfirmation: (response as any).awaitingConfirmation,
                        proposalType: (response as any).proposalType,
                        commands: response.commands,
                      }
                    : msg
                ),
                isLoading: false,
              },
              activeStreams: new Set([...state.activeStreams].filter(id => id !== streamId)),
            }));

            // Execute commands if present
            if (response.commands?.length > 0) {
              for (const cmd of response.commands) {
                if (cmd.type === 'CREATE_GOAL') {
                  const newGoal = {
                    ...cmd.data,
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    status: 'active',
                    createdAt: new Date(),
                  };
                  set((state) => ({
                    goals: [...state.goals, newGoal],
                  }));
                } else if (cmd.type === 'CREATE_SUBGOAL') {
                  await get().createSubgoal(cmd.data, cmd.data.parentGoalId || '');
                }
              }
            }
            return;
          }

          // Production mode: use streaming service
          let fullContent = '';
          let finalChunk: any = {};

          for await (const chunk of aiOverviewChatService.chatStream({ message: content })) {
            fullContent += chunk.content;

            if (chunk.done) {
              finalChunk = chunk;
            }

            set((state) => ({
              overviewChat: {
                ...state.overviewChat!,
                messages: state.overviewChat!.messages.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: fullContent,
                        ...(chunk.done && {
                          goalPreview: (chunk as any).goalPreview,
                          awaitingConfirmation: (chunk as any).awaitingConfirmation,
                          proposalType: (chunk as any).proposalType,
                          extraction: (chunk as any).extraction,
                        }),
                      }
                    : msg
                ),
                ...(chunk.done && { isLoading: false }),
              },
            }));
          }

          set((state) => ({
            activeStreams: new Set([...state.activeStreams].filter(id => id !== streamId)),
          }));

          // Handle commands from response
          if (finalChunk.awaitingConfirmation && finalChunk.commands?.length > 0) {
            set({
              pendingCommands: {
                chatId: 'overview',
                commands: finalChunk.commands,
                timestamp: Date.now(),
              },
            });
            // Track latest proposal
            get().setLatestProposal('overview', assistantMessageId);
            return;
          }

          // Execute non-awaiting commands
          const commands = finalChunk.commands || [];
          if (commands.length > 0) {
            for (const cmd of commands) {
              if (cmd.type === 'CREATE_SUBGOAL') {
                await get().createSubgoal(cmd.data, cmd.data.parentGoalId || '');
              }
            }
            await get().fetchGoals();
          }
        } catch (error) {
          console.error('Overview chat error:', error);
          set((state) => ({
            overviewChat: {
              ...state.overviewChat!,
              messages: state.overviewChat!.messages.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: 'Sorry, there was an error processing your message.' }
                  : msg
              ),
              isLoading: false,
            },
            activeStreams: new Set([...state.activeStreams].filter(id => id !== streamId)),
          }));
        }
      },

      stopOverviewStream: async () => {
        try {
          await aiOverviewChatService.stopStream();
          set((state) => ({
            overviewChat: state.overviewChat ? { ...state.overviewChat, isLoading: false } : null,
            activeStreams: new Set([...state.activeStreams].filter(id => !id.startsWith('overview'))),
          }));
        } catch (error) {
          console.error('Failed to stop overview stream:', error);
        }
      },

      // ========== Category Specialist Chat Actions ==========

      fetchCategoryChat: async (categoryId: 'items' | 'finances' | 'actions') => {
        try {
          const isDemo = get().isDemoMode;
          if (isDemo) {
            // Demo mode: initialize with empty chat
            set((state) => ({
              categoryChats: {
                ...state.categoryChats,
                [categoryId]: {
                  messages: [],
                  isLoading: false,
                },
              },
            }));
            return;
          }

          // Production mode: fetch from API
          const chat = await chatsService.getCategoryChat(categoryId) as any;
          set((state) => ({
            categoryChats: {
              ...state.categoryChats,
              [categoryId]: {
                messages: ((chat?.messages as any[]) || []).map((m: any) => ({
                  id: m.id,
                  role: m.role === 'user' ? 'user' : 'assistant',
                  content: toMessageContent(m.content),
                  timestamp: new Date(m.createdAt || m.timestamp),
                  goalPreview: m.metadata?.goalPreview,
                  awaitingConfirmation: m.metadata?.awaitingConfirmation,
                  proposalType: m.metadata?.proposalType,
                  commands: m.metadata?.commands,
                })),
                isLoading: false,
              },
            },
          }));
        } catch (error) {
          console.error(`Failed to fetch ${categoryId} chat:`, error);
          // Initialize empty chat on error
          set((state) => ({
            categoryChats: {
              ...state.categoryChats,
              [categoryId]: {
                messages: [],
                isLoading: false,
              },
            },
          }));
        }
      },

      // ========== Goal Chat Actions ==========

      fetchGoalChat: async (goalId: string) => {
        try {
          const isDemo = get().isDemoMode;
          console.log('[fetchGoalChat] Fetching chat for goal:', goalId, 'isDemo:', isDemo);

          if (isDemo) {
            // Demo mode: initialize with empty chat
            set((state) => ({
              goalChats: {
                ...state.goalChats,
                [goalId]: {
                  messages: [],
                  isLoading: false,
                },
              },
            }));
            return;
          }

          // Production mode: fetch from API
          const chat = await chatsService.getGoalChat(goalId) as any;
          console.log('[fetchGoalChat] Received chat data:', chat);

          const mappedMessages: Message[] = ((chat?.messages as any[]) || []).map((m: any): Message => ({
            id: m.id,
            role: m.role === 'user' ? 'user' : 'assistant',
            content: toMessageContent(m.content),
            timestamp: new Date(m.createdAt || m.timestamp),
            goalPreview: m.metadata?.goalPreview || m.goalPreview,
            awaitingConfirmation: m.metadata?.awaitingConfirmation ?? m.awaitingConfirmation,
            proposalType: m.metadata?.proposalType || m.proposalType,
            commands: m.metadata?.commands || m.commands,
          }));
          console.log('[fetchGoalChat] Mapped messages:', mappedMessages);

          set((state) => ({
            goalChats: {
              ...state.goalChats,
              [goalId]: {
                messages: mappedMessages,
                isLoading: false,
              },
            },
          }));
        } catch (error) {
          console.error(`[fetchGoalChat] Failed to fetch goal chat for ${goalId}:`, error);
          // Initialize empty chat on error
          set((state) => ({
            goalChats: {
              ...state.goalChats,
              [goalId]: {
                messages: [],
                isLoading: false,
              },
            },
          }));
        }
      },

      // ========== Category Specialist Chat Actions ==========

      sendCategoryMessage: async (categoryId: 'items' | 'finances' | 'actions', content: string) => {
        const isDemo = get().isDemoMode;
        const streamId = `${categoryId}-${Date.now()}`;

        // Add user message
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        };

        set((state) => ({
          categoryChats: {
            ...state.categoryChats,
            [categoryId]: {
              ...state.categoryChats[categoryId]!,
              messages: [...(state.categoryChats[categoryId]?.messages || []), userMessage],
              isLoading: true,
            },
          },
          activeStreams: new Set([...state.activeStreams, streamId]),
        }));

        // Create placeholder for assistant message
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };

        set((state) => ({
          categoryChats: {
            ...state.categoryChats,
            [categoryId]: {
              ...state.categoryChats[categoryId]!,
              messages: [...(state.categoryChats[categoryId]?.messages || []), assistantMessage],
            },
          },
        }));

        try {
          if (isDemo) {
            // Demo mode: use mock service
            const response = await mockOverviewChatService.chat(content);
            set((state) => ({
              categoryChats: {
                ...state.categoryChats,
                [categoryId]: {
                  ...state.categoryChats[categoryId]!,
                  messages: state.categoryChats[categoryId]!.messages.map(msg =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: response.content,
                          goalPreview: (response as any).goalPreview,
                          awaitingConfirmation: (response as any).awaitingConfirmation,
                          proposalType: (response as any).proposalType,
                          commands: response.commands,
                        }
                      : msg
                  ),
                  isLoading: false,
                },
              },
              activeStreams: new Set([...state.activeStreams].filter(id => id !== streamId)),
            }));
            return;
          }

          // Production mode: use streaming service
          let fullContent = '';
          let finalChunk: any = {};

          const stream = await aiSpecialistChatService.chatStream(categoryId, content);
          const reader = stream.getReader();
          const decoder = new TextDecoder();
          
          while (true) {
            const { done: readerDone, value } = await reader.read();
            if (readerDone) break;
            
            const text = decoder.decode(value, { stream: true });
            const sseLines = text.split('\n').filter(line => line.startsWith('data: '));
            
            for (const line of sseLines) {
              try {
                const chunk = JSON.parse(line.slice(6));
                fullContent += chunk.content || '';
                
                if (chunk.done) {
                  finalChunk = chunk;
                }

                set((state) => ({
                  categoryChats: {
                    ...state.categoryChats,
                    [categoryId]: {
                      ...state.categoryChats[categoryId]!,
                      messages: state.categoryChats[categoryId]!.messages.map(msg =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: fullContent }
                          : msg
                      ),
                      ...(chunk.done && { isLoading: false }),
                    },
                  },
                }));
              } catch (parseErr) {
                // Skip malformed SSE lines
              }
            }
          }

          // Final update with metadata from finalChunk
          if (finalChunk.done) {
            set((state) => ({
              categoryChats: {
                ...state.categoryChats,
                [categoryId]: {
                  ...state.categoryChats[categoryId]!,
                  messages: state.categoryChats[categoryId]!.messages.map(msg =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: fullContent,
                          goalPreview: (finalChunk as any).goalPreview,
                          awaitingConfirmation: (finalChunk as any).awaitingConfirmation,
                          proposalType: (finalChunk as any).proposalType,
                          commands: finalChunk.commands,
                        }
                      : msg
                  ),
                  isLoading: false,
                },
              },
            }));
          }

          set((state) => ({
            activeStreams: new Set([...state.activeStreams].filter(id => id !== streamId)),
          }));

          // Handle commands from response
          if (finalChunk.awaitingConfirmation && finalChunk.commands?.length > 0) {
            set({
              pendingCommands: {
                chatId: categoryId,
                commands: finalChunk.commands,
                timestamp: Date.now(),
              },
            });
            // Track latest proposal
            get().setLatestProposal(categoryId, assistantMessageId);
            return;
          }

          // Execute commands
          const commands = finalChunk.commands || [];
          if (commands.length > 0) {
            for (const cmd of commands) {
              await get().executeChatCommand(cmd);
            }
            await get().fetchGoals();
          }
        } catch (error) {
          console.error(`${categoryId} chat error:`, error);
          set((state) => ({
            categoryChats: {
              ...state.categoryChats,
              [categoryId]: {
                ...state.categoryChats[categoryId]!,
                messages: state.categoryChats[categoryId]!.messages.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: 'Sorry, there was an error processing your message.' }
                    : msg
                ),
                isLoading: false,
              },
            },
            activeStreams: new Set([...state.activeStreams].filter(id => id !== streamId)),
          }));
        }
      },

      stopCategoryStream: async (categoryId: 'items' | 'finances' | 'actions') => {
        try {
          await aiSpecialistChatService.stopStream(categoryId);
          set((state) => ({
            categoryChats: {
              ...state.categoryChats,
              [categoryId]: state.categoryChats[categoryId]
                ? { ...state.categoryChats[categoryId], isLoading: false }
                : null,
            },
            activeStreams: new Set([...state.activeStreams].filter(id => !id.startsWith(categoryId))),
          }));
        } catch (error) {
          console.error(`Failed to stop ${categoryId} stream:`, error);
        }
      },

      // ========== Stream Management Actions ==========

      setActiveStream: (streamId: string, active: boolean) => {
        set((state) => {
          const newStreams = new Set(state.activeStreams);
          if (active) {
            newStreams.add(streamId);
          } else {
            newStreams.delete(streamId);
          }
          return { activeStreams: newStreams };
        });
      },

      isStreamActive: (streamId: string) => {
        return get().activeStreams.has(streamId);
      },

      // ========== Message Editing Actions ==========

      editMessage: async (chatType: 'overview' | 'category' | 'goal', chatId: string, messageId: string, newContent: string) => {
        try {
          const isDemo = get().isDemoMode;
          if (!isDemo) {
            // Production mode: call the edit endpoint
            let targetChatId: string;
            if (chatType === 'overview') {
              targetChatId = 'overview';
            } else if (chatType === 'category') {
              targetChatId = chatId; // chatId is the category
            } else {
              targetChatId = chatId; // chatId is the goalId
            }

            await chatsService.editMessage(targetChatId, messageId, newContent);
          }

          // Remove all messages after the edited one
          if (chatType === 'overview') {
            set((state) => {
              if (!state.overviewChat) return state;
              const msgIndex = state.overviewChat.messages.findIndex(m => m.id === messageId);
              if (msgIndex === -1) return state;
              return {
                overviewChat: {
                  ...state.overviewChat,
                  messages: state.overviewChat.messages.slice(0, msgIndex + 1).map(msg =>
                    msg.id === messageId ? { ...msg, content: newContent } : msg
                  ),
                },
              };
            });
          } else if (chatType === 'category') {
            set((state) => {
              const chat = state.categoryChats[chatId as keyof typeof state.categoryChats];
              if (!chat) return state;
              const msgIndex = chat.messages.findIndex(m => m.id === messageId);
              if (msgIndex === -1) return state;
              return {
                categoryChats: {
                  ...state.categoryChats,
                  [chatId]: {
                    ...chat,
                    messages: chat.messages.slice(0, msgIndex + 1).map(msg =>
                      msg.id === messageId ? { ...msg, content: newContent } : msg
                    ),
                  },
                },
              };
            });
          } else if (chatType === 'goal') {
            set((state) => {
              const chat = state.goalChats[chatId];
              if (!chat) return state;
              const msgIndex = chat.messages.findIndex(m => m.id === messageId);
              if (msgIndex === -1) return state;
              return {
                goalChats: {
                  ...state.goalChats,
                  [chatId]: {
                    ...chat,
                    messages: chat.messages.slice(0, msgIndex + 1).map(msg =>
                      msg.id === messageId ? { ...msg, content: newContent } : msg
                    ),
                  },
                },
              };
            });
          }

          // Re-send the message to get new AI response
          // This will trigger the appropriate send message action
          if (chatType === 'overview') {
            await get().sendOverviewMessage(newContent);
          } else if (chatType === 'category') {
            await get().sendCategoryMessage(chatId as 'items' | 'finances' | 'actions', newContent);
          } else if (chatType === 'goal') {
            await get().sendGoalMessage(chatId, newContent);
          }
        } catch (error) {
          console.error('Failed to edit message:', error);
        }
      },

      // ========== Helper: Execute Chat Commands ==========
      executeChatCommand: async (command: ChatCommand) => {
        const { type, goalId, data } = command;

        switch (type) {
          case 'ADD_TASK':
            await get().addTask(goalId, data.title);
            break;
          case 'TOGGLE_TASK':
            await get().toggleTask(goalId, data.taskId);
            break;
          case 'UPDATE_TITLE':
            await get().updateGoal(goalId, { title: data.title });
            break;
          case 'UPDATE_SEARCHTERM':
            // Update searchTerm - backend will regenerate retailerFilters
            await get().updateGoal(goalId, { searchTerm: data.searchTerm } as any);
            break;
          case 'REFRESH_CANDIDATES':
            // Refresh candidates - queue scraping job (uses accept/decline proposal type)
            await goalsService.refreshCandidates(goalId);
            break;
          case 'ARCHIVE_GOAL':
            await get().archiveGoal(goalId);
            break;
        }
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
          // Only fetch goals if user is still set (fetchUser clears it on 401)
          if (get().user) {
            await get().fetchGoals();
          }
        } else {
          // No token — clear any stale persisted user
          if (get().user) {
            set({ user: null, goals: [] });
          }
        }
      },

      fetchUser: async () => {
        try {
          set({ isLoading: true, error: null });
          const user = await authService.getProfile();
          set({ user, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch user:', error);
          const msg = error?.message || '';
          const is401 = error?.response?.status === 401 || error?.status === 401 || msg.includes('Session expired');
          if (is401) {
            // Token expired — clear persisted user and redirect to login
            authService.logout();
            set({ user: null, goals: [], error: null, isLoading: false, isDemoMode: false });
          } else {
            set({ error: 'Failed to fetch user profile', isLoading: false });
          }
        }
      },

      fetchGoals: async () => {
        // Skip API call in demo mode
        if (get().isDemoMode) {
          return;
        }

        try {
          set({ isLoading: true, error: null });
          const category = get().activeCategory;
          const filters = category !== 'all' ? { type: category } : undefined;
          const goals = await goalsService.getAll(filters);
          set({ goals, isLoading: false, goalsVersion: get().goalsVersion + 1 });
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
