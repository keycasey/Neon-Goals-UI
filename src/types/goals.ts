export type GoalType = 'item' | 'finance' | 'action';
export type GoalStatus = 'active' | 'completed' | 'archived';
export type ItemStatusBadge = 'in-stock' | 'price-drop' | 'pending-search';

export interface Goal {
  id: string;
  type: GoalType;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  status: GoalStatus;
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
}

export interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  retailer: string;
  url: string;
  image: string;
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
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export type GoalCategory = 'all' | 'items' | 'finances' | 'actions';
export type ViewMode = 'list' | 'card';
