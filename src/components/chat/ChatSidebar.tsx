import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatPanel } from './ChatPanel';

interface ChatSidebarProps {
  mode: 'creation' | 'goal';
  goalId?: string;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  className?: string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  mode,
  goalId,
  isMinimized,
  onToggleMinimize,
  className
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [previousMode, setPreviousMode] = useState<'creation' | 'goal'>(mode);
  const [fabGlowPulse, setFabGlowPulse] = useState(false);
  const hasMounted = React.useRef(false);

  // Debug: Track component mounts
  useEffect(() => {
    console.log('[ChatSidebar] MOUNTED', { mode, goalId, isMinimized });
    return () => {
      console.log('[ChatSidebar] UNMOUNTED');
    };
  }, []);

  // Debug: Track prop changes
  useEffect(() => {
    console.log('[ChatSidebar] Props changed:', { mode, goalId, isMinimized });
  }, [mode, goalId, isMinimized]);

  // Trigger glow pulse on mount (when entering a view)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      setFabGlowPulse(true);
      const timer = setTimeout(() => setFabGlowPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Track mode changes for transitions
  useEffect(() => {
    if (mode !== previousMode) {
      const oldMode = previousMode;
      setPreviousMode(mode);
      console.log('[ChatSidebar] Mode change:', { from: oldMode, to: mode });

      // Trigger FAB glow pulse on any mode change (both entering and leaving goal view)
      setFabGlowPulse(true);
      const timer = setTimeout(() => setFabGlowPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [mode, previousMode]);

  return (
    <>
      {/* Desktop Chat Panel - Fixed positioned */}
      <motion.aside
        style={{ transformOrigin: 'bottom right' }}
        initial={false}
        animate={{
          scale: isMinimized ? 0 : 1,
          opacity: isMinimized ? 0 : 1
        }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          mass: 0.8
        }}
        className={cn(
          "hidden lg:flex flex-col fixed top-16 bottom-0 right-0 w-[400px] overflow-hidden border-l border-border bg-card/30 p-4 z-50",
          isMinimized && mode !== 'goal' && "pointer-events-none",
          className
        )}
      >
        <ChatPanel
          mode={mode}
          goalId={goalId}
          className="h-full w-full"
          isMinimized={isMinimized}
          onToggleMinimize={onToggleMinimize}
          previousMode={previousMode}
        />
      </motion.aside>

      {/* Desktop Floating Chat Button */}
      <motion.button
        initial={false}
        animate={{
          opacity: isMinimized ? 1 : 0,
          scale: isMinimized ? 1 : 0,
        }}
        transition={{
          opacity: { duration: 0.15 },
          scale: { duration: 0.2 }
        }}
        className={cn(
          "hidden lg:flex fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full",
          "items-center justify-center",
          "hover:scale-110 cursor-pointer transition-transform",
          "shadow-lg",
          !isMinimized && "pointer-events-none"
        )}
        onClick={onToggleMinimize}
        aria-label="Open chat"
      >
        <motion.div
          animate={fabGlowPulse ? {
            boxShadow: [
              '0 0 0 0 rgba(6, 182, 212, 0)',
              '0 0 0 8px rgba(6, 182, 212, 0)',
              '0 0 0 16px rgba(6, 182, 212, 0)',
              '0 0 0 0 rgba(6, 182, 212, 0)',
            ],
          } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-14 h-14 rounded-full bg-gradient-neon neon-glow-cyan flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6 text-primary-foreground" />
        </motion.div>
      </motion.button>

      {/* Mobile Floating Chat Button */}
      <motion.button
        initial={false}
        animate={{
          opacity: mobileOpen ? 0 : 1,
          scale: mobileOpen ? 0 : 1
        }}
        transition={{
          opacity: { duration: 0.15 },
          scale: { duration: 0.2 }
        }}
        className={cn(
          "lg:hidden flex fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full",
          "bg-gradient-neon text-primary-foreground neon-glow-cyan",
          "items-center justify-center",
          "hover:scale-110 cursor-pointer transition-transform",
          "shadow-lg",
          mobileOpen && "pointer-events-none"
        )}
        onClick={() => setMobileOpen(true)}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Mobile Chat Panel - Fullscreen */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 25
            }}
            className="lg:hidden fixed inset-0 z-50 flex flex-col bg-background"
          >
            <ChatPanel
              mode={mode}
              goalId={goalId}
              onClose={() => setMobileOpen(false)}
              className="flex-1 rounded-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
