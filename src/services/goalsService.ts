import { apiClient } from './apiClient';

// Transform backend response to frontend format
function transformGoal(goal: any, subgoals: any[] = []): any {
  if (!goal) return goal;

  // Flatten nested data based on goal type
  if (goal.type === 'item' && goal.itemData) {
    // Extract searchFilters from itemData, falling back to goal level, then empty object
    // Use nullish coalescing to preserve null/undefined vs empty object distinction
    const itemDataSearchFilters = goal.itemData.searchFilters ?? goal.searchFilters ?? {};

    // Debug logging for candidates
    console.log('[transformGoal] Item goal:', {
      goalId: goal.id,
      goalTitle: goal.title,
      candidatesCount: goal.itemData.candidates?.length || 0,
      candidates: goal.itemData.candidates,
      shortlistedCount: goal.itemData.shortlistedCandidates?.length || 0,
      deniedCount: goal.itemData.deniedCandidates?.length || 0,
      selectedCandidateId: goal.itemData.selectedCandidateId,
    });

    return {
      ...goal,
      subgoals,
      productImage: goal.itemData.productImage,
      bestPrice: goal.itemData.bestPrice,
      currency: goal.itemData.currency,
      retailerUrl: goal.itemData.retailerUrl,
      retailerName: goal.itemData.retailerName,
      statusBadge: goal.itemData.statusBadge,
      searchResults: goal.itemData.searchResults,
      candidates: goal.itemData.candidates,
      selectedCandidateId: goal.itemData.selectedCandidateId,
      shortlistedCandidates: goal.itemData.shortlistedCandidates,
      deniedCandidates: goal.itemData.deniedCandidates,
      category: goal.itemData.category,
      searchTerm: goal.itemData.searchTerm,
      retailerFilters: goal.itemData.retailerFilters,
      // Search filters - set after spread to avoid being overwritten
      searchFilters: itemDataSearchFilters,
      // Vehicle filters (JSONB field for flexible vehicle data)
      vehicleFilters: goal.itemData.vehicleFilters,
    };
  }

  if (goal.type === 'finance' && goal.financeData) {
    return {
      ...goal,
      subgoals,
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
      subgoals,
      completionPercentage: goal.actionData.completionPercentage,
      tasks: goal.actionData.tasks || [],
    };
  }

  return {
    ...goal,
    subgoals,
  };
}

// Build parent-child relationships from flat array of goals
function buildGoalRelationships(goals: any[]): any[] {
  // Create a map for quick lookup
  const goalsMap = new Map<string, any>();
  const parentGoals: any[] = [];
  const childGoals: any[] = [];

  // Separate parent and child goals
  goals.forEach((goal: any) => {
    if (goal.parentGoalId) {
      childGoals.push(goal);
    } else {
      parentGoals.push(goal);
    }
    goalsMap.set(goal.id, goal);
  });

  // Build subgoals arrays for parent goals
  childGoals.forEach((childGoal) => {
    const parent = goalsMap.get(childGoal.parentGoalId);
    if (parent) {
      // Transform the child goal (subgoals won't have their own subgoals in this simple approach)
      const transformedChild = transformGoal(childGoal, []);
      if (!parent.subgoals) {
        parent.subgoals = [];
      }
      parent.subgoals.push(transformedChild);
    }
  });

  // Transform all parent goals with their subgoals
  return parentGoals.map((goal) => {
    const subgoals = goal.subgoals || [];
    console.log('[buildGoalRelationships] Parent goal:', {
      id: goal.id,
      title: goal.title,
      subgoalsCount: subgoals.length,
      subgoals: subgoals.map((s: any) => ({ id: s.id, title: s.title })),
    });
    return transformGoal(goal, subgoals);
  });
}

export const goalsService = {
  async getAll(filters?: { type?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params}` : '';
    const response = await apiClient.get(`/goals${query}`);
    // Build parent-child relationships from flat array
    if (Array.isArray(response)) {
      return buildGoalRelationships(response);
    }
    return transformGoal(response);
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

  // Refresh candidates for item goals
  async refreshCandidates(goalId: string) {
    const response = await apiClient.post(`/goals/${goalId}/refresh-candidates`);
    return response;
  },

  // Get scrape jobs for polling
  async getScrapeJobs(goalId: string) {
    return apiClient.get(`/goals/${goalId}/scrape-jobs`);
  },

  // Update search filters for item goals
  async updateSearchFilters(goalId: string, searchFilters: any) {
    return apiClient.patch(`/goals/${goalId}/item`, { searchFilters });
  },
};
