import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, ExternalLink, Check, X as XIcon, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ManagedCandidate } from '@/types/candidates';

interface CompareViewProps {
  primary: ManagedCandidate | null;
  shortlist: ManagedCandidate[];
  onPromote: (candidate: ManagedCandidate) => void;
  onRemove: (candidate: ManagedCandidate) => void;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

export const CompareView: React.FC<CompareViewProps> = ({
  primary,
  shortlist,
  onPromote,
  onRemove,
}) => {
  // Find best values for highlighting
  const allCandidates = primary ? [primary, ...shortlist] : shortlist;
  const lowestPrice = Math.min(...allCandidates.map(c => c.price));
  const highestRating = Math.max(...allCandidates.map(c => c.rating || 0));
  const fastestDelivery = allCandidates.find(c => 
    c.estimatedDelivery?.toLowerCase().includes('same day') ||
    c.estimatedDelivery?.toLowerCase().includes('pickup')
  );

  if (!primary && shortlist.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">No Candidates to Compare</p>
          <p className="text-sm text-muted-foreground">
            Add items to your shortlist to compare them
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6">
      {/* Primary Section */}
      {primary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig}
          className="mb-6"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            PRIMARY SELECTION
          </h3>
          <PrimaryCard candidate={primary} />
        </motion.div>
      )}

      {/* Comparison Table */}
      {shortlist.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.1 }}
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-warning" />
            THE BENCH ({shortlist.length})
          </h3>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Item</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Price</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Rating</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Condition</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Delivery</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shortlist.map((candidate, index) => (
                    <CompareRow
                      key={candidate.id}
                      candidate={candidate}
                      isLowestPrice={candidate.price === lowestPrice}
                      isHighestRating={candidate.rating === highestRating}
                      isFastestDelivery={candidate.id === fastestDelivery?.id}
                      onPromote={() => onPromote(candidate)}
                      onRemove={() => onRemove(candidate)}
                      index={index}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Primary Card Component
interface PrimaryCardProps {
  candidate: ManagedCandidate;
}

const PrimaryCard: React.FC<PrimaryCardProps> = ({ candidate }) => {
  return (
    <div className="glass-card rounded-xl overflow-hidden neon-border">
      <div className="flex flex-col lg:flex-row">
        {/* Image */}
        <div className="lg:w-48 h-48 lg:h-auto overflow-hidden">
          <img
            src={candidate.image}
            alt={candidate.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">INSTALLED</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">
                {candidate.name}
              </h3>
              <p className="text-sm text-muted-foreground">{candidate.retailer}</p>
            </div>
            <p className="text-3xl font-heading font-bold neon-text-cyan">
              ${candidate.price.toLocaleString()}
            </p>
          </div>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Condition</p>
              <p className={cn(
                "text-sm font-medium capitalize",
                candidate.condition === 'new' && "text-success",
                candidate.condition === 'refurbished' && "text-warning",
                candidate.condition === 'used' && "text-muted-foreground"
              )}>
                {candidate.condition || 'N/A'}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="text-sm font-medium text-warning flex items-center gap-1">
                <Star className="w-3 h-3 fill-current" />
                {candidate.rating || 'N/A'}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Delivery</p>
              <p className="text-sm font-medium text-foreground">
                {candidate.estimatedDelivery || 'N/A'}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Stock</p>
              <p className={cn(
                "text-sm font-medium",
                candidate.inStock ? "text-success" : "text-destructive"
              )}>
                {candidate.inStock ? 'In Stock' : 'Out of Stock'}
              </p>
            </div>
          </div>

          {/* View Button */}
          <a
            href={candidate.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View on {candidate.retailer}
          </a>
        </div>
      </div>
    </div>
  );
};

// Comparison Row Component
interface CompareRowProps {
  candidate: ManagedCandidate;
  isLowestPrice: boolean;
  isHighestRating: boolean;
  isFastestDelivery: boolean;
  onPromote: () => void;
  onRemove: () => void;
  index: number;
}

const CompareRow: React.FC<CompareRowProps> = ({
  candidate,
  isLowestPrice,
  isHighestRating,
  isFastestDelivery,
  onPromote,
  onRemove,
  index,
}) => {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-border/30 last:border-b-0 hover:bg-muted/20 transition-colors"
    >
      <td className="p-3">
        <div className="flex items-center gap-3">
          <img
            src={candidate.image}
            alt={candidate.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div>
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {candidate.name}
            </p>
            <p className="text-xs text-muted-foreground">{candidate.retailer}</p>
          </div>
        </div>
      </td>
      <td className="p-3">
        <span className={cn(
          "text-sm font-bold",
          isLowestPrice ? "neon-text-cyan" : "text-muted-foreground"
        )}>
          ${candidate.price.toLocaleString()}
        </span>
        {isLowestPrice && (
          <span className="ml-2 text-xs text-primary">BEST</span>
        )}
      </td>
      <td className="p-3">
        <span className={cn(
          "text-sm flex items-center gap-1",
          isHighestRating ? "text-warning font-medium" : "text-muted-foreground"
        )}>
          <Star className={cn("w-3 h-3", isHighestRating && "fill-current")} />
          {candidate.rating || '-'}
        </span>
      </td>
      <td className="p-3">
        <span className={cn(
          "text-xs px-2 py-0.5 rounded capitalize",
          candidate.condition === 'new' && "bg-success/20 text-success",
          candidate.condition === 'refurbished' && "bg-warning/20 text-warning",
          candidate.condition === 'used' && "bg-muted text-muted-foreground"
        )}>
          {candidate.condition || 'N/A'}
        </span>
      </td>
      <td className="p-3">
        <span className={cn(
          "text-xs",
          isFastestDelivery ? "text-success font-medium" : "text-muted-foreground"
        )}>
          {candidate.estimatedDelivery || 'N/A'}
        </span>
      </td>
      <td className="p-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onPromote}
            className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            title="Promote to Primary"
          >
            <Crown className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
            title="Remove"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
};

export default CompareView;
