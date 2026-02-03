import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, StopCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const OverviewChatPage = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    overviewChat,
    sendOverviewMessage,
    stopOverviewStream,
    fetchOverviewChat,
    pendingCommands,
    cancelPendingCommands,
    confirmPendingCommands,
    isStreamActive,
  } = useAppStore();

  const streamId = `overview-${overviewChat?.messages[overviewChat.messages.length - 1]?.id || 'latest'}`;
  const isStreaming = overviewChat?.isLoading || isStreamActive(streamId);

  // Fetch chat on mount
  useEffect(() => {
    if (!overviewChat) {
      fetchOverviewChat();
    }
  }, [overviewChat, fetchOverviewChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [overviewChat?.messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const messageContent = input.trim();
    setInput('');

    try {
      await sendOverviewMessage(messageContent);
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
      await stopOverviewStream();
    } catch (error) {
      console.error('Failed to stop stream:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
        <div className="text-2xl">🌴</div>
        <div>
          <h3 className="font-semibold text-white text-purple-400">Overview Chat</h3>
          <p className="text-xs text-slate-400">All your goals in one place</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {overviewChat?.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-2">🌴</div>
              <p className="text-slate-400">Welcome to your overview chat!</p>
              <p className="text-sm text-slate-500 mt-2">
                I can help you manage all your goals - items, finances, and actions.
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {overviewChat?.messages.map((message, index) => (
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
        {pendingCommands?.chatId === 'overview' && (
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
            placeholder="Message Overview Assistant..."
            disabled={isStreaming}
            className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
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
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
