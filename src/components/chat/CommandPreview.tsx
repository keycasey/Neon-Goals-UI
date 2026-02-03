import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, AlertTriangle, Archive, Plus, ToggleLeft, Target, Wallet, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatCommand } from '@/store/useAppStore';

interface CommandPreviewProps {
  commands: ChatCommand[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const COMMAND_CONFIG = {
  ADD_TASK: {
    icon: Plus,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Add Task',
  },
  TOGGLE_TASK: {
    icon: ToggleLeft,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    label: 'Toggle Task',
  },
  UPDATE_TITLE: {
    icon: Edit2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Update Title',
  },
  UPDATE_FILTERS: {
    icon: Target,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    label: 'Update Filters',
  },
  ARCHIVE_GOAL: {
    icon: Archive,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Archive Goal',
  },
};

const getCommandDescription = (command: ChatCommand): string => {
  switch (command.type) {
    case 'ADD_TASK':
      return `Add task: "${command.data.title}"`;
    case 'TOGGLE_TASK':
      return `${command.data.completed ? 'Mark incomplete' : 'Mark complete'}: ${command.data.taskId}`;
    case 'UPDATE_TITLE':
      return `Change title to: "${command.data.title}"`;
    case 'UPDATE_FILTERS':
      return `Update filters: ${JSON.stringify(command.data.filters)}`;
    case 'ARCHIVE_GOAL':
      return 'Archive this goal';
    default:
      return `${command.type}`;
  }
};

const renderCommandDetails = (command: ChatCommand, goals: any[]) => {
  const goal = goals.find(g => g.id === command.goalId);

  switch (command.type) {
    case 'ADD_TASK':
      return (
        <div className="space-y-2">
          <p className="text-sm text-slate-300">
            Will add a new task to <span className="text-white font-medium">{goal?.title || 'goal'}</span>:
          </p>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-white">✓ {command.data.title}</p>
          </div>
        </div>
      );

    case 'TOGGLE_TASK':
      return (
        <div className="space-y-2">
          <p className="text-sm text-slate-300">
            Will {command.data.completed ? 'mark as incomplete' : 'mark as complete'}:
          </p>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <p className="text-white">
              {command.data.completed ? '○' : '✓'} {command.data.taskId}
            </p>
          </div>
        </div>
      );

    case 'UPDATE_TITLE':
      return (
        <div className="space-y-2">
          <p className="text-sm text-slate-300">
            For <span className="text-white font-medium">{goal?.title || 'goal'}</span>:
          </p>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 space-y-1">
            <p className="text-slate-400 line-through">{goal?.title || 'current title'}</p>
            <p className="text-white">→ {command.data.title}</p>
          </div>
        </div>
      );

    case 'UPDATE_FILTERS':
      return (
        <div className="space-y-2">
          <p className="text-sm text-slate-300">
            Update filters for <span className="text-white font-medium">{goal?.title || 'goal'}</span>:
          </p>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
            <pre className="text-sm text-slate-300">
              {JSON.stringify(command.data.filters, null, 2)}
            </pre>
          </div>
        </div>
      );

    case 'ARCHIVE_GOAL':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle size={16} />
            <p className="text-sm font-medium">This action will move the goal to archived status</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-red-500/30">
            <p className="text-red-300">{goal?.title || 'goal'}</p>
            <p className="text-xs text-slate-400 mt-1">Goal will be hidden from main view</p>
          </div>
        </div>
      );

    default:
      return <p className="text-slate-400">{JSON.stringify(command.data)}</p>;
  }
};

export const CommandPreview: React.FC<CommandPreviewProps> = ({
  commands,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const goals = []; // TODO: Get goals from store if needed for preview

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-slate-900/95 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Sparkles className="text-amber-400" size={18} />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold">Confirm Changes</h3>
          <p className="text-xs text-slate-400">
            {commands.length} command{commands.length > 1 ? 's' : ''} pending
          </p>
        </div>
      </div>

      {/* Commands List */}
      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {commands.map((command, index) => {
          const config = COMMAND_CONFIG[command.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={`${command.type}-${command.goalId}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "border rounded-xl p-3",
                config.borderColor,
                config.bgColor
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", config.bgColor)}>
                  <Icon className={cn(config.color, "w-4 h-4")} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-medium uppercase tracking-wider", config.color)}>
                      {config.label}
                    </span>
                    {command.type === 'ARCHIVE_GOAL' && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                        Irreversible
                      </span>
                    )}
                  </div>
                  {renderCommandDetails(command, goals)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors",
              "bg-slate-700 hover:bg-slate-600 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors",
              "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "shadow-lg shadow-amber-500/25"
            )}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check size={18} />
                Confirm
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Modal wrapper for fullscreen modal presentation
interface CommandPreviewModalProps extends CommandPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPreviewModal: React.FC<CommandPreviewModalProps> = ({
  isOpen,
  onClose,
  ...props
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <CommandPreview {...props} onCancel={onClose} />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
