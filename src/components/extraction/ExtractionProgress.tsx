import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, ExternalLink, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExtractionProgress, ExtractionResult } from '@/services/extractionService';

interface ExtractionProgressProps {
  urls: string[];
  progress: Map<string, ExtractionProgress>;
  results: ExtractionResult[];
  isComplete: boolean;
  isCreatingGoals: boolean;
  onDismiss?: () => void;
}

const getStatusIcon = (status: ExtractionProgress['status']) => {
  switch (status) {
    case 'started':
    case 'in_progress':
      return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    case 'complete':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-destructive" />;
    default:
      return <Package className="w-4 h-4 text-muted-foreground" />;
  }
};

const getStatusColor = (status: ExtractionProgress['status']) => {
  switch (status) {
    case 'started':
    case 'in_progress':
      return 'border-primary/50 bg-primary/10';
    case 'complete':
      return 'border-green-500/50 bg-green-500/10';
    case 'error':
      return 'border-destructive/50 bg-destructive/10';
    default:
      return 'border-border/50 bg-muted/50';
  }
};

export const ExtractionProgressUI: React.FC<ExtractionProgressProps> = ({
  urls,
  progress,
  results,
  isComplete,
  isCreatingGoals,
  onDismiss,
}) => {
  const completedCount = results.filter((r) => r.success).length;
  const errorCount = results.filter((r) => !r.success).length;
  const pendingCount = urls.length - results.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm p-4 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">
            {isComplete ? 'Extraction Complete' : 'Extracting Products...'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            ✓ {completedCount}
          </span>
          {errorCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
              ✗ {errorCount}
            </span>
          )}
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {pendingCount} pending
            </span>
          )}
        </div>
      </div>

      {/* URL List */}
      <div className="space-y-2">
        {urls.map((url, index) => {
          const urlProgress = Array.from(progress.values()).find(
            (p) => p.url === url
          );
          const urlResult = results.find((r) => r.url === url);
          const status = urlProgress?.status || (urlResult ? 'complete' : 'started');
          const hostname = (() => {
            try {
              return new URL(url).hostname;
            } catch {
              return url;
            }
          })();

          return (
            <motion.div
              key={url}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg border transition-all',
                getStatusColor(status)
              )}
            >
              {getStatusIcon(status)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {urlResult?.name || hostname}
                  </span>
                  {urlResult?.price !== null && urlResult?.price !== undefined && (
                    <span className="text-sm text-green-500 font-medium">
                      ${urlResult.price.toFixed(2)}
                    </span>
                  )}
                </div>
                {status === 'in_progress' && urlProgress?.message && (
                  <p className="text-xs text-muted-foreground truncate">
                    {urlProgress.message}
                  </p>
                )}
                {status === 'error' && urlResult?.error && (
                  <p className="text-xs text-destructive truncate">
                    {urlResult.error}
                  </p>
                )}
              </div>

              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {/* Product Image Preview */}
              {urlResult?.imageUrl && (
                <img
                  src={urlResult.imageUrl}
                  alt={urlResult.name || 'Product'}
                  className="w-10 h-10 rounded object-cover border border-border/50"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      {isComplete && !isCreatingGoals && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between"
        >
          <span className="text-sm text-muted-foreground">
            Extracted {completedCount} of {urls.length} products
          </span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Dismiss
            </button>
          )}
        </motion.div>
      )}

      {/* Creating Goals State */}
      {isCreatingGoals && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Creating goals...
        </div>
      )}
    </motion.div>
  );
};

export default ExtractionProgressUI;
