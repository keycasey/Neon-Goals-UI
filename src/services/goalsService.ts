import { apiClient } from './apiClient';
import type { ActionGoal, FinanceGoal, Goal, GoalType, ItemGoal, ScrapeJob } from '@/types/goals';

type BackendItemData = Partial<ItemGoal> & {
  searchFilters?: Record<string, unknown>;
  vehicleFilters?: Record<string, unknown>;
};

interface BackendGoal extends Record<string, unknown> {
  id: string;
  type: GoalType;
  parentGoalId?: string;
  subgoals?: Goal[];
  itemData?: BackendItemData;
  financeData?: Partial<FinanceGoal>;
  actionData?: Partial<ActionGoal>;
  searchFilters?: Record<string, unknown>;
}

// Transform backend response to frontend format
function transformGoal(goal: BackendGoal, subgoals: Goal[] = []): Goal {
  if (!goal) throw new Error('Goal response was empty');

  // Flatten nested data based on goal type
  if (goal.type === 'item' && goal.itemData) {
    // Extract searchFilters from itemData, falling back to goal level, then empty object
    // Use nullish coalescing to preserve null/undefined vs empty object distinction
    const itemDataSearchFilters = goal.itemData.searchFilters ?? goal.searchFilters ?? {};

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
    } as unknown as ItemGoal;
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
    } as unknown as FinanceGoal;
  }

  if (goal.type === 'action' && goal.actionData) {
    return {
      ...goal,
      subgoals,
      completionPercentage: goal.actionData.completionPercentage,
      tasks: goal.actionData.tasks || [],
    } as unknown as ActionGoal;
  }

  return {
    ...goal,
    subgoals,
  } as unknown as Goal;
}

// Build parent-child relationships from flat array of goals
function buildGoalRelationships(goals: BackendGoal[]): Goal[] {
  // Create a map for quick lookup
  const goalsMap = new Map<string, BackendGoal>();
  const parentGoals: BackendGoal[] = [];
  const childGoals: BackendGoal[] = [];

  // Separate parent and child goals
  goals.forEach((goal) => {
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
    return transformGoal(goal, subgoals);
  });
}

export const goalsService = {
  async getAll(filters?: { type?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params}` : '';
    const response = await apiClient.get<BackendGoal[]>(`/goals${query}`);
    // Build parent-child relationships from flat array
    if (Array.isArray(response)) {
      return buildGoalRelationships(response);
    }
    throw new Error('Goals response was not an array');
  },

  async getOne(id: string) {
    const response = await apiClient.get<BackendGoal>(`/goals/${id}`);
    return transformGoal(response);
  },

  async createItemGoal(data: unknown) {
    const response = await apiClient.post<BackendGoal>('/goals/item', data);
    return transformGoal(response);
  },

  async createFinanceGoal(data: unknown) {
    const response = await apiClient.post<BackendGoal>('/goals/finance', data);
    return transformGoal(response);
  },

  async createActionGoal(data: unknown) {
    const response = await apiClient.post<BackendGoal>('/goals/action', data);
    return transformGoal(response);
  },

  async update(id: string, data: unknown) {
    const response = await apiClient.patch<BackendGoal>(`/goals/${id}`, data);
    return transformGoal(response);
  },

  async updateItemGoal(id: string, data: unknown) {
    const response = await apiClient.patch<BackendGoal>(`/goals/${id}/item`, data);
    return transformGoal(response);
  },

  async updateFinanceGoal(id: string, data: unknown) {
    const response = await apiClient.patch<BackendGoal>(`/goals/${id}/finance`, data);
    return transformGoal(response);
  },

  async updateActionGoal(id: string, data: unknown) {
    const response = await apiClient.patch<BackendGoal>(`/goals/${id}/action`, data);
    return transformGoal(response);
  },

  async archive(id: string) {
    const response = await apiClient.patch<BackendGoal>(`/goals/${id}/archive`);
    return transformGoal(response);
  },

  async delete(id: string) {
    return apiClient.delete(`/goals/${id}`);
  },

  // Task operations
  async createTask(goalId: string, data: { title: string; scheduledFor?: string }) {
    return apiClient.post(`/goals/${goalId}/tasks`, data);
  },

  async toggleTask(goalId: string, taskId: string) {
    return apiClient.patch(`/goals/${goalId}/tasks/${taskId}/toggle`);
  },

  async updateTask(
    goalId: string,
    taskId: string,
    data: { title?: string; completed?: boolean; scheduledFor?: string | null },
  ) {
    return apiClient.patch(`/goals/${goalId}/tasks/${taskId}`, data);
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
    return apiClient.get<ScrapeJob[]>(`/goals/${goalId}/scrape-jobs`);
  },

  // Update search filters for item goals
  async updateSearchFilters(goalId: string, searchFilters: Record<string, unknown>) {
    return apiClient.patch(`/goals/${goalId}/item`, { searchFilters });
  },
};
