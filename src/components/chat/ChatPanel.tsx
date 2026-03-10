import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, Minimize2, Maximize2, Check, XCircle, CheckCircle, Edit3, Zap } from 'lucide-react';
import { MessageActions } from '@/components/chat/MessageActions';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/useChatStore';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useViewStore } from '@/store/useViewStore';
import { useBillingStore } from '@/store/useBillingStore';
import { isMessageLimitReached, getUsagePercent } from '@/types/billing';
import type { Message, ProposalType, GoalCategory } from '@/types/goals';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatExtractionResultsForAI } from '@/hooks/useExtraction';
import { ExtractionMessageCard } from '@/components/extraction/ExtractionMessageCard';
import type { ExtractionResult } from '@/services/extractionService';
import { parseRedirectCommand, stripRedirectCommand } from '@/lib/redirectParser';
import { RedirectCard } from '@/components/chat/RedirectCard';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const toSafeText = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));
const normalizeExtraction = (value: any) => {
  if (!value || typeof value !== 'object') return undefined;
  if (typeof value.groupId !== 'string' || !value.groupId) return undefined;

  return {
    groupId: value.groupId,
    urls: Array.isArray(value.urls) ? value.urls.filter((u: unknown): u is string => typeof u === 'string') : [],
    streamUrl: typeof value.streamUrl === 'string' ? value.streamUrl : '',
  };
};

interface ChatPanelProps {
  mode: 'creation' | 'goal';
  goalId?: string;
  activeCategory?: GoalCategory;
  onClose?: () => void;
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  previousMode?: 'creation' | 'goal';
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  mode,
  goalId,
  activeCategory = 'all',
  onClose,
  className,
  isMinimized: externalIsMinimized,
  onToggleMinimize: externalOnToggleMinimize,
  previousMode,
}) => {
  const [input, setInput] = useState('');
  const [isExitingGoal, setIsExitingGoal] = useState(false);
  const [glowPulse, setGlowPulse] = useState(false);
  const [previousPersona, setPreviousPersona] = useState<{ name: string; emoji: string } | null>(null);
  const hasMounted = React.useRef(false);
  const navigate = useNavigate();
  const setActiveCategory = useViewStore((state) => state.setActiveCategory);

  const isMinimized = externalIsMinimized || false;

  const toggleMinimize = () => {
    externalOnToggleMinimize?.();
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle edit - add an AI message asking what to change and focus the input
  const handleEdit = (messageId?: string) => {
    const editMessage = "What would you like to change?";
    // Mark this proposal as handled so buttons are disabled
    if (messageId) {
      markProposalHandled(messageId);
    }
    // Add assistant message directly without triggering API
    addAssistantMessage(mode, goalId, editMessage);
    inputRef.current?.focus();
  };

  // Handle cancel - call the cancel endpoint
  const handleCancel = (messageId?: string) => {
    // Mark this proposal as handled so buttons are disabled
    if (messageId) {
      markProposalHandled(messageId);
    }
    cancelPendingCommands();
  };

  // Handle confirm - execute the pending commands
  const handleConfirm = (messageId?: string) => {
    // Mark this proposal as handled so buttons are disabled
    if (messageId) {
      markProposalHandled(messageId);
    }
    if (mode === 'goal' || mode === 'creation') {
      confirmPendingCommands();
    } else {
      confirmGoalCreation();
    }
  };

  // Handle accept - for accept/decline proposals
  const handleAccept = (messageId?: string) => {
    if (messageId) {
      markProposalHandled(messageId);
    }
    // For now, accept works the same as confirm - executes pending commands
    confirmPendingCommands();
  };

  // Handle decline - for accept/decline proposals
  const handleDecline = (messageId?: string) => {
    if (messageId) {
      markProposalHandled(messageId);
    }
    // Decline works like cancel - rejects the proposal
    cancelPendingCommands('Declined');
  };

  // Handle redirect navigation from agent redirect commands
  const handleRedirectGo = useCallback((redirect: ReturnType<typeof parseRedirectCommand>) => {
    if (!redirect) return;
    const { target, label } = redirect;

    if (target.type === 'category') {
      setActiveCategory(target.categoryId);
      toast.success(`Switched to ${label}`, {
        description: 'Click to go back',
        action: {
          label: 'Go back',
          onClick: () => setActiveCategory(activeCategory),
        },
        duration: 5000,
      });
    } else if (target.type === 'goal') {
      navigate(`/goals/${target.goalId}`);
      toast.success(`Switched to ${label}`, {
        action: {
          label: 'Go back',
          onClick: () => navigate('/'),
        },
        duration: 5000,
      });
    } else if (target.type === 'overview') {
      setActiveCategory('all');
      toast.success('Switched to Overview', {
        action: {
          label: 'Go back',
          onClick: () => setActiveCategory(activeCategory),
        },
        duration: 5000,
      });
    }
  }, [navigate, setActiveCategory, activeCategory]);

  const {
    creationChat,
    goalChats,
    overviewChat,
    categoryChats,
    sendCreationMessage,
    sendGoalMessage,
    sendOverviewMessage,
    sendCategoryMessage,
    confirmGoalCreation,
    startGoalCreation,
    stopGoalCreation,
    isCreatingGoal,
    cancelPendingCommands,
    confirmPendingCommands,
    pendingCommands,
    addAssistantMessage,
    markProposalHandled,
    isLatestProposal,
    isExtractionActive,
    setExtractionActive,
    fetchOverviewChat,
    fetchCategoryChat,
    fetchGoalChat,
  } = useChatStore();
  const goals = useGoalsStore((state) => state.goals);
  const chatPulseTrigger = useViewStore((state) => state.chatPulseTrigger);

  // Compute chat ID for latest proposal tracking
  const chatId = useMemo(() => {
    if (mode === 'goal') return `goal-${goalId}`;
    if (activeCategory === 'all') return 'overview';
    if (activeCategory === 'items' || activeCategory === 'finances' || activeCategory === 'actions') return activeCategory;
    return 'creation';
  }, [mode, goalId, activeCategory]);

  // For creation mode, use overviewChat (all) or categoryChats (items/finances/actions)
  // For goal mode, use goalChats
  const chat = useMemo(() => {
    const normalizeChat = (chatState: any) => ({
      messages: Array.isArray(chatState?.messages) ? chatState.messages : [],
      isLoading: Boolean(chatState?.isLoading),
    });

    if (mode === 'goal') {
      const goalChat = normalizeChat(goalChats[goalId || '']);
      console.log('[ChatPanel] goal chat for', goalId, ':', goalChat);
      return goalChat;
    }
    // Creation mode - use specialist chats
    if (activeCategory === 'all') {
      return normalizeChat(overviewChat);
    }
    if (activeCategory === 'items') {
      return normalizeChat(categoryChats.items);
    }
    if (activeCategory === 'finances') {
      return normalizeChat(categoryChats.finances);
    }
    if (activeCategory === 'actions') {
      return normalizeChat(categoryChats.actions);
    }
    return normalizeChat(creationChat);
  }, [mode, goalId, activeCategory, goalChats, overviewChat, categoryChats, creationChat]);

  // Track which extraction groups we've already sent follow-ups for (survives re-renders)
  const followupsSent = useRef<Set<string>>(new Set());

  const handleExtractionComplete = useCallback((groupId: string, results: ExtractionResult[]) => {
    if (followupsSent.current.has(groupId)) return;
    followupsSent.current.add(groupId);
    setExtractionActive(groupId, false);

    const followUpMessage = formatExtractionResultsForAI(results);
    setTimeout(() => {
      if (mode === 'goal' && goalId) {
        sendGoalMessage(goalId, followUpMessage);
      } else if (activeCategory === 'all') {
        sendOverviewMessage(followUpMessage);
      } else if (activeCategory === 'items' || activeCategory === 'finances' || activeCategory === 'actions') {
        sendCategoryMessage(activeCategory, followUpMessage);
      }
    }, 500);
  }, [mode, goalId, activeCategory, sendGoalMessage, sendOverviewMessage, sendCategoryMessage, setExtractionActive]);
  const goal = goalId ? goals.find(g => g.id === goalId) : null;

  // Memoize persona to prevent infinite re-renders
  const persona = useMemo(() => {
    if (mode === 'creation') {
      // Use specialist personas based on active category
      switch (activeCategory) {
        case 'items': return { name: 'Product Expert', emoji: '🔍' };
        case 'finances': return { name: 'Wealth Advisor', emoji: '💰' };
        case 'actions': return { name: 'Personal Coach', emoji: '💪' };
        default: return { name: 'Goals Assistant', emoji: '🌴' };
      }
    }
    if (!goal) return { name: 'Assistant', emoji: '✨' };

    switch (goal.type) {
      case 'item': return { name: 'Product Expert', emoji: '🔍' };
      case 'finance': return { name: 'Wealth Advisor', emoji: '💰' };
      case 'action': return { name: 'Personal Coach', emoji: '💪' };
      default: return { name: 'Assistant', emoji: '✨' };
    }
  }, [mode, goal?.type, activeCategory]);

  // Track persona changes for avatar animation
  useEffect(() => {
    if (previousPersona && (previousPersona.name !== persona.name || previousPersona.emoji !== persona.emoji)) {
      // Persona changed - animation will be handled via key prop
    }
    setPreviousPersona(persona);
  }, [persona.name, persona.emoji]); // Use stable primitive values as deps

  // Trigger glow pulse on mount in creation mode
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      if (mode === 'creation') {
        // Trigger input glow when returning to creation view
        setGlowPulse(true);
        const timer = setTimeout(() => setGlowPulse(false), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [mode]);

  // Handle mode transitions
  useEffect(() => {
    if (previousMode === 'goal' && mode === 'creation') {
      // Leaving goal view, returning to creation
      setIsExitingGoal(false);
      setGlowPulse(true);
      // Remove glow pulse after animation
      const timer = setTimeout(() => setGlowPulse(false), 1000);
      return () => clearTimeout(timer);
    } else if (previousMode === 'creation' && mode === 'goal') {
      // Entering goal view
      setIsExitingGoal(false);
    }
  }, [mode, previousMode]);

  // Trigger glow pulse when chatPulseTrigger changes
  useEffect(() => {
    if (chatPulseTrigger > 0) {
      setGlowPulse(true);
      const timer = setTimeout(() => setGlowPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [chatPulseTrigger]);

  // Fetch chat history on mount and when mode/category/goalId changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (mode === 'goal' && goalId) {
        // Fetch goal chat history
        console.log('[ChatPanel] Fetching goal chat for:', goalId);
        await fetchGoalChat(goalId);
      } else if (mode === 'creation') {
        // Fetch specialist chat history based on active category
        if (activeCategory === 'all') {
          await fetchOverviewChat();
        } else if (activeCategory === 'items' || activeCategory === 'finances' || activeCategory === 'actions') {
          await fetchCategoryChat(activeCategory);
        }
      }
    };

    fetchChatHistory();
  }, [mode, goalId, activeCategory, fetchGoalChat, fetchOverviewChat, fetchCategoryChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  // Scroll to bottom on initial mount (when chat is first loaded)
  useEffect(() => {
    if (chat.messages.length > 0) {
      // Use immediate scroll on initial load, smooth for updates
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, []); // Only run once on mount

  const { usage, openUpgrade } = useBillingStore();
  const usagePercent = getUsagePercent(usage);
  const limitReached = isMessageLimitReached(usage);
  const isNearLimit = usagePercent >= 70 && !limitReached;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chat.isLoading) return;

    // Entitlement gate: block if message limit reached
    if (limitReached) {
      openUpgrade('chat_limit_reached');
      return;
    }

    if (mode === 'goal' && goalId) {
      sendGoalMessage(goalId, input.trim());
    } else if (mode === 'creation') {
      // Use specialist chat functions for creation mode
      if (activeCategory === 'all') {
        sendOverviewMessage(input.trim());
      } else if (activeCategory === 'items' || activeCategory === 'finances' || activeCategory === 'actions') {
        sendCategoryMessage(activeCategory, input.trim());
      } else {
        sendCreationMessage(input.trim());
      }
    }

    setInput('');
  };

  const avatarVariants = {
    initial: { scale: 0.8, rotateY: 90 },
    animate: { scale: 1, rotateY: 0 },
    exit: { scale: 0.8, rotateY: -90 },
  };

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      className={cn(
        "chat-sidebar",
        "flex flex-col glass-card border border-border/50",
        mode === 'goal' && isMinimized && "fixed bottom-6 right-6 z-50 shadow-2xl",
        isMinimized && "minimized",
        mode === 'goal' && !isMinimized && "w-full h-full",
        mode === 'creation' && (isMinimized ? "h-16" : "h-full"),
        className
      )}
    >
      {/* Header */}
      <div className="chat-header flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="chat-content flex items-center gap-3 transition-opacity duration-300">
          <motion.div
            key={persona.emoji}
            variants={avatarVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-10 h-10 rounded-full bg-gradient-neon flex items-center justify-center text-lg"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {persona.emoji}
          </motion.div>
          <motion.div
            key={persona.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="font-heading font-semibold text-foreground">
              {persona.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {mode === 'creation' ? 'Ready to help you set goals' : `Helping with: ${goal?.title}`}
            </p>
          </motion.div>
        </div>
        <div className="flex items-center gap-1">
          {mode === 'creation' && isCreatingGoal && (
            <button
              onClick={stopGoalCreation}
              className="px-3 py-1.5 rounded-lg bg-muted text-foreground font-medium text-xs transition-all hover:bg-muted/70"
            >
              Cancel
            </button>
          )}
          <button
            onClick={toggleMinimize}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence mode="wait" initial={false}>
        {!isMinimized && (
          <motion.div
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={previousMode === 'goal' ? {
              opacity: 0,
              y: 50,
              transition: { duration: 0.4, ease: "easeInOut" }
            } : {
              opacity: 0,
              transition: { duration: 0.2 }
            }}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 scrollbar-neon min-h-0"
          >
            <AnimatePresence mode="popLayout">
              {chat.messages
                .filter((m): m is Message => Boolean(m))
                .map((m) => ({
                  ...m,
                  content: toSafeText(m.content),
                  goalPreview: toSafeText(m.goalPreview),
                  extraction: normalizeExtraction(m.extraction),
                }))
                .filter((m) => m.content.trim() !== '')
                .map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  messageId={message.id}
                  onConfirm={message.awaitingConfirmation && message.proposalType === 'confirm_edit_cancel' ? () => handleConfirm(message.id) : undefined}
                  onEdit={message.awaitingConfirmation && message.proposalType === 'confirm_edit_cancel' ? () => handleEdit(message.id) : undefined}
                  onCancel={message.awaitingConfirmation && message.proposalType === 'confirm_edit_cancel' ? () => handleCancel(message.id) : undefined}
                  onAccept={message.awaitingConfirmation && message.proposalType === 'accept_decline' ? () => handleAccept(message.id) : undefined}
                  onDecline={message.awaitingConfirmation && message.proposalType === 'accept_decline' ? () => handleDecline(message.id) : undefined}
                  isExiting={isExitingGoal}
                  isLatestProposal={message.awaitingConfirmation ? isLatestProposal(chatId, message.id) : true}
                  enableLiveExtraction={Boolean(message.extraction?.groupId)}
                  onExtractionComplete={handleExtractionComplete}
                  onRedirectGo={handleRedirectGo}
                />
              ))}
            </AnimatePresence>

            {chat.isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                {/* Avatar */}
                <motion.div
                  key={`${persona.emoji}-${persona.name}`}
                  variants={avatarVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-neon flex items-center justify-center text-lg neon-glow-cyan"
                >
                  {persona.emoji}
                </motion.div>

                {/* Message bubble with thinking indicator */}
                <div className="flex-1 max-w-[80%]">
                  <div className="text-xs text-muted-foreground mb-1 px-1">{persona.name}</div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      {!isMinimized && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-border/50">
          {/* Usage chip */}
          {usage && (isNearLimit || limitReached) && (
            <div className={cn(
              "flex items-center justify-between px-3 py-1.5 rounded-lg text-xs mb-2",
              limitReached ? "bg-destructive/15 text-destructive border border-destructive/30" : "bg-warning/10 text-warning border border-warning/20"
            )}>
              <span>
                {limitReached
                  ? `Message limit reached (${usage.messagesUsed}/${usage.monthlyMessageLimit})`
                  : `${usage.messagesUsed}/${usage.monthlyMessageLimit} messages used`}
              </span>
              <button type="button" onClick={() => openUpgrade('chat_limit_reached')} className="flex items-center gap-1 font-semibold hover:opacity-80">
                <Zap className="w-3 h-3" /> Upgrade
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <motion.div
              animate={glowPulse ? {
                boxShadow: [
                  '0 0 0 0 rgba(139, 92, 246, 0)',
                  '0 0 0 8px rgba(139, 92, 246, 0)',
                  '0 0 0 16px rgba(139, 92, 246, 0)',
                  '0 0 0 0 rgba(139, 92, 246, 0)',
                ],
                borderColor: [
                  'hsl(var(--border))',
                  'hsl(var(--primary))',
                  'hsl(var(--border))',
                ],
              } : {}}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all"
            >
              <Sparkles className="w-4 h-4 text-primary/60" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={limitReached ? "Upgrade to keep chatting..." : "Ask me anything..."}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                disabled={chat.isLoading}
              />
            </motion.div>
            <button
              type="submit"
              disabled={!input.trim() || chat.isLoading || limitReached}
              className={cn(
                "p-3 rounded-xl transition-all",
                input.trim() && !chat.isLoading && !limitReached
                  ? "bg-gradient-neon text-primary-foreground neon-glow-cyan hover:scale-105"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
};

const MessageBubble = React.forwardRef<
  HTMLDivElement,
  {
    message: Message;
    messageId?: string;
    onConfirm?: () => void;
    onEdit?: () => void;
    onCancel?: () => void;
    onAccept?: () => void;
    onDecline?: () => void;
    isExiting?: boolean;
    isLatestProposal?: boolean;
    enableLiveExtraction?: boolean;
    onExtractionComplete?: (groupId: string, results: ExtractionResult[]) => void;
    onRedirectGo?: (redirect: ReturnType<typeof parseRedirectCommand>) => void;
  }
>(({ message, messageId, onConfirm, onEdit, onCancel, onAccept, onDecline, isExiting, isLatestProposal = true, enableLiveExtraction = false, onExtractionComplete, onRedirectGo }, ref) => {
  const isUser = message.role === 'user';
  const hasGoalPreview = message.goalPreview && message.awaitingConfirmation;
  const showProposalButtons = message.awaitingConfirmation;
  const redirect = !isUser ? parseRedirectCommand(message.content) : null;
  const displayContent = redirect ? stripRedirectCommand(message.content) : message.content;
  // Get isProposalHandled from store
  const { isProposalHandled } = useChatStore();
  const isHandled = messageId ? isProposalHandled(messageId) : false;
  // Buttons are disabled if proposal was handled OR if it's not the latest proposal
  const buttonsDisabled = isHandled || !isLatestProposal;

  // Render markdown preview with buttons instead of user chat bubbles
  if (hasGoalPreview) {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={isExiting ? { opacity: 0, y: 30 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col w-full items-end"
      >
        <div className="max-w-[85%] min-w-0 space-y-3 break-words [overflow-wrap:anywhere]">
          {/* Main message */}
          <div className="px-4 py-3 rounded-2xl bg-muted/50 text-white rounded-tl-sm border border-border/30 prose prose-sm dark:prose-invert prose-p:text-white prose-li:text-white prose-strong:text-white prose-h1:text-white prose-h2:text-white prose-h3:text-white prose-h4:text-white prose-code:text-white prose-pre:text-white prose-pre-code:text-white max-w-none [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-1 [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-white/10 [&_pre]:px-3 [&_pre]:py-2 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre_code]:whitespace-pre-wrap [&_pre_code]:break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
          </div>

          {/* Markdown Preview Card */}
          <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 prose prose-sm dark:prose-invert prose-p:text-white prose-li:text-white prose-strong:text-white prose-h1:text-white prose-h2:text-white prose-h3:text-white prose-h4:text-white prose-code:text-white prose-pre:text-white prose-pre-code:text-white max-w-none [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-1 [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-white/10 [&_pre]:px-3 [&_pre]:py-2 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre_code]:whitespace-pre-wrap [&_pre_code]:break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.goalPreview}</ReactMarkdown>
          </div>

          {/* Proposal Buttons - render based on which handlers are provided */}
          {showProposalButtons && buttonsDisabled && (
            <p className="text-xs text-muted-foreground">Decision recorded</p>
          )}
          <div className="flex flex-col lg:flex-row lg:justify-end gap-2">
            {/* Confirm/Edit/Cancel Buttons */}
            {onConfirm && onEdit && onCancel && (
              <>
                {/* Cancel Button */}
                <button
                  onClick={onCancel}
                  disabled={buttonsDisabled}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg font-medium text-sm transition-all",
                    isHandled
                      ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                      : "bg-destructive/20 text-destructive hover:bg-destructive/30",
                    "w-full px-4 py-2",
                    "lg:w-auto lg:px-3 lg:py-2 lg:hover:px-4 lg:justify-center"
                  )}
                >
                  <X className="w-4 h-4 flex-shrink-0 lg:group-hover:-translate-x-2 transition-transform duration-150" />
                  <span className="lg:inline lg:max-w-0 lg:opacity-0 lg:overflow-hidden lg:whitespace-nowrap lg:group-hover:max-w-xs lg:group-hover:opacity-100 transition-all duration-150">
                    Cancel
                  </span>
                </button>
                {/* Edit Button */}
                <button
                  onClick={onEdit}
                  disabled={buttonsDisabled}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg font-medium text-sm transition-all",
                    isHandled
                      ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                      : "bg-muted text-foreground hover:bg-muted/70",
                    "w-full px-4 py-2",
                    "lg:w-auto lg:px-3 lg:py-2 lg:hover:px-4 lg:justify-center"
                  )}
                >
                  <Edit3 className="w-4 h-4 flex-shrink-0 lg:group-hover:-translate-x-2 transition-transform duration-150" />
                  <span className="lg:inline lg:max-w-0 lg:opacity-0 lg:overflow-hidden lg:whitespace-nowrap lg:group-hover:max-w-xs lg:group-hover:opacity-100 transition-all duration-150">
                    Edit
                  </span>
                </button>
                {/* Confirm Button */}
                <button
                  onClick={onConfirm}
                  disabled={buttonsDisabled}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg font-medium text-sm transition-all",
                    isHandled
                      ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                      : "bg-gradient-neon text-primary-foreground neon-glow-cyan",
                    "w-full px-4 py-2",
                    "lg:w-auto lg:px-3 lg:py-2 lg:hover:px-4 lg:justify-center"
                  )}
                >
                  <Check className="w-4 h-4 flex-shrink-0 lg:group-hover:-translate-x-2 transition-transform duration-150" />
                  <span className="lg:inline lg:max-w-0 lg:opacity-0 lg:overflow-hidden lg:whitespace-nowrap lg:group-hover:max-w-xs lg:group-hover:opacity-100 transition-all duration-150">
                    Confirm
                  </span>
                </button>
              </>
            )}

            {/* Accept/Decline Buttons */}
            {onAccept && onDecline && (
              <>
                {/* Decline Button */}
                <button
                  onClick={onDecline}
                  disabled={buttonsDisabled}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg font-medium text-sm transition-all",
                    isHandled
                      ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                      : "bg-destructive/20 text-destructive hover:bg-destructive/30",
                    "w-full px-4 py-2",
                    "lg:w-auto lg:px-3 lg:py-2 lg:hover:px-4 lg:justify-center"
                  )}
                >
                  <XCircle className="w-4 h-4 flex-shrink-0 lg:group-hover:-translate-x-2 transition-transform duration-150" />
                  <span className="lg:inline lg:max-w-0 lg:opacity-0 lg:overflow-hidden lg:whitespace-nowrap lg:group-hover:max-w-xs lg:group-hover:opacity-100 transition-all duration-150">
                    Decline
                  </span>
                </button>
                {/* Accept Button */}
                <button
                  onClick={onAccept}
                  disabled={buttonsDisabled}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg font-medium text-sm transition-all",
                    isHandled
                      ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                      : "bg-gradient-neon text-primary-foreground neon-glow-cyan",
                    "w-full px-4 py-2",
                    "lg:w-auto lg:px-3 lg:py-2 lg:hover:px-4 lg:justify-center"
                  )}
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0 lg:group-hover:-translate-x-2 transition-transform duration-150" />
                  <span className="lg:inline lg:max-w-0 lg:opacity-0 lg:overflow-hidden lg:whitespace-nowrap lg:group-hover:max-w-xs lg:group-hover:opacity-100 transition-all duration-150">
                    Accept
                  </span>
                </button>
              </>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full overflow-hidden", isUser ? "items-end" : "items-start")}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={isExiting ? { opacity: 0, y: 30, transition: { duration: 0.3 } } : { opacity: 0 }}
        className={cn(
          "flex w-full",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "max-w-[85%] min-w-0 px-4 py-3 rounded-2xl",
            isUser
              ? "bg-gradient-neon text-primary-foreground rounded-tr-sm"
              : "bg-muted/50 text-foreground rounded-tl-sm border border-border/30"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere]">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert prose-p:text-white prose-li:text-white prose-strong:text-white prose-h1:text-white prose-h2:text-white prose-h3:text-white prose-h4:text-white prose-code:text-white max-w-none break-words [overflow-wrap:anywhere] [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-1 [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre_code]:whitespace-pre-wrap [&_pre_code]:break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
            </div>
          )}
          <p className={cn(
            "text-[10px] mt-1.5",
            isUser ? "text-primary-foreground/60" : "text-muted-foreground"
          )}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </motion.div>

      {/* Inline extraction progress — persists as part of message history */}
      {!isUser && message.extraction && (
        <ExtractionMessageCard
          extraction={message.extraction}
          enableLiveTracking={enableLiveExtraction}
          onComplete={onExtractionComplete}
        />
      )}

      {/* Inline redirect card */}
      {redirect && onRedirectGo && (
        <RedirectCard
          redirect={redirect}
          onGo={() => onRedirectGo(redirect)}
          onStay={() => {}}
        />
      )}

      {showProposalButtons && !isUser && (
        <div className="flex flex-col lg:flex-row lg:justify-start gap-2 mt-2">
          {buttonsDisabled && (
            <p className="w-full text-xs text-muted-foreground">Decision recorded</p>
          )}
          {/* Confirm/Edit/Cancel Buttons */}
          {onConfirm && onEdit && onCancel && (
            <>
              {/* Cancel Button */}
              <button
                onClick={onCancel}
                disabled={buttonsDisabled}
                className={cn(
                  "group relative flex items-center gap-2 rounded-lg font-medium text-sm transition-all",
                  isHandled
                    ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                    : "bg-destructive/20 text-destructive hover:bg-destructive/30",
                  "w-full px-4 py-2",
                  "lg:w-auto lg:px-3 lg:py-2 lg:hover:px-4 lg:justify-center"
                )}
              >
                <X className="w-4 h-4 flex-shrink-0 lg:group-hover:-translate-x-2 transition-transform duration-150" />
                <span className="lg:inline lg:max-w-0 lg:opacity-0 lg:overflow-hidden lg:whitespace-nowrap lg:group-hover:max-w-xs lg:group-hover:opacity-100 transition-all duration-150">
                  Cancel
                </span>
              </button>
              {/* Edit Button */}
              <button
                onClick={onEdit}
                disabled={buttonsDisabled}
                className={cn(
                  "group relative flex items-center gap-2 rounded-lg font-medium text-sm transition-all",
                  isHandled
                    ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                    : "bg-muted text-foreground hover:bg-muted/70",
                  "w-full px-4 py-2",
                  "lg:w-auto lg:px-3 lg:py-2 lg:hover:px-4 lg:justify-center"
                )}
              >
                <Edit3 className="w-4 h-4 flex-shrink-0 lg:group-hover:-translate-x-2 transition-transform duration-150" />
                <span className="lg:inline lg:max-w-0 lg:opacity-0 lg:overflow-hidden lg:whitespace-nowrap lg:group-hover:max-w-xs lg:group-hover:opacity-100 transition-all duration-150">
                  Edit
                </span>
              </button>
              {/* Confirm Button */}
              <button
                onClick={onConfirm}
                disabled={buttonsDisabled}
                className={cn(
                  "group relative flex items-center gap-2 rounded-lg font-medium text-sm transition-all",
                  isHandled
                    ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                    : "bg-gradient-neon text-primary-foreground neon-glow-cyan",
                  "w-full px-4 py-2",
                  "lg:w-auto lg:px-3 lg:py-2 lg:hover:px-4 lg:justify-center"
                )}
              >
                <Check className="w-4 h-4 flex-shrink-0 lg:group-hover:-translate-x-2 transition-transform duration-150" />
                <span className="lg:inline lg:max-w-0 lg:opacity-0 lg:overflow-hidden lg:whitespace-nowrap lg:group-hover:max-w-xs lg:group-hover:opacity-100 transition-all duration-150">
                  Confirm
                </span>
              </button>
            </>
          )}

          {/* Accept/Decline Buttons */}
          {onAccept && onDecline && (
            <>
              {/* Decline Button */}
              <button
                onClick={onDecline}
                disabled={buttonsDisabled}
                className={cn(
                  "group relative flex items-center gap-2 rounded-lg font-medium text-sm transition-all",
                  isHandled
                    ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                    : "bg-destructive/20 text-destructive hover:bg-destructive/30",
                  "w-full px-4 py-2",
                  "lg:w-auto lg:px-3 lg:py-2 lg:hover:px-4 lg:justify-center"
                )}
              >
                <XCircle className="w-4 h-4 flex-shrink-0 lg:group-hover:-translate-x-2 transition-transform duration-150" />
                <span className="lg:inline lg:max-w-0 lg:opacity-0 lg:overflow-hidden lg:whitespace-nowrap lg:group-hover:max-w-xs lg:group-hover:opacity-100 transition-all duration-150">
                  Decline
                </span>
              </button>
              {/* Accept Button */}
              <button
                onClick={onAccept}
                disabled={buttonsDisabled}
                className={cn(
                  "group relative flex items-center gap-2 rounded-lg font-medium text-sm transition-all",
                  isHandled
                    ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                    : "bg-gradient-neon text-primary-foreground neon-glow-cyan",
                  "w-full px-4 py-2",
                  "lg:w-auto lg:px-3 lg:py-2 lg:hover:px-4 lg:justify-center"
                )}
              >
                <CheckCircle className="w-4 h-4 flex-shrink-0 lg:group-hover:-translate-x-2 transition-transform duration-150" />
                <span className="lg:inline lg:max-w-0 lg:opacity-0 lg:overflow-hidden lg:whitespace-nowrap lg:group-hover:max-w-xs lg:group-hover:opacity-100 transition-all duration-150">
                  Accept
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
