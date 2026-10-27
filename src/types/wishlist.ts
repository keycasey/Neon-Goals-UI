export type WishlistPriority = 'someday' | 'interested' | 'soon';
export type WishlistStage = 'idea' | 'researching' | 'saving' | 'ready' | 'purchased' | 'dropped';

export interface WishlistItem {
  id: string;
  title: string;
  notes?: string | null;
  targetBudget?: number | null;
  currency: string;
  priority: WishlistPriority;
  stage: WishlistStage;
  earliestPurchaseDate?: string | null;
  linkedGoalId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWishlistItemInput {
  title: string;
  notes?: string;
  targetBudget?: number;
  priority?: WishlistPriority;
  earliestPurchaseDate?: string;
}
