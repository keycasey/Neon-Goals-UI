import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Mail, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBillingStore } from '@/store/useBillingStore';
import { getUsagePercent } from '@/types/billing';

interface UsageMeterProps {
  type: 'messages' | 'email_alerts' | 'sms_alerts';
  className?: string;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({ type, className }) => {
  const { usage, entitlements } = useBillingStore();

  if (!usage || !entitlements) return null;

  const config = {
    messages: {
      icon: MessageSquare,
      label: 'AI Messages',
      used: usage.messagesUsed,
      limit: usage.monthlyMessageLimit,
      color: 'from-primary to-primary/80',
    },
    email_alerts: {
      icon: Mail,
      label: 'Email Alerts',
      used: usage.emailAlertsUsed,
      limit: entitlements.maxEmailAlerts,
      color: 'from-accent to-accent/80',
    },
    sms_alerts: {
      icon: MessageCircle,
      label: 'SMS Alerts',
      used: usage.smsAlertsUsed,
      limit: entitlements.maxSmsAlerts,
      color: 'from-secondary to-secondary/80',
    },
  };

  const { icon: Icon, label, used, limit, color } = config[type];
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isNearLimit = percent >= 70;
  const isAtLimit = percent >= 100;

  return (
    <div className={cn('glass-card p-4 rounded-xl', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn('p-2 rounded-lg bg-muted/30', isAtLimit && 'neon-glow-pink')}>
            <Icon className={cn('w-4 h-4', isAtLimit ? 'text-destructive' : 'text-foreground')} />
          </div>
          <span className="font-medium text-sm text-foreground">{label}</span>
        </div>
        <span className={cn('text-sm font-mono', isAtLimit ? 'text-destructive' : 'text-muted-foreground')}>
          {used} / {limit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 rounded-full overflow-hidden bg-muted/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full bg-gradient-to-r',
            isAtLimit ? 'from-destructive to-destructive/80' : isNearLimit ? 'from-warning to-warning/80' : color
          )}
          style={{
            boxShadow: isAtLimit
              ? '0 0 10px rgba(255, 0, 80, 0.5)'
              : isNearLimit
              ? '0 0 10px rgba(255, 215, 0, 0.3)'
              : '0 0 10px rgba(0, 240, 255, 0.3)',
          }}
        />
      </div>
    </div>
  );
};
