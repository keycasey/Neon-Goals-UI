export type GoalType = 'item' | 'finance' | 'action';
export type GoalStatus = 'active' | 'completed' | 'archived';
export type ItemStatusBadge = 'in-stock' | 'price-drop' | 'pending-search' | 'in_stock' | 'price_drop' | 'pending_search';

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
  selectedCandidateId?: string; // The "winner" candidate
  // Card stacking support
  stackId?: string; // Goals with same stackId are grouped together
  stackOrder?: number; // Order within the stack (0 = front)
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

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  goalPreview?: string;
  awaitingConfirmation?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export type GoalCategory = 'all' | 'items' | 'finances' | 'actions';
export type ViewMode = 'list' | 'card';
