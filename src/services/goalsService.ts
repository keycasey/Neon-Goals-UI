import { apiClient } from './apiClient';

// Transform backend response to frontend format
function transformGoal(goal: any): any {
  if (!goal) return goal;

  // Flatten nested data based on goal type
  if (goal.type === 'item' && goal.itemData) {
    return {
      ...goal,
      productImage: goal.itemData.productImage,
      bestPrice: goal.itemData.bestPrice,
      currency: goal.itemData.currency,
      retailerUrl: goal.itemData.retailerUrl,
      retailerName: goal.itemData.retailerName,
      statusBadge: goal.itemData.statusBadge,
      searchResults: goal.itemData.searchResults,
    };
  }

  if (goal.type === 'finance' && goal.financeData) {
    return {
      ...goal,
      institutionIcon: goal.financeData.institutionIcon,
      accountName: goal.financeData.accountName,
      currentBalance: goal.financeData.currentBalance,
      targetBalance: goal.financeData.targetBalance,
      currency: goal.financeData.currency,
      progressHistory: goal.financeData.progressHistory,
      lastSync: goal.financeData.lastSync,
    };
  }

  if (goal.type === 'action' && goal.actionData) {
    return {
      ...goal,
      completionPercentage: goal.actionData.completionPercentage,
      tasks: goal.actionData.tasks || [],
    };
  }

  return goal;
}

export const goalsService = {
  async getAll(filters?: { type?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params}` : '';
    const response = await apiClient.get(`/goals${query}`);
    // Transform each goal to flatten nested data
    const transformed = Array.isArray(response) ? response.map(transformGoal) : transformGoal(response);
    return transformed;
  },

  async getOne(id: string) {
    const response = await apiClient.get(`/goals/${id}`);
    return transformGoal(response);
  },

  async createItemGoal(data: any) {
    const response = await apiClient.post('/goals/item', data);
    return transformGoal(response);
  },

  async createFinanceGoal(data: any) {
    const response = await apiClient.post('/goals/finance', data);
    return transformGoal(response);
  },

  async createActionGoal(data: any) {
    const response = await apiClient.post('/goals/action', data);
    return transformGoal(response);
  },

  async update(id: string, data: any) {
    const response = await apiClient.patch(`/goals/${id}`, data);
    return transformGoal(response);
  },

  async updateItemGoal(id: string, data: any) {
    const response = await apiClient.patch(`/goals/${id}/item`, data);
    return transformGoal(response);
  },

  async updateFinanceGoal(id: string, data: any) {
    const response = await apiClient.patch(`/goals/${id}/finance`, data);
    return transformGoal(response);
  },

  async updateActionGoal(id: string, data: any) {
    const response = await apiClient.patch(`/goals/${id}/action`, data);
    return transformGoal(response);
  },

  async archive(id: string) {
    const response = await apiClient.patch(`/goals/${id}/archive`);
    return transformGoal(response);
  },

  async delete(id: string) {
    return apiClient.delete(`/goals/${id}`);
  },

  // Task operations
  async createTask(goalId: string, data: { title: string }) {
    return apiClient.post(`/goals/${goalId}/tasks`, data);
  },

  async toggleTask(goalId: string, taskId: string) {
    return apiClient.patch(`/goals/${goalId}/tasks/${taskId}/toggle`);
  },

  async deleteTask(goalId: string, taskId: string) {
    return apiClient.delete(`/goals/${goalId}/tasks/${taskId}`);
  },
};
