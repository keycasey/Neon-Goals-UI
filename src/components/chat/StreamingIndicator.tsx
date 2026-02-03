import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreamingIndicatorProps {
  isVisible: boolean;
  onStop?: () => void;
  position?: 'inline' | 'floating';
  className?: string;
  message?: string;
}

export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({
  isVisible,
  onStop,
  position = 'inline',
  className,
  message = 'Thinking...',
}) => {
  if (position === 'inline') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn("flex items-center gap-3 text-slate-400", className)}
          >
            {/* Animated dots */}
            <div className="flex gap-1">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                className="w-2 h-2 bg-slate-400 rounded-full"
              />
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-slate-400 rounded-full"
              />
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-slate-400 rounded-full"
              />
            </div>

            <span className="text-sm">{message}</span>

            {onStop && (
              <button
                onClick={onStop}
                className="ml-auto p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                title="Stop generating"
              >
                <StopCircle size={16} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Floating position
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
            "bg-slate-900/95 backdrop-blur-md border border-slate-700",
            "rounded-full px-4 py-2.5 shadow-2xl",
            "flex items-center gap-3",
            className
          )}
        >
          {/* Pulse effect */}
          <motion.div
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 bg-blue-500/20 rounded-full blur-md -z-10"
          />

          {/* Animated dots */}
          <div className="flex gap-1">
            <motion.span
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
              className="w-2 h-2 bg-blue-400 rounded-full"
            />
            <motion.span
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 bg-blue-400 rounded-full"
            />
            <motion.span
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 bg-blue-400 rounded-full"
            />
          </div>

          <span className="text-sm text-slate-300">{message}</span>

          {onStop && (
            <button
              onClick={onStop}
              className="ml-1 p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full transition-colors"
              title="Stop generating"
            >
              <StopCircle size={16} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Compact variant for use in chat input area
interface StreamingInputIndicatorProps {
  isStreaming: boolean;
  onStop?: () => void;
  className?: string;
}

export const StreamingInputIndicator: React.FC<StreamingInputIndicatorProps> = ({
  isStreaming,
  onStop,
  className,
}) => {
  return (
    <AnimatePresence>
      {isStreaming && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={onStop}
          className={cn(
            "p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors",
            "flex items-center gap-2",
            className
          )}
          title="Stop generating"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"
          />
          <span className="text-sm font-medium">Stop</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
