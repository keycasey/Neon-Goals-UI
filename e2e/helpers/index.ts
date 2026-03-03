/**
 * E2E Test Utilities
 *
 * Shared helpers for Playwright end-to-end tests.
 */

import { Page, expect } from '@playwright/test';

/**
 * Wait for the app to be fully loaded and ready.
 * Useful for ensuring the app is in a stable state before interactions.
 */
export async function waitForAppReady(page: Page) {
  // Wait for the main app container to be visible
  await page.waitForSelector('#root', { state: 'visible' });
}

/**
 * Clear all browser storage (localStorage, sessionStorage, cookies).
 * Useful for resetting state between tests.
 */
export async function clearBrowserState(page: Page) {
  // Navigate to a URL first to enable storage access
  await page.goto('/login');

  // Clear storage after page load
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}

/**
 * Helper to wait for a specific network idle state.
 * Useful for ensuring data has loaded before assertions.
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Login helper for authenticated tests using email/password.
 */
export async function login(page: Page, email: string, password: string) {
  await clearBrowserState(page);
  await page.goto('/login');
  await waitForAppReady(page);

  // Click "sign in with email" link to switch to email mode
  await page.click('text=sign in with email');

  // Wait for email form to appear
  await page.waitForSelector('input[type="email"]', { state: 'visible' });

  // Fill credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect to home
  await page.waitForURL('/', { timeout: 15000 });
}

/**
 * Login with demo mode (no backend required).
 */
export async function loginDemo(page: Page) {
  await clearBrowserState(page);
  await page.goto('/login');
  await waitForAppReady(page);
  await page.click('text=Start with Demo Mode');
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Assert that an element is visible and contains expected text.
 */
export async function assertElementText(
  page: Page,
  selector: string,
  expectedText: string
) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  await expect(element).toContainText(expectedText);
}

/**
 * Generate a random string for test data.
 */
export function randomString(length = 8): string {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Generate a unique test identifier.
 */
export function testId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${randomString(4)}`;
}
