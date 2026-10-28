/**
 * Redirect command parser
 * Parses REDIRECT_TO_CATEGORY, REDIRECT_TO_GOAL, REDIRECT_TO_OVERVIEW commands
 * from agent response messages.
 */

import type { Message } from '@/types/goals';

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

const normalizeTarget = (value: unknown): RedirectTarget | null => {
  if (typeof value === 'string') {
    if (value === 'overview') return { type: 'overview' };

    const [kind, rawId] = value.split(':', 2);
    if (kind === 'category' && rawId && ['items', 'finances', 'actions'].includes(rawId)) {
      return { type: 'category', categoryId: rawId as 'items' | 'finances' | 'actions' };
    }
    if (kind === 'goal' && rawId) {
      return { type: 'goal', goalId: rawId };
    }
    return null;
  }

  if (!value || typeof value !== 'object') return null;

  const target = value as Record<string, unknown>;

  if (target.type === 'overview') {
    return { type: 'overview' };
  }

  if (target.type === 'category' && typeof target.categoryId === 'string' && ['items', 'finances', 'actions'].includes(target.categoryId)) {
    return { type: 'category', categoryId: target.categoryId as 'items' | 'finances' | 'actions' };
  }

  if (target.type === 'goal' && typeof target.goalId === 'string' && target.goalId) {
    return { type: 'goal', goalId: target.goalId };
  }

  if (typeof target.categoryId === 'string' && ['items', 'finances', 'actions'].includes(target.categoryId)) {
    return { type: 'category', categoryId: target.categoryId as 'items' | 'finances' | 'actions' };
  }

  if (typeof target.goalId === 'string' && target.goalId) {
    return { type: 'goal', goalId: target.goalId };
  }

  if (target.redirectTarget) {
    return normalizeTarget(target.redirectTarget);
  }

  return null;
};

const normalizeRedirectProposal = (value: unknown): ParsedRedirect | null => {
  if (!value || typeof value !== 'object') return null;

  const proposal = value as Record<string, unknown>;
  const target = normalizeTarget(proposal.target ?? proposal.redirectTarget ?? proposal.destination);
  if (!target) return null;

  const message = typeof proposal.message === 'string' && proposal.message
    ? proposal.message
    : 'Let me redirect you.';

  let label = typeof proposal.label === 'string' && proposal.label ? proposal.label : '';
  if (!label) {
    if (target.type === 'category') {
      label = CATEGORY_LABELS[target.categoryId] || target.categoryId;
    } else if (target.type === 'goal') {
      label = typeof proposal.goalTitle === 'string' ? proposal.goalTitle : 'Goal view';
    } else {
      label = 'Overview';
    }
  }

  return { target, message, label };
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
 * Resolve redirect metadata from an assistant message.
 * Explicit redirectProposal metadata wins; legacy command text is the fallback.
 */
export function resolveMessageRedirect(message: Pick<Message, 'content' | 'redirectProposal' | 'metadata'>): ParsedRedirect | null {
  const redirectTarget = message.metadata?.redirectTarget ?? message.metadata?.redirect_target;
  const metadataRedirect = normalizeRedirectProposal(
    message.redirectProposal
      ?? message.metadata?.redirectProposal
      ?? (redirectTarget ? { redirectTarget } : undefined),
  );

  if (metadataRedirect) return metadataRedirect;

  return parseRedirectCommand(message.content);
}

/**
 * Strip the redirect command line from message text,
 * returning only the conversational portion.
 */
export function stripRedirectCommand(responseText: string): string {
  return responseText.replace(REDIRECT_REGEX, '').trim();
}
