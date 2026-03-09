/**
 * Shared type definitions for Zustand stores
 * These types are used across multiple stores and components
 */

/**
 * Chat command types that can be executed by the AI
 * These commands are sent from the backend and executed on the frontend
 */
export interface ChatCommand {
  type: 'ADD_TASK' | 'TOGGLE_TASK' | 'UPDATE_TITLE' | 'UPDATE_SEARCHTERM' | 'REFRESH_CANDIDATES' | 'ARCHIVE_GOAL' | 'CREATE_GOAL' | 'CREATE_SUBGOAL' | 'UPDATE_PROGRESS' | 'UPDATE_FILTERS' | 'REDIRECT_TO_CATEGORY' | 'REDIRECT_TO_GOAL' | 'REDIRECT_TO_OVERVIEW';
  goalId?: string;
  data: any;
}

/**
 * State for pending commands that await user confirmation
 * Used when AI proposes changes that require user approval
 */
export interface PendingCommandsState {
  chatId: string;
  commands: ChatCommand[];
  timestamp: number;
}
