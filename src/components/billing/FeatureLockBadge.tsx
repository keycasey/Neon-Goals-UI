import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureLockBadgeProps {
  planName: 'Pro' | 'Power';
  className?: string;
}

export const FeatureLockBadge: React.FC<FeatureLockBadgeProps> = ({ planName, className }) => {
  const color = planName === 'Pro' ? 'text-primary border-primary/30 bg-primary/10' : 'text-secondary border-secondary/30 bg-secondary/10';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        color,
        className
      )}
    >
      <Lock className="w-3 h-3" />
      {planName}
    </span>
  );
};
