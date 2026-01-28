import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, Minimize2, Maximize2, Check, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { Message } from '@/types/goals';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatPanelProps {
  mode: 'creation' | 'goal';
  goalId?: string;
  onClose?: () => void;
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  previousMode?: 'creation' | 'goal';
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  mode,
  goalId,
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

  const isMinimized = externalIsMinimized || false;

  const toggleMinimize = () => {
    externalOnToggleMinimize?.();
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    creationChat,
    goalChats,
    sendCreationMessage,
    sendGoalMessage,
    confirmGoalCreation,
    startGoalCreation,
    stopGoalCreation,
    isCreatingGoal,
    goals,
  } = useAppStore();

  const chat = mode === 'creation' ? creationChat : goalChats[goalId || ''] || { messages: [], isLoading: false };
  const goal = goalId ? goals.find(g => g.id === goalId) : null;

  // Memoize persona to prevent infinite re-renders
  const persona = useMemo(() => {
    if (mode === 'creation') return { name: 'Goals Assistant', emoji: '🌴' };
    if (!goal) return { name: 'Assistant', emoji: '✨' };

    switch (goal.type) {
      case 'item': return { name: 'Product Expert', emoji: '🔍' };
      case 'finance': return { name: 'Wealth Advisor', emoji: '💰' };
      case 'action': return { name: 'Personal Coach', emoji: '💪' };
      default: return { name: 'Assistant', emoji: '✨' };
    }
  }, [mode, goal?.type]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chat.isLoading) return;

    if (mode === 'creation') {
      sendCreationMessage(input.trim());
    } else if (goalId) {
      sendGoalMessage(goalId, input.trim());
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
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-neon min-h-0"
          >
            <AnimatePresence mode="popLayout">
              {chat.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onConfirm={mode === 'creation' && message.awaitingConfirmation ? confirmGoalCreation : undefined}
                  isExiting={isExitingGoal}
                />
              ))}
            </AnimatePresence>

            {chat.isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      {!isMinimized && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-border/50">
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
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                disabled={chat.isLoading}
              />
            </motion.div>
            <button
              type="submit"
              disabled={!input.trim() || chat.isLoading}
              className={cn(
                "p-3 rounded-xl transition-all",
                input.trim() && !chat.isLoading
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

const MessageBubble: React.FC<{
  message: Message;
  onConfirm?: () => void;
  isExiting?: boolean;
}> = ({ message, onConfirm, isExiting }) => {
  const isUser = message.role === 'user';
  const hasGoalPreview = message.goalPreview && message.awaitingConfirmation;

  // Render markdown preview with buttons instead of user chat bubbles
  if (hasGoalPreview) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={isExiting ? { opacity: 0, y: 30 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-end"
      >
        <div className="max-w-[85%] space-y-3">
          {/* Main message */}
          <div className="px-4 py-3 rounded-2xl bg-muted/50 text-white rounded-tl-sm border border-border/30 prose prose-sm dark:prose-invert prose-p:text-white prose-li:text-white prose-strong:text-white prose-h1:text-white prose-h2:text-white prose-h3:text-white prose-h4:text-white max-w-none [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:display-block [&_li]:my-1 [&_li]:ml-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>

          {/* Markdown Preview Card */}
          <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 prose prose-sm dark:prose-invert prose-p:text-white prose-li:text-white prose-strong:text-white prose-h1:text-white prose-h2:text-white prose-h3:text-white prose-h4:text-white max-w-none [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:block [&_li]:block [&_li]:my-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.goalPreview}</ReactMarkdown>
          </div>

          {/* Confirmation Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-neon text-primary-foreground font-medium text-sm transition-all hover:scale-105 neon-glow-cyan"
            >
              <Check className="w-4 h-4" />
              Looks good!
            </button>
            <button
              onClick={() => {
                // User wants to edit - just enable the input for them to type changes
                // The AI will understand they want to modify the goal
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground font-medium text-sm transition-all hover:bg-muted/70 hover:scale-105"
            >
              <XCircle className="w-4 h-4" />
              Let's change it.
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={isExiting ? { opacity: 0, y: 30, transition: { duration: 0.3 } } : { opacity: 0 }}
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] px-4 py-3 rounded-2xl",
          isUser
            ? "bg-gradient-neon text-primary-foreground rounded-tr-sm"
            : "bg-muted/50 text-foreground rounded-tl-sm border border-border/30"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert prose-p:text-white prose-li:text-white prose-strong:text-white prose-h1:text-white prose-h2:text-white prose-h3:text-white prose-h4:text-white max-w-none [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:display-block [&_li]:my-1 [&_li]:ml-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
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
  );
};
