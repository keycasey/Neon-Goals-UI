import { test, expect } from '@playwright/test';
import { clearBrowserState, waitForAppReady } from './helpers';

/**
 * E2E tests for authentication flows
 *
 * Tests cover:
 * - Login page loads correctly
 * - Demo mode toggle
 * - Redirect to login when not authenticated
 * - Redirect to home after login
 */
test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserState(page);
  });

  test('login page loads with all auth options', async ({ page }) => {
    await page.goto('/login');
    await waitForAppReady(page);

    // Check for main elements
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('text=Continue with GitHub')).toBeVisible();
    await expect(page.locator('text=Continue with Google')).toBeVisible();
    await expect(page.locator('text=Start with Demo Mode')).toBeVisible();
    await expect(page.locator('text=sign in with email')).toBeVisible();
  });

  test('demo mode login works', async ({ page }) => {
    await page.goto('/login');
    await waitForAppReady(page);

    // Click demo mode button
    await page.click('text=Start with Demo Mode');

    // Should redirect to home page
    await expect(page).toHaveURL('/');

    // Should show the app (header with logo)
    await expect(page.locator('a').filter({ hasText: 'Neon Goals' })).toBeVisible({ timeout: 10000 });
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    // Try to access protected route directly
    await page.goto('/');

    // Should be redirected to login page
    await expect(page).toHaveURL('/login');
  });

  test('demo mode persists across page reload', async ({ page }) => {
    // Login with demo mode
    await page.goto('/login');
    await waitForAppReady(page);
    await page.click('text=Start with Demo Mode');
    await expect(page).toHaveURL('/');

    // Reload the page
    await page.reload();
    await waitForAppReady(page);

    // Should still be on home page (demo mode persisted)
    await expect(page).toHaveURL('/');
    await expect(page.locator('a').filter({ hasText: 'Neon Goals' })).toBeVisible({ timeout: 10000 });
  });

  test('can switch between auth modes on login page', async ({ page }) => {
    await page.goto('/login');
    await waitForAppReady(page);

    // Start with OAuth mode (default)
    await expect(page.locator('text=Continue with GitHub')).toBeVisible();

    // Switch to email login
    await page.click('text=sign in with email');
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Switch to register
    await page.click('text=Sign up');
    await expect(page.locator('text=Create Account')).toBeVisible();

    // Switch back to login
    await page.click('text=sign in');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('demo mode populates mock goals', async ({ page }) => {
    await page.goto('/login');
    await waitForAppReady(page);
    await page.click('text=Start with Demo Mode');
    await expect(page).toHaveURL('/');

    // Wait for goals to load from localStorage
    await page.waitForTimeout(2000);

    // Set desktop viewport to see sidebar
    await page.setViewportSize({ width: 1280, height: 720 });

    // Should have demo goals visible in sidebar
    // Goals have emoji icons (🛒, 💰, 🎯)
    const goalElements = page.locator('aside').first().locator('button').filter({
      has: page.locator('span:text-matches("🛒|💰|🎯")')
    });
    await expect(goalElements.first()).toBeVisible({ timeout: 10000 });
  });
});
