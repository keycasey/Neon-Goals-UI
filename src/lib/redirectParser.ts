/**
 * Redirect command parser
 * Parses REDIRECT_TO_CATEGORY, REDIRECT_TO_GOAL, REDIRECT_TO_OVERVIEW commands
 * from agent response messages.
 */

export type RedirectTarget =
  | { type: 'category'; categoryId: 'items' | 'finances' | 'actions' }
  | { type: 'goal'; goalId: string }
  | { type: 'overview' };

export interface ParsedRedirect {
  target: RedirectTarget;
  message: string;
  label: string; // Human-readable label for the target (e.g. "Items specialist")
}

const REDIRECT_REGEX = /^(REDIRECT_TO_CATEGORY|REDIRECT_TO_GOAL|REDIRECT_TO_OVERVIEW):\s*(\{.*\})$/m;

const CATEGORY_LABELS: Record<string, string> = {
  items: 'Items specialist',
  finances: 'Finance specialist',
  actions: 'Actions specialist',
};

/**
 * Parse a redirect command from an agent message.
 * Returns null if no redirect command is found.
 */
export function parseRedirectCommand(responseText: string): ParsedRedirect | null {
  const match = responseText.match(REDIRECT_REGEX);
  if (!match) return null;

  const [, command, jsonStr] = match;

  try {
    const data = JSON.parse(jsonStr);
    const message = typeof data.message === 'string' ? data.message : 'Let me redirect you.';

    switch (command) {
      case 'REDIRECT_TO_CATEGORY': {
        const categoryId = data.categoryId;
        if (!['items', 'finances', 'actions'].includes(categoryId)) return null;
        return {
          target: { type: 'category', categoryId },
          message,
          label: CATEGORY_LABELS[categoryId] || categoryId,
        };
      }
      case 'REDIRECT_TO_GOAL': {
        const goalId = data.goalId;
        if (typeof goalId !== 'string' || !goalId) return null;
        return {
          target: { type: 'goal', goalId },
          message,
          label: data.goalTitle || 'Goal view',
        };
      }
      case 'REDIRECT_TO_OVERVIEW':
        return {
          target: { type: 'overview' },
          message,
          label: 'Overview',
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Strip the redirect command line from message text,
 * returning only the conversational portion.
 */
export function stripRedirectCommand(responseText: string): string {
  return responseText.replace(REDIRECT_REGEX, '').trim();
}
