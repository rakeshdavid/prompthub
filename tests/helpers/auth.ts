import { Page } from "@playwright/test";

/**
 * Authentication helper for Clerk
 * Note: For actual testing, you may need to use Clerk's test mode or mock authentication
 * This is a placeholder that can be extended based on your Clerk setup
 */
export async function loginAsTestUser(page: Page) {
  // Navigate to login page or use Clerk's test mode
  // This will need to be customized based on your Clerk configuration
  // For now, we'll assume the user is already authenticated or use Clerk's test mode

  // If using Clerk test mode, you can set up test tokens here
  // Otherwise, manual authentication may be required for E2E tests
  console.log(
    "Note: Authentication setup required based on Clerk configuration",
  );
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for Clerk session indicators in the DOM
  const signInButton = page.locator("text=Sign In").first();
  const userButton = page.locator('[data-testid="user-button"]').first();

  try {
    // If sign in button exists, user is not authenticated
    await signInButton.waitFor({ timeout: 2000 });
    return false;
  } catch {
    // Sign in button not found, check for user button
    try {
      await userButton.waitFor({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}
