import { apiClient } from './apiClient';
import type { CreateWishlistItemInput, WishlistItem } from '@/types/wishlist';

export const wishlistService = {
  getAll: () => apiClient.get('/wishlist') as Promise<WishlistItem[]>,
  create: (data: CreateWishlistItemInput) =>
    apiClient.post('/wishlist', data) as Promise<WishlistItem>,
  update: (id: string, data: Partial<WishlistItem>) =>
    apiClient.patch(`/wishlist/${id}`, data) as Promise<WishlistItem>,
  remove: (id: string) => apiClient.delete(`/wishlist/${id}`),
};
