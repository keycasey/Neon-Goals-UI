import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { Message } from '@/types/goals';

interface ChatPanelProps {
  mode: 'creation' | 'goal';
  goalId?: string;
  onClose?: () => void;
  className?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  mode, 
  goalId, 
  onClose, 
  className 
}) => {
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    creationChat, 
    goalChats, 
    sendCreationMessage, 
    sendGoalMessage,
    goals 
  } = useAppStore();

  const chat = mode === 'creation' ? creationChat : goalChats[goalId || ''] || { messages: [], isLoading: false };
  const goal = goalId ? goals.find(g => g.id === goalId) : null;

  const getPersona = () => {
    if (mode === 'creation') return { name: 'Goals Assistant', emoji: '🌴' };
    if (!goal) return { name: 'Assistant', emoji: '✨' };
    
    switch (goal.type) {
      case 'item': return { name: 'Product Expert', emoji: '🔍' };
      case 'finance': return { name: 'Wealth Advisor', emoji: '💰' };
      case 'action': return { name: 'Personal Coach', emoji: '💪' };
      default: return { name: 'Assistant', emoji: '✨' };
    }
  };

  const persona = getPersona();

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "flex flex-col glass-card border border-border/50",
        isMinimized ? "h-16" : "h-full min-h-[400px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-neon flex items-center justify-center text-lg">
            {persona.emoji}
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">
              {persona.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {mode === 'creation' ? 'Ready to help you set goals' : `Helping with: ${goal?.title}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
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
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-neon"
          >
            {chat.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
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
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
              <Sparkles className="w-4 h-4 text-primary/60" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                disabled={chat.isLoading}
              />
            </div>
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

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
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
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
