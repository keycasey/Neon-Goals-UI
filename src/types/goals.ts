export type GoalType = 'item' | 'finance' | 'action' | 'group';
export type GoalStatus = 'active' | 'completed' | 'archived';
export type GroupLayout = 'grid' | 'list' | 'kanban';
export type ProgressType = 'average' | 'sum' | 'manual';
export type ItemStatusBadge =
  | 'in-stock' | 'in_stock'
  | 'price-drop' | 'price_drop'
  | 'pending-search' | 'pending_search'
  | 'candidates_found'
  | 'not_found'
  | 'not_supported';

export type ScrapeJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ScrapeJob {
  id: string;
  goalId: string;
  status: ScrapeJobStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  results?: any;
}

export interface Goal {
  id: string;
  type: GoalType;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: GoalStatus;
  targetDate?: Date;
  parentGoalId?: string;  // ID of parent goal if this is a subgoal
  subgoals?: Goal[];      // Array of subgoals (populated when fetching goals)
}

export interface ItemGoal extends Goal {
  type: 'item';
  productImage: string;
  bestPrice: number;
  currency: string;
  retailerUrl: string;
  retailerName: string;
  statusBadge: ItemStatusBadge;
  searchResults?: ProductSearchResult[];
  // Candidate stack for Tinder-style swiping
  candidates?: ProductCandidate[];
  selectedCandidateId?: string; // The "winner" candidate (Primary)
  shortlistedCandidates?: ProductCandidate[]; // Full objects with shortlistedAt timestamp
  deniedCandidates?: ProductCandidate[]; // Full objects with deniedAt timestamp
  // Card stacking support
  stackId?: string; // Goals with same stackId are grouped together
  stackOrder?: number; // Order within the stack (0 = front)
  // Search parameters - backend builds retailerFilters based on searchTerm
  searchTerm?: string;
  retailerFilters?: Record<string, any>;
}

export interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  retailer: string;
  url: string;
  image: string;
}

// Candidate for Tinder-style swiping in Item Goals
export interface ProductCandidate extends ProductSearchResult {
  condition?: 'new' | 'used' | 'refurbished';
  rating?: number;
  reviewCount?: number;
  priceHistory?: number[]; // For showing price trends
  savings?: number; // Compared to MSRP
  inStock?: boolean;
  estimatedDelivery?: string;
  features?: string[];
}

export interface FinanceGoal extends Goal {
  type: 'finance';
  institutionIcon: string;
  accountName: string;
  currentBalance: number;
  targetBalance: number;
  currency: string;
  progressHistory: number[];
  lastSync: Date;
}

export interface ActionGoal extends Goal {
  type: 'action';
  completionPercentage: number;
  tasks: ActionTask[];
  motivation?: string;
}

export interface ActionTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface GroupGoal extends Goal {
  type: 'group';
  icon?: string;
  color?: string;
  layout: GroupLayout;
  progressType: ProgressType;
  progress: number;  // Calculated from children
  subgoals: Goal[];  // Can contain any goal type including other groups
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  // GitHub-specific fields
  githubLogin?: string;
  githubBio?: string | null;
  githubLocation?: string | null;
  githubBlog?: string | null;
}

export interface Settings {
  theme: 'miami-vice' | 'cyberpunk' | 'synthwave';
  chatModel: string;
  displayName: string;
}

export type ProposalType = 'confirm_edit_cancel' | 'accept_decline';

export interface ExtractionInfo {
  groupId: string;
  urls: string[];
  streamUrl: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  goalPreview?: string;
  awaitingConfirmation?: boolean;
  proposalType?: ProposalType;
  commands?: Array<{ type: string; data: any }>;
  extraction?: ExtractionInfo;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export type GoalCategory = 'all' | 'items' | 'finances' | 'actions' | 'groups';
export type ViewMode = 'list' | 'card';
