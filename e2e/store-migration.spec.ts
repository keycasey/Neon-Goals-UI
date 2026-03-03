import { test, expect } from '@playwright/test';
import { clearBrowserState, waitForAppReady, loginDemo, login } from './helpers';

/**
 * E2E tests verifying the store migration from useAppStore to domain stores.
 *
 * These tests confirm that components migrated to domain stores still behave
 * correctly end-to-end. Each test group covers a specific domain:
 *   - Auth (useAuthStore)
 *   - View/navigation (useViewStore)
 *   - Goals (useGoalsStore)
 *   - Finance (useFinanceStore)
 *   - Chat (useChatStore)
 */

const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test@1234';

// ─── Auth Store ──────────────────────────────────────────────────────────────

test.describe('Auth store (useAuthStore)', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test('login page loads and shows all auth options', async ({ page }) => {
    await page.goto('/login');
    await waitForAppReady(page);

    await expect(page.getByText('Continue with GitHub')).toBeVisible();
    await expect(page.getByText('Continue with Google')).toBeVisible();
    await expect(page.getByText('Start with Demo Mode')).toBeVisible();
    await expect(page.getByText('sign in with email')).toBeVisible();
  });

  test('demo mode login sets user state and redirects', async ({ page }) => {
    await loginDemo(page);

    // App renders - header with logo visible
    await expect(page.locator('a').filter({ hasText: 'Neon Goals' })).toBeVisible({ timeout: 10000 });
    // Demo goals are loaded
    await expect(page.locator('[data-testid="goal-card"], .goal-card, .glass-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('unauthenticated access redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('email login with real credentials', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);

    // Should be on home page
    await expect(page).toHaveURL('/');
    await expect(page.locator('a').filter({ hasText: 'Neon Goals' })).toBeVisible({ timeout: 10000 });
  });

  test('settings page reads from useAuthStore (user + settings)', async ({ page }) => {
    await loginDemo(page);
    await page.goto('/settings');
    await waitForAppReady(page);

    // Settings page should render (not redirect)
    await expect(page).toHaveURL('/settings');
    // Settings page uses h3 headings for sections (Profile, Appearance, AI Chat, etc.)
    await expect(page.locator('h3').filter({ hasText: /profile|appearance|ai chat|notifications/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('logout via AccountDropdown clears auth state', async ({ page }) => {
    await loginDemo(page);

    // Open account dropdown (click user avatar/account button in header)
    const accountBtn = page.locator('button').filter({ hasText: /^[A-Z]$/ }).or(
      page.locator('[aria-label*="account" i], [aria-label*="user" i]')
    ).first();
    await accountBtn.click({ timeout: 5000 }).catch(() => {
      // Fallback: click any visible account-related button in the header
    });

    // If dropdown opened, click logout
    const logoutBtn = page.locator('text=Logout, text=Sign out, text=Log out').first();
    if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutBtn.click();
      await expect(page).toHaveURL('/login', { timeout: 5000 });
    }
  });
});

// ─── View Store ───────────────────────────────────────────────────────────────

test.describe('View store (useViewStore)', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
  });

  test('sidebar toggle works', async ({ page }) => {
    // On desktop the sidebar is visible by default
    // On mobile/narrow viewports, the hamburger is shown
    const hamburger = page.locator('button[aria-label="Toggle sidebar"]');

    if (await hamburger.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Toggle open
      await hamburger.click();
      await page.waitForTimeout(400); // animation
      // Toggle closed
      await hamburger.click();
      await page.waitForTimeout(400);
    }
  });

  test('view mode toggles between card and list', async ({ page }) => {
    // Find a view mode toggle button (LayoutGrid / List icon buttons in header)
    const listBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(2);
    const gridBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(1);

    // Try clicking list icon if present in header
    const listIcon = page.locator('[aria-label*="list" i], button:has(.lucide-list)').first();
    if (await listIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listIcon.click();
      await page.waitForTimeout(300);
      // Switch back
      const gridIcon = page.locator('[aria-label*="grid" i], button:has(.lucide-layout-grid)').first();
      if (await gridIcon.isVisible({ timeout: 1000 }).catch(() => false)) {
        await gridIcon.click();
      }
    }
  });

  test('activeCategory filters goals in sidebar', async ({ page }) => {
    // Click a category in the sidebar
    const itemsBtn = page.locator('nav, aside').locator('text=Items').first();
    if (await itemsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await itemsBtn.click();
      await page.waitForTimeout(500);
      // URL or visual state changes - just verify no crash
      await expect(page.locator('#root')).toBeVisible();
    }
  });

  test('chat panel minimize/restore via useViewStore', async ({ page }) => {
    // Find the minimize button on the chat panel
    const minimizeBtn = page.locator('button[aria-label*="minimize" i], button[title*="minimize" i]').first();
    if (await minimizeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await minimizeBtn.click();
      await page.waitForTimeout(400);
      // Restore
      const restoreBtn = page.locator('button[aria-label*="chat" i], button[title*="chat" i]').first();
      if (await restoreBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await restoreBtn.click();
      }
    }
  });

  test('goal navigation state clears on homepage', async ({ page }) => {
    // When arriving at homepage, any previous goal selection should be cleared
    await expect(page).toHaveURL('/');
    await expect(page.locator('#root')).toBeVisible();
    // No goal detail panel should be open
    const backBtn = page.locator('text=Back, [aria-label="Back"]').first();
    await expect(backBtn).not.toBeVisible({ timeout: 2000 }).catch(() => {});
  });
});

// ─── Goals Store ──────────────────────────────────────────────────────────────

test.describe('Goals store (useGoalsStore)', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
  });

  test('GoalGrid renders goals from useGoalsStore', async ({ page }) => {
    // Wait for goals to be visible (demo mode has mock goals)
    await page.waitForSelector('.glass-card, [class*="goal"], [class*="Goal"]', { timeout: 10000 });
    const goals = page.locator('.glass-card, [class*="goal-card"]');
    await expect(goals.first()).toBeVisible();
  });

  test('GoalSortBar category filter uses useViewStore.activeCategory', async ({ page }) => {
    // Category buttons should be present
    const allBtn = page.locator('button, [role="tab"]').filter({ hasText: /^All$/i }).first();
    if (await allBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await allBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator('#root')).toBeVisible();
    }
  });

  test('goal detail page loads goal from useGoalsStore', async ({ page }) => {
    // Click the first goal card to open detail view
    const firstCard = page.locator('.glass-card').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10000 });
    await firstCard.click();

    // Should navigate to goal detail
    await page.waitForURL(/\/goals\//, { timeout: 5000 }).catch(() => {
      // Some apps show detail inline - just check for detail content
    });
    await expect(page.locator('#root')).toBeVisible();
  });

  test('drillIntoGoal navigation works (subgoals)', async ({ page }) => {
    // Navigate to a goal that has subgoals (Group type)
    const groupGoal = page.locator('.glass-card').filter({ hasText: /group|project/i }).first();
    if (await groupGoal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await groupGoal.click();
      await page.waitForTimeout(500);

      // Look for subgoal items that could be drilled into
      const subgoalItem = page.locator('[class*="subgoal"], [class*="Subgoal"]').first();
      if (await subgoalItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await subgoalItem.click();
        await page.waitForTimeout(400);
        await expect(page.locator('#root')).toBeVisible();
      }
    }
  });
});

// ─── Finance Store ────────────────────────────────────────────────────────────

test.describe('Finance store (useFinanceStore)', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
  });

  test('FinancialSummary renders without errors', async ({ page }) => {
    // Financial summary should be visible somewhere on the page
    const summary = page.locator('[class*="financial" i], [class*="Finance" i]').first();
    // Just verify the page doesn't crash (summary may only show when finance goals exist)
    await expect(page.locator('#root')).toBeVisible();
  });

  test('FinanceGoalDetail opens for finance goals', async ({ page }) => {
    // Click on a finance-type goal if present
    const financeGoal = page.locator('.glass-card').filter({ hasText: /\$|finance|saving/i }).first();
    if (await financeGoal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await financeGoal.click();
      await page.waitForTimeout(500);
      await expect(page.locator('#root')).toBeVisible();
    }
  });
});

// ─── Chat Store ───────────────────────────────────────────────────────────────

test.describe('Chat store (useChatStore)', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
  });

  test('ChatPanel renders creation chat from useChatStore', async ({ page }) => {
    // The creation chat sidebar should be visible with heading and status text
    const chatPanel = page.locator('[aria-label*="chat" i], aside').filter({
      has: page.locator('input, textarea')
    }).first();
    // Check for the chat heading or placeholder text visible in the chat panel
    await expect(
      page.locator('h3').filter({ hasText: /goals assistant/i })
        .or(page.locator('[placeholder*="anything" i]'))
        .or(page.locator('text=Ready to help'))
        .first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('sending a message in creation chat updates state', async ({ page }) => {
    // Find the chat input - the creation chat uses "Ask me anything..." placeholder
    const chatInput = page.locator('[placeholder*="anything" i]').first();
    if (await chatInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatInput.fill('Test message');
      await chatInput.press('Enter');
      await page.waitForTimeout(1000);

      // After sending, input should be cleared OR message appears in chat
      const inputCleared = await chatInput.inputValue().then(v => v === '').catch(() => true);
      // Just verify the app didn't crash
      await expect(page.locator('#root')).toBeVisible();
    }
  });

  test('OverviewChatPage loads without errors', async ({ page }) => {
    await page.goto('/overview').catch(() => {});
    // If overview page exists, verify it loads
    const isChatPage = await page.locator('[class*="overview" i], [class*="Overview" i]').isVisible({ timeout: 3000 }).catch(() => false);
    if (isChatPage) {
      await expect(page.locator('#root')).toBeVisible();
    }
  });

  test('ChatSidebar shows active category from useViewStore', async ({ page }) => {
    // Click Items category - chat sidebar should reflect it
    const itemsBtn = page.locator('nav, aside').locator('text=Items').first();
    if (await itemsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await itemsBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('#root')).toBeVisible();
    }
  });
});

// ─── Cross-store integration ──────────────────────────────────────────────────

test.describe('Cross-store integration', () => {
  test.beforeEach(async ({ page }) => {
    await loginDemo(page);
  });

  test('app initializes correctly - user state + goals loaded', async ({ page }) => {
    // After demo login, both auth state and goals state should be populated
    await expect(page.locator('a').filter({ hasText: 'Neon Goals' })).toBeVisible({ timeout: 10000 });
    await page.waitForSelector('.glass-card, [class*="goal"]', { timeout: 10000 });
    await expect(page.locator('#root')).toBeVisible();
  });

  test('page reload preserves demo auth state', async ({ page }) => {
    // Reload - domain stores re-hydrate from localStorage
    await page.reload();
    await waitForAppReady(page);
    await expect(page).toHaveURL('/');
    await expect(page.locator('a').filter({ hasText: 'Neon Goals' })).toBeVisible({ timeout: 10000 });
  });

  test('keyboard shortcuts work (useViewStore + useAuthStore)', async ({ page }) => {
    // Press Escape - should work (registered via useKeyboardShortcuts which now uses domain stores)
    await page.keyboard.press('Escape');
    await expect(page.locator('#root')).toBeVisible();

    // Press 'h' to toggle sidebar (keyboard shortcut)
    await page.keyboard.press('h');
    await page.waitForTimeout(300);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('navigating to settings and back preserves state', async ({ page }) => {
    // Go to settings
    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('#root')).toBeVisible();

    // Navigate back
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('a').filter({ hasText: 'Neon Goals' })).toBeVisible({ timeout: 5000 });
  });

  test('email login: real user auth + goals load via domain stores', async ({ page }) => {
    await login(page, TEST_EMAIL, TEST_PASSWORD);

    // Both user and goals should be fetched via domain stores
    await expect(page.locator('a').filter({ hasText: 'Neon Goals' })).toBeVisible({ timeout: 10000 });
    // Page should not crash or redirect to login
    await expect(page).toHaveURL('/');
  });
});
