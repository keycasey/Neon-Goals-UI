import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CompletionBurstProps {
  isComplete: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * "Supercritical" White Neon Blowout Animation
 * Triggers when a goal reaches 100% completion (all tasks + subgoals complete)
 */
export const CompletionBurst: React.FC<CompletionBurstProps> = ({
  isComplete,
  children,
  className,
}) => {
  const [showBurst, setShowBurst] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (isComplete && !hasTriggered) {
      setShowBurst(true);
      setHasTriggered(true);
      // Hide burst after animation
      const timer = setTimeout(() => setShowBurst(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, hasTriggered]);

  return (
    <div className={cn("relative", className)}>
      {children}

      {/* Supercritical White Neon Blowout */}
      <AnimatePresence>
        {showBurst && (
          <>
            {/* Expanding ring waves */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`ring-${i}`}
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.2,
                  ease: 'easeOut',
                }}
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  border: '2px solid white',
                  boxShadow: '0 0 20px white, 0 0 40px white, 0 0 60px rgba(255,255,255,0.5)',
                }}
              />
            ))}

            {/* Central flash */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.5, times: [0, 0.2, 1] }}
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
              }}
            />

            {/* White neon glow overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 1.5, times: [0, 0.1, 1] }}
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                boxShadow: `
                  inset 0 0 30px rgba(255,255,255,0.8),
                  0 0 30px rgba(255,255,255,0.6),
                  0 0 60px rgba(255,255,255,0.4),
                  0 0 100px rgba(255,255,255,0.2)
                `,
              }}
            />

            {/* Particle burst */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const distance = 150;
              return (
                <motion.div
                  key={`particle-${i}`}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.1,
                    ease: 'easeOut',
                  }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full pointer-events-none"
                  style={{
                    background: 'white',
                    boxShadow: '0 0 10px white, 0 0 20px white',
                    marginTop: '-4px',
                    marginLeft: '-4px',
                  }}
                />
              );
            })}

            {/* Success text overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.1, 1, 1] }}
              transition={{ duration: 2, times: [0, 0.2, 0.7, 1] }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <span
                className="text-2xl font-heading font-bold uppercase tracking-widest"
                style={{
                  color: 'white',
                  textShadow: '0 0 10px white, 0 0 20px white, 0 0 40px rgba(255,255,255,0.5)',
                }}
              >
                COMPLETE
              </span>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Persistent completed glow state */}
      {isComplete && !showBurst && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: `
              0 0 10px rgba(255,255,255,0.2),
              0 0 20px rgba(255,255,255,0.1),
              inset 0 0 20px rgba(255,255,255,0.05)
            `,
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        />
      )}
    </div>
  );
};

export default CompletionBurst;
