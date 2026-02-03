import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, StopCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type CategoryId = 'items' | 'finances' | 'actions';

interface SpecialistChatPanelProps {
  categoryId: CategoryId;
  categoryName: string;
  categoryIcon: string;
  className?: string;
}

// Specialist persona configuration
const SPECIALIST_CONFIG: Record<CategoryId, { name: string; icon: string; color: string; gradient: string }> = {
  items: {
    name: 'Shopping Assistant',
    icon: '🛍️',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  finances: {
    name: 'Finance Coach',
    icon: '💰',
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  actions: {
    name: 'Action Coach',
    icon: '🎯',
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-amber-500/20',
  },
};

export const SpecialistChatPanel: React.FC<SpecialistChatPanelProps> = ({
  categoryId,
  categoryName,
  categoryIcon,
  className,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    categoryChats,
    sendCategoryMessage,
    stopCategoryStream,
    fetchCategoryChat,
    pendingCommands,
    cancelPendingCommands,
    confirmPendingCommands,
    isStreamActive,
  } = useAppStore();

  const chat = categoryChats[categoryId] || { messages: [], isLoading: false };
  const config = SPECIALIST_CONFIG[categoryId];
  const streamId = `${categoryId}-${chat.messages[chat.messages.length - 1]?.id || 'latest'}`;
  const isStreaming = chat.isLoading || isStreamActive(streamId);

  // Fetch chat on mount
  useEffect(() => {
    if (!categoryChats[categoryId]) {
      fetchCategoryChat(categoryId);
    }
  }, [categoryId, categoryChats, fetchCategoryChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const messageContent = input.trim();
    setInput('');

    try {
      await sendCategoryMessage(categoryId, messageContent);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStopStream = async () => {
    try {
      await stopCategoryStream(categoryId);
    } catch (error) {
      console.error('Failed to stop stream:', error);
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900", className)}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-3 p-4 border-b border-white/10 bg-gradient-to-r",
        config.gradient
      )}>
        <div className="text-2xl">{config.icon}</div>
        <div>
          <h3 className={cn("font-semibold text-white", config.color)}>{config.name}</h3>
          <p className="text-xs text-slate-400">{categoryName} Goals</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-2">{config.icon}</div>
              <p className="text-slate-400">Start chatting about your {categoryName.toLowerCase()} goals...</p>
              <p className="text-sm text-slate-500 mt-2">
                {categoryId === 'items' && 'I can help you find the best products, track prices, and more.'}
                {categoryId === 'finances' && 'I can help you track savings, set financial targets, and more.'}
                {categoryId === 'actions' && 'I can help you build habits, track progress, and stay motivated.'}
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {chat.messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={cn(
                  "flex",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2",
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-slate-100'
                )}>
                  {message.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-1">{children}</ol>,
                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-slate-600/50 px-1 py-0.5 rounded text-sm">{children}</code>
                          ) : (
                            <code className="block bg-slate-800/50 p-2 rounded text-sm overflow-x-auto">{children}</code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Pending Commands */}
        {pendingCommands?.chatId === categoryId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="text-amber-400 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-amber-200 font-medium mb-1">
                  {pendingCommands.commands.length} command{pendingCommands.commands.length > 1 ? 's' : ''} pending
                </p>
                <p className="text-sm text-slate-300 mb-3">
                  {pendingCommands.commands.map((cmd, i) => (
                    <span key={i} className="block">
                      • {cmd.type.replace(/_/g, ' ')}: {cmd.data.title || cmd.data.taskId || cmd.data.goalId}
                    </span>
                  ))}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmPendingCommands()}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => cancelPendingCommands()}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Streaming Indicator */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-slate-400"
          >
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
            </div>
            <span className="text-sm">Thinking...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-slate-800/50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${config.name}...`}
            disabled={isStreaming}
            className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          {isStreaming ? (
            <button
              onClick={handleStopStream}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
              title="Stop generating"
            >
              <StopCircle size={20} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
