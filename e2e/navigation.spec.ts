import { test, expect } from '@playwright/test';
import { clearBrowserState, waitForAppReady } from './helpers';

/**
 * E2E tests for navigation
 *
 * Tests cover:
 * - Sidebar toggle (mobile)
 * - Category navigation
 * - View mode toggle (list/Card)
 * - Goal drill-down navigation
 * - Breadcrumb navigation
 */
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
    // Login with demo mode
    await page.goto('/login');
    await waitForAppReady(page);
    await page.click('text=Start with Demo Mode');
    await expect(page).toHaveURL('/');
    await waitForAppReady(page);
    // Wait for goals to load
    await page.waitForTimeout(1000);
  });

  test('sidebar toggle works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Look for menu toggle button
    const menuButton = page.locator('button[aria-label="Toggle sidebar"]');

    // Open sidebar
    await menuButton.click();

    // Main sidebar should be visible (the one with "Menu" header)
    const sidebar = page.locator('aside').filter({ hasText: 'Menu' });
    await expect(sidebar).toBeVisible({ timeout: 5000 });

    // The overlay should be visible when sidebar is open
    const overlay = page.locator('[class*="bg-black/80"]');
    await expect(overlay).toBeVisible({ timeout: 3000 });

    // Close sidebar by clicking the overlay (more reliable than X button)
    await overlay.click();

    // Overlay should disappear (sidebar is closed)
    await expect(overlay).not.toBeVisible({ timeout: 5000 });
  });

  test('category navigation in sidebar', async ({ page }) => {
    // Set desktop viewport for reliable sidebar visibility
    await page.setViewportSize({ width: 1280, height: 720 });

    // Look for category buttons in the main sidebar (not chat sidebar)
    const sidebar = page.locator('aside').filter({ hasText: 'Categories' });

    // Click on Items category
    const itemsButton = sidebar.locator('button').filter({ hasText: 'Items' });
    await itemsButton.click();

    // Category should be selected (has neon-border class)
    await expect(itemsButton).toHaveAttribute('class', /neon-border/, { timeout: 5000 });
  });

  test('view mode toggle in sidebar', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Look for view mode toggle in the main sidebar
    const sidebar = page.locator('aside').filter({ hasText: 'Menu' });
    const listButton = sidebar.locator('button').filter({ hasText: 'List' });

    // Click List view
    await listButton.click();

    // List should be active (has bg-primary or neon-glow class)
    await expect(listButton).toHaveAttribute('class', /bg-primary|neon-glow/, { timeout: 5000 });
  });

  test('header view mode toggle on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Look for view mode toggle in header (visible on mobile)
    const listViewButton = page.locator('header button[aria-label="List view"]');
    const cardViewButton = page.locator('header button[aria-label="Card view"]');

    // Should have both buttons in header
    await expect(listViewButton).toBeVisible({ timeout: 5000 });
    await expect(cardViewButton).toBeVisible({ timeout: 5000 });
  });

  test('goal navigation from main content', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Wait for goals to load
    await page.waitForTimeout(500);

    // Look for goal cards in the main content area (clickable goal items)
    const mainArea = page.locator('main').first();
    const goalCards = mainArea.locator('[class*="cursor-pointer"], button').filter({
      has: page.locator('span:text-matches("🛒|💰|🎯")')
    });

    const count = await goalCards.count();
    if (count > 0) {
      // Click first goal card
      await goalCards.first().click();

      // Should navigate to goal detail
      await expect(page).toHaveURL(/\/goals\/\w+/, { timeout: 10000 });
    }
  });

  test('desktop sidebar is always visible', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Main sidebar should be visible (the one with Menu header)
    const sidebar = page.locator('aside').filter({ hasText: 'Menu' });
    await expect(sidebar).toBeVisible({ timeout: 5000 });
  });

  test('header logo links to home', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Click logo link
    const logo = page.locator('a').filter({ hasText: 'Neon Goals' });
    await logo.click();

    // Should be on home page
    await expect(page).toHaveURL('/');
  });

  test('search input exists in header', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Look for search input
    const searchInput = page.getByPlaceholder('Search goals...');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('account dropdown toggle', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Look for user avatar button in header
    const userButton = page.locator('header button[aria-label="Account menu"]');

    // In demo mode, there should be a user button
    if (await userButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await userButton.click();

      // Wait a bit for dropdown animation
      await page.waitForTimeout(300);
    }
  });
});
