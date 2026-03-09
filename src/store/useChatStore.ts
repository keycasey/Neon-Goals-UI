import { create } from 'zustand';
import type { ChatState, Message, Goal } from '@/types/goals';
import type { ChatCommand, PendingCommandsState } from './types';
import { chatsService } from '@/services/chatsService';
import { aiGoalCreationService } from '@/services/aiGoalCreationService';
import { aiOverviewChatService } from '@/services/aiOverviewChatService';
import { aiGoalChatService } from '@/services/aiGoalChatService';
import { aiSpecialistChatService } from '@/services/aiSpecialistChatService';
import { goalsService } from '@/services/goalsService';
import { useGoalsStore } from './useGoalsStore';
import { useAuthStore } from './useAuthStore';

const normalizeChatState = (chat: any): ChatState => ({
  messages: Array.isArray(chat?.messages) ? chat.messages : [],
  isLoading: typeof chat?.isLoading === 'boolean' ? chat.isLoading : false,
});

const normalizeGoalChats = (goalChats: any): Record<string, ChatState> => {
  if (!goalChats || typeof goalChats !== 'object') return {};

  return Object.entries(goalChats).reduce((acc, [goalId, chat]) => {
    acc[goalId] = normalizeChatState(chat);
    return acc;
  }, {} as Record<string, ChatState>);
};

const normalizeCategoryChats = (categoryChats: any) => ({
  items: categoryChats?.items ? normalizeChatState(categoryChats.items) : null,
  finances: categoryChats?.finances ? normalizeChatState(categoryChats.finances) : null,
  actions: categoryChats?.actions ? normalizeChatState(categoryChats.actions) : null,
});

const normalizePendingCommands = (pending: any): PendingCommandsState | null => {
  if (!pending || typeof pending !== 'object') return null;

  const chatId = typeof pending.chatId === 'string' ? pending.chatId : '';
  if (!chatId) return null;

  return {
    chatId,
    commands: Array.isArray(pending.commands) ? pending.commands : [],
    timestamp: typeof pending.timestamp === 'number' ? pending.timestamp : Date.now(),
  };
};

const toMessageContent = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
};

const normalizeExtraction = (value: any) => {
  if (!value || typeof value !== 'object') return undefined;
  if (typeof value.groupId !== 'string' || !value.groupId) return undefined;

  return {
    groupId: value.groupId,
    urls: Array.isArray(value.urls) ? value.urls.filter((u: unknown): u is string => typeof u === 'string') : [],
    streamUrl: typeof value.streamUrl === 'string' ? value.streamUrl : '',
  };
};

type ChatStoreInitialState = {
  creationChat: ChatState;
  goalChats: Record<string, ChatState>;
  overviewChat: ChatState | null;
  categoryChats: {
    items: ChatState | null;
    finances: ChatState | null;
    actions: ChatState | null;
  };
  isCreatingGoal: boolean;
  pendingCommands: PendingCommandsState | null;
  handledProposals: Set<string>;
  latestProposalMessageIds: Record<string, string | null>;
  activeStreams: Set<string>;
  activeExtractionGroups: Set<string>;
};

const toStringSet = (value: unknown): Set<string> => {
  if (value instanceof Set) {
    return new Set(Array.from(value).filter((item): item is string => typeof item === 'string'));
  }

  if (Array.isArray(value)) {
    return new Set(value.filter((item): item is string => typeof item === 'string'));
  }

  return new Set<string>();
};

// Read initial state from useAppStore's localStorage
// This keeps the slice in sync with the main store during the migration
const getInitialState = (): ChatStoreInitialState => {
  try {
    const stored = localStorage.getItem('goals-af-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        creationChat: parsed?.state?.creationChat
          ? normalizeChatState(parsed.state.creationChat)
          : {
            messages: [{
              id: '1',
              role: 'assistant',
              content: "What would you like to work on today? I can help you with:\n\n- **Items** - Products you want to purchase\n- **Finances** - Money goals and tracking\n- **Actions** - Skills to learn or habits to build",
              timestamp: new Date(),
            }],
            isLoading: false,
          },
        goalChats: normalizeGoalChats(parsed?.state?.goalChats),
        overviewChat: parsed?.state?.overviewChat ? normalizeChatState(parsed.state.overviewChat) : null,
        categoryChats: normalizeCategoryChats(parsed?.state?.categoryChats),
        isCreatingGoal: parsed?.state?.isCreatingGoal ?? false,
        pendingCommands: null,
        handledProposals: new Set<string>(),
        latestProposalMessageIds: {},
        activeStreams: toStringSet(parsed?.state?.activeStreams),
        activeExtractionGroups: new Set<string>(),
      };
    }
  } catch (e) {
    console.error('Failed to parse stored chat state:', e);
  }
  return {
    creationChat: {
      messages: [{
        id: '1',
        role: 'assistant',
        content: "What would you like to work on today? I can help you with:\n\n- **Items** - Products you want to purchase\n- **Finances** - Money goals and tracking\n- **Actions** - Skills to learn or habits to build",
        timestamp: new Date(),
      }],
      isLoading: false,
    },
    goalChats: {},
    overviewChat: null,
    categoryChats: {
      items: null,
      finances: null,
      actions: null,
    },
    isCreatingGoal: false,
    pendingCommands: null,
    handledProposals: new Set<string>(),
    latestProposalMessageIds: {},
    activeStreams: new Set<string>(),
    activeExtractionGroups: new Set<string>(),
  };
};

// Helper to get isDemoMode from useAuthStore

// Helper to get goals from useGoalsStore
const getGoals = (): Goal[] => useGoalsStore.getState().goals;

// Access goals store actions directly
const goalsStoreActions = () => useGoalsStore.getState();

interface ChatStoreState {
  // Chat state
  creationChat: ChatState;
  goalChats: Record<string, ChatState>;
  overviewChat: ChatState | null;
  categoryChats: {
    items: ChatState | null;
    finances: ChatState | null;
    actions: ChatState | null;
  };
  isCreatingGoal: boolean;
  pendingCommands: PendingCommandsState | null;
  handledProposals: Set<string>;
  latestProposalMessageIds: Record<string, string | null>;
  activeStreams: Set<string>;
  activeExtractionGroups: Set<string>;

  // Chat CRUD actions
  sendCreationMessage: (content: string) => Promise<void>;
  sendGoalMessage: (goalId: string, content: string) => Promise<void>;
  sendOverviewMessage: (content: string) => Promise<void>;
  sendCategoryMessage: (categoryId: 'items' | 'finances' | 'actions', content: string) => Promise<void>;

  // Fetch actions
  fetchCreationChat: () => Promise<void>;
  fetchGoalChat: (goalId: string) => Promise<void>;
  fetchOverviewChat: () => Promise<void>;
  fetchCategoryChat: (categoryId: 'items' | 'finances' | 'actions') => Promise<void>;

  // Streaming actions
  startOverviewStream: (content: string) => Promise<void>;
  stopOverviewStream: () => Promise<void>;
  startCategoryStream: (categoryId: 'items' | 'finances' | 'actions', content: string) => Promise<void>;
  stopCategoryStream: (categoryId: 'items' | 'finances' | 'actions') => Promise<void>;
  startGoalStream: (goalId: string, content: string) => Promise<void>;
  stopGoalStream: (goalId: string) => Promise<void>;

  // Pending commands actions
  confirmPendingCommands: () => Promise<void>;
  cancelPendingCommands: (reason?: string) => Promise<void>;

  // Proposal actions
  setLatestProposal: (chatId: string, messageId: string) => void;
  markProposalHandled: (messageId: string) => void;
  isProposalHandled: (messageId: string) => boolean;
  isLatestProposal: (chatId: string, messageId: string) => boolean;

  // Stream management actions
  setActiveStream: (streamId: string, active: boolean) => void;
  isStreamActive: (streamId: string) => boolean;
  setExtractionActive: (groupId: string, active: boolean) => void;
  isExtractionActive: (groupId: string) => boolean;

  // Goal creation actions
  startGoalCreation: () => void;
  stopGoalCreation: () => Promise<void>;
  confirmGoalCreation: () => Promise<void>;

  // Message editing
  editMessage: (chatType: 'overview' | 'category' | 'goal', chatId: string, messageId: string, newContent: string) => Promise<void>;

  // Command execution helper
  executeChatCommand: (command: ChatCommand) => Promise<void>;

  // Utility
  addAssistantMessage: (mode: 'creation' | 'goal', goalId: string | undefined, content: string) => void;
}

export const useChatStore = create<ChatStoreState>()((set, get) => ({
  // Initial state from localStorage (synced with useAppStore)
  ...getInitialState(),

  // ========== Creation Chat Actions ==========

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

          // Add goal via app store action
          goalsStoreActions().addGoal(response.goal);
          await goalsStoreActions().fetchGoals();
        }
      } else {
        // Regular chat mode with streaming
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
          let finalChunk: any = {};

          const streamResult = aiOverviewChatService.chatStream({ message: content });
          await (async () => {
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
          })();

          // If message has goalPreview awaiting confirmation, store commands and wait for user
          if (finalChunk.awaitingConfirmation && finalChunk.goalPreview) {
            set({
              pendingCommands: {
                chatId: 'creation',
                commands: finalChunk.commands || [],
                timestamp: Date.now(),
              },
            });
            get().setLatestProposal('creation', assistantMessageId);
            return;
          }

          // Execute commands from the response
          const commands = finalChunk.commands || [];
          if (commands.length > 0) {
            for (const cmd of commands) {
              if (cmd.type === 'CREATE_SUBGOAL') {
                await goalsStoreActions().createSubgoal(cmd.data, cmd.data.parentGoalId || '');
              }
            }
            await goalsStoreActions().fetchGoals();
          }
        } catch (streamError) {
          console.error('Streaming failed, falling back to non-streaming chat:', streamError);
          // Fallback to non-streaming overview chat
          const chatResponse = await aiOverviewChatService.chat({ message: content });

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

          if (chatResponse.commands && chatResponse.commands.length > 0) {
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

  // ========== Goal Chat Actions ==========

  sendGoalMessage: async (goalId, content) => {
    const goals = getGoals();
    const goal = goals.find(g => g.id === goalId);
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
      const response = await aiGoalChatService.chat(goalId, { message: content });

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

      // Store pending commands for user confirmation
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

  // ========== Overview Chat Actions ==========

  fetchOverviewChat: async () => {
    try {
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
            extraction: normalizeExtraction(m.metadata?.extraction),
          })),
          isLoading: false,
        },
      });
    } catch (error) {
      console.error('Failed to fetch overview chat:', error);
      set({
        overviewChat: {
          messages: [],
          isLoading: false,
        },
      });
    }
  },

  sendOverviewMessage: async (content: string) => {
    const streamId = `overview-${Date.now()}`;

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
      const overviewExtractionGroupId = (finalChunk as any)?.extraction?.groupId;
      if (typeof overviewExtractionGroupId === 'string' && overviewExtractionGroupId) {
        get().setExtractionActive(overviewExtractionGroupId, true);
      }

      if (finalChunk.awaitingConfirmation && finalChunk.commands?.length > 0) {
        set({
          pendingCommands: {
            chatId: 'overview',
            commands: finalChunk.commands,
            timestamp: Date.now(),
          },
        });
        get().setLatestProposal('overview', assistantMessageId);
        return;
      }

      // Execute non-awaiting commands
      const commands = finalChunk.commands || [];
      if (commands.length > 0) {
        for (const cmd of commands) {
          if (cmd.type === 'CREATE_SUBGOAL') {
            await goalsStoreActions().createSubgoal(cmd.data, cmd.data.parentGoalId || '');
          }
        }
        await goalsStoreActions().fetchGoals();
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

  startOverviewStream: async (content: string) => {
    await get().sendOverviewMessage(content);
  },

  // ========== Category Chat Actions ==========

  fetchCategoryChat: async (categoryId: 'items' | 'finances' | 'actions') => {
    try {
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
              extraction: normalizeExtraction(m.metadata?.extraction),
            })),
            isLoading: false,
          },
        },
      }));
    } catch (error) {
      console.error(`Failed to fetch ${categoryId} chat:`, error);
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

  sendCategoryMessage: async (categoryId: 'items' | 'finances' | 'actions', content: string) => {
    const streamId = `${categoryId}-${Date.now()}`;

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
                      extraction: (finalChunk as any).extraction,
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
      const categoryExtractionGroupId = (finalChunk as any)?.extraction?.groupId;
      if (typeof categoryExtractionGroupId === 'string' && categoryExtractionGroupId) {
        get().setExtractionActive(categoryExtractionGroupId, true);
      }

      if (finalChunk.awaitingConfirmation && finalChunk.commands?.length > 0) {
        set({
          pendingCommands: {
            chatId: categoryId,
            commands: finalChunk.commands,
            timestamp: Date.now(),
          },
        });
        get().setLatestProposal(categoryId, assistantMessageId);
        return;
      }

      // Execute commands
      const commands = finalChunk.commands || [];
      if (commands.length > 0) {
        for (const cmd of commands) {
          await get().executeChatCommand(cmd);
        }
        await goalsStoreActions().fetchGoals();
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

  startCategoryStream: async (categoryId: 'items' | 'finances' | 'actions', content: string) => {
    await get().sendCategoryMessage(categoryId, content);
  },

  // ========== Goal Chat Fetch ==========

  fetchGoalChat: async (goalId: string) => {
    try {
      const chat = await chatsService.getGoalChat(goalId) as any;

      const mappedMessages: Message[] = ((chat?.messages as any[]) || []).map((m: any): Message => ({
        id: m.id,
        role: m.role === 'user' ? 'user' : 'assistant',
        content: toMessageContent(m.content),
        timestamp: new Date(m.createdAt || m.timestamp),
        goalPreview: m.metadata?.goalPreview || m.goalPreview,
        awaitingConfirmation: m.metadata?.awaitingConfirmation ?? m.awaitingConfirmation,
        proposalType: m.metadata?.proposalType || m.proposalType,
        commands: m.metadata?.commands || m.commands,
        extraction: normalizeExtraction(m.metadata?.extraction),
      }));

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
      console.error(`Failed to fetch goal chat for ${goalId}:`, error);
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

  startGoalStream: async (goalId: string, content: string) => {
    await get().sendGoalMessage(goalId, content);
  },

  stopGoalStream: async (goalId: string) => {
    try {
      await aiGoalChatService.stopStream(goalId);
      set((state) => ({
        goalChats: {
          ...state.goalChats,
          [goalId]: state.goalChats[goalId]
            ? { ...state.goalChats[goalId], isLoading: false }
            : { messages: [], isLoading: false },
        },
        activeStreams: new Set([...state.activeStreams].filter(id => !id.startsWith(`goal-${goalId}`))),
      }));
    } catch (error) {
      console.error(`Failed to stop goal stream for ${goalId}:`, error);
    }
  },

  // ========== Creation Chat Fetch ==========

  fetchCreationChat: async () => {
    // Creation chat is always initialized with the default greeting
    // No need to fetch from API
  },

  // ========== Pending Commands Actions ==========

  confirmPendingCommands: async () => {
    const pending = get().pendingCommands;
    if (!pending || !pending.commands || pending.commands.length === 0) {
      console.error('No pending commands to confirm');
      return;
    }

    const { chatId, commands } = pending;

    try {
      if (chatId === 'overview' || chatId === 'creation') {
        await aiOverviewChatService.confirmCommands(commands as any);
      } else if (chatId?.startsWith('goal-')) {
        const goalId = chatId.replace('goal-', '');
        await aiGoalChatService.confirmCommands(goalId, commands);
      } else if (chatId === 'items' || chatId === 'finances' || chatId === 'actions') {
        await aiSpecialistChatService.confirmCommands(chatId, commands);
      }

      set({ pendingCommands: null });

      // Refresh goals to show changes
      await goalsStoreActions().fetchGoals();

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

  cancelPendingCommands: async (reason = 'Changed my mind') => {
    const pending = get().pendingCommands;
    if (!pending) {
      console.error('No pending commands to cancel');
      return;
    }

    const { chatId } = pending;

    try {
      if (chatId === 'overview' || chatId === 'creation') {
        await aiOverviewChatService.cancelCommands(reason);
      } else if (chatId === 'items' || chatId === 'finances' || chatId === 'actions') {
        await aiSpecialistChatService.cancelCommands(chatId, reason);
      }

      set({ pendingCommands: null });

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
      set({ pendingCommands: null });
    }
  },

  // ========== Proposal Actions ==========

  setLatestProposal: (chatId: string, messageId: string) => {
    set((state) => ({
      latestProposalMessageIds: {
        ...state.latestProposalMessageIds,
        [chatId]: messageId,
      },
    }));
  },

  markProposalHandled: (messageId: string) => {
    set((state) => ({
      handledProposals: new Set([...state.handledProposals, messageId]),
    }));
  },

  isProposalHandled: (messageId: string) => {
    return get().handledProposals.has(messageId);
  },

  isLatestProposal: (chatId: string, messageId: string) => {
    return get().latestProposalMessageIds[chatId] === messageId;
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

  setExtractionActive: (groupId: string, active: boolean) => {
    if (!groupId) return;
    set((state) => {
      const next = new Set(state.activeExtractionGroups);
      if (active) {
        next.add(groupId);
      } else {
        next.delete(groupId);
      }
      return { activeExtractionGroups: next };
    });
  },

  isExtractionActive: (groupId: string) => {
    if (!groupId) return false;
    return get().activeExtractionGroups.has(groupId);
  },

  // ========== Goal Creation Actions ==========

  startGoalCreation: () => {
    const currentMessages = get().creationChat.messages;

    set({ isCreatingGoal: true });

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
    await aiGoalCreationService.cancelSession();
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

      if (response.goalCreated && response.goal) {
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

        set({
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
        });

        goalsStoreActions().addGoal(transformedGoal);
        await goalsStoreActions().fetchGoals();
      }
    } catch (error) {
      console.error('Failed to confirm goal:', error);
    }
  },

  // ========== Message Editing ==========

  editMessage: async (chatType: 'overview' | 'category' | 'goal', chatId: string, messageId: string, newContent: string) => {
    try {
      const targetChatId = chatType === 'overview' ? 'overview' : chatId;
      await chatsService.editMessage(targetChatId, messageId, newContent);

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

  // ========== Command Execution Helper ==========

  executeChatCommand: async (command: ChatCommand) => {
    const { type, goalId, data } = command;

    switch (type) {
      case 'ADD_TASK':
        // TODO: implement via goalsStoreActions()
        console.log('ADD_TASK command - requires goals store integration');
        break;
      case 'TOGGLE_TASK':
        console.log('TOGGLE_TASK command - requires goals store integration');
        break;
      case 'UPDATE_TITLE':
        if (goalId) {
          await goalsService.update(goalId, { title: data.title });
        }
        break;
      case 'UPDATE_SEARCHTERM':
        if (goalId) {
          await goalsService.update(goalId, { searchTerm: data.searchTerm } as any);
        }
        break;
      case 'REFRESH_CANDIDATES':
        if (goalId) {
          await goalsService.refreshCandidates(goalId);
        }
        break;
      case 'ARCHIVE_GOAL':
        if (goalId) {
          await goalsService.archive(goalId);
        }
        break;
    }
  },

  // ========== Utility ==========

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
}));

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
