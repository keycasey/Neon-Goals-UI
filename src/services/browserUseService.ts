import { apiClient } from './apiClient';

export interface ProductSearchResult {
  title: string;
  price: number;
  currency: string;
  retailer: string;
  productUrl: string;
  imageUrl: string;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface BestPriceResponse {
  product: ProductSearchResult;
  alternatives: ProductSearchResult[];
}

export const browserUseService = {
  /**
   * Search for products across multiple retailers
   */
  async searchProducts(query: string, options?: {
    maxResults?: number;
    retailers?: string[];
    budget?: number;
  }): Promise<ProductSearchResult[]> {
    return apiClient.post('/browser-use/search', { query, options });
  },

  /**
   * Get best price for a specific product
   */
  async getBestPrice(productName: string): Promise<BestPriceResponse> {
    return apiClient.post('/browser-use/best-price', { productName });
  },

  /**
   * Search for products and update an ItemGoal with the results
   */
  async searchAndUpdateGoal(goalId: string, query?: string): Promise<any> {
    return apiClient.post(`/browser-use/search-and-update/${goalId}`, { query });
  },

  /**
   * Monitor prices for an ItemGoal
   */
  async monitorPrice(goalId: string): Promise<ProductSearchResult[]> {
    return apiClient.post(`/browser-use/monitor-price/${goalId}`, {});
  },
};
