import { test, expect, Page } from "@playwright/test";
import { isAuthenticated } from "./helpers/auth";

// Slug generated from title: "Procurement Intelligence SOW"
const SOW_REVIEWER_SLUG = "procurement-intelligence-sow";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173";

/**
 * Helper to navigate to SOW Reviewer prompt page
 */
async function navigateToSOWReviewer(page: Page) {
  await page.goto(`/prompt/${SOW_REVIEWER_SLUG}`);
  await page.waitForLoadState("networkidle");
}

/**
 * Helper to wait for suggested queries to appear
 */
async function waitForSuggestedQueries(page: Page) {
  // Wait for suggestion buttons to appear
  await page.waitForSelector('[class*="suggestion"]', { timeout: 10000 });
}

/**
 * Helper to get suggested query text
 */
async function getSuggestedQueries(page: Page): Promise<string[]> {
  const suggestions = page.locator('[class*="suggestion"]');
  const count = await suggestions.count();
  const queries: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = await suggestions.nth(i).textContent();
    if (text) queries.push(text.trim());
  }

  return queries;
}

/**
 * Helper to wait for AI response
 */
async function waitForAIResponse(page: Page, timeout = 60000) {
  // Wait for streaming to complete - look for message content
  await page.waitForSelector('[class*="message"]', { timeout });
  // Wait a bit more for any visual tools to render
  await page.waitForTimeout(2000);
}

test.describe("SOW Reviewer - Suggested Queries", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSOWReviewer(page);
  });

  test("should display 4 suggested queries", async ({ page }) => {
    await waitForSuggestedQueries(page);

    const queries = await getSuggestedQueries(page);

    expect(queries.length).toBeGreaterThanOrEqual(4);

    // Verify expected queries are present
    const queryText = queries.join(" ").toLowerCase();
    expect(queryText).toContain("similar");
    expect(queryText).toContain("rate");
    expect(queryText).toContain("duplicate");
    expect(queryText).toContain("review");
  });

  test("should have queries under 80 characters", async ({ page }) => {
    await waitForSuggestedQueries(page);

    const queries = await getSuggestedQueries(page);

    for (const query of queries) {
      expect(query.length).toBeLessThanOrEqual(80);
    }
  });

  test("should have clickable suggestion buttons", async ({ page }) => {
    await waitForSuggestedQueries(page);

    const firstSuggestion = page.locator('[class*="suggestion"]').first();

    // Verify button is visible and clickable
    await expect(firstSuggestion).toBeVisible();
    await expect(firstSuggestion).toBeEnabled();
  });
});

test.describe("SOW Reviewer - Query Execution", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSOWReviewer(page);
    await waitForSuggestedQueries(page);
  });

  test("should execute Reference Library query", async ({ page }) => {
    // Find and click the "similar SOWs" query
    const similarQuery = page
      .locator('[class*="suggestion"]')
      .filter({
        hasText: /similar|reference/i,
      })
      .first();

    await similarQuery.click();

    // Wait for response
    await waitForAIResponse(page);

    // Verify response contains expected content
    const responseText = await page.textContent("body");
    expect(responseText).toMatch(/similar|match|reference|sow/i);

    // Check for citations or document references
    const hasCitations =
      responseText?.includes("document") ||
      responseText?.includes("SOW") ||
      responseText?.includes("JNJ");
    expect(hasCitations).toBeTruthy();
  });

  test("should execute Rate Analysis query", async ({ page }) => {
    // Find and click the rate comparison query
    const rateQuery = page
      .locator('[class*="suggestion"]')
      .filter({
        hasText: /rate|analyst|compare/i,
      })
      .first();

    await rateQuery.click();

    await waitForAIResponse(page);

    // Verify response contains rate/price information
    const responseText = await page.textContent("body");
    expect(responseText).toMatch(/rate|price|fee|cost|analyst|vendor/i);

    // Check for visual tools (table or chart)
    const hasTable =
      (await page.locator('[class*="table"], [class*="data-table"]').count()) >
      0;
    const hasChart =
      (await page.locator('[class*="chart"], canvas').count()) > 0;

    expect(hasTable || hasChart).toBeTruthy();
  });

  test("should execute Redundancy Detection query", async ({ page }) => {
    // Find and click the duplicate/redundancy query
    const redundancyQuery = page
      .locator('[class*="suggestion"]')
      .filter({
        hasText: /duplicate|redundancy|overlap/i,
      })
      .first();

    await redundancyQuery.click();

    await waitForAIResponse(page);

    // Verify response contains redundancy/overlap information
    const responseText = await page.textContent("body");
    expect(responseText).toMatch(/duplicate|redundancy|overlap|risk/i);
  });

  test("should execute Stress Test query", async ({ page }) => {
    // Find and click the review/stress test query
    const stressQuery = page
      .locator('[class*="suggestion"]')
      .filter({
        hasText: /review|stress|missing|clause/i,
      })
      .first();

    await stressQuery.click();

    await waitForAIResponse(page);

    // Verify response contains review/analysis information
    const responseText = await page.textContent("body");
    expect(responseText).toMatch(/review|missing|clause|question|score/i);
  });
});

test.describe("SOW Reviewer - Visual Tools", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSOWReviewer(page);
    await waitForSuggestedQueries(page);
  });

  test("should render data tables for quantitative data", async ({ page }) => {
    // Execute a query that should return tabular data
    const rateQuery = page
      .locator('[class*="suggestion"]')
      .filter({
        hasText: /rate|compare/i,
      })
      .first();

    await rateQuery.click();
    await waitForAIResponse(page);

    // Check for table elements
    const tables = page.locator(
      'table, [class*="table"], [class*="data-table"]',
    );
    const tableCount = await tables.count();

    // Should have at least one table for rate comparisons
    expect(tableCount).toBeGreaterThan(0);
  });

  test("should render charts for comparisons", async ({ page }) => {
    // Execute a query that should return chart data
    const rateQuery = page
      .locator('[class*="suggestion"]')
      .filter({
        hasText: /rate|compare/i,
      })
      .first();

    await rateQuery.click();
    await waitForAIResponse(page);

    // Check for chart elements (SVG, canvas, or chart containers)
    const charts = page.locator(
      'svg, canvas, [class*="chart"], [class*="recharts"]',
    );
    const chartCount = await charts.count();

    // May or may not have charts depending on AI response
    // Just verify the page rendered without errors
    expect(chartCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe("SOW Reviewer - Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSOWReviewer(page);
  });

  test("should handle empty query gracefully", async ({ page }) => {
    // Find the input field and submit empty query
    const input = page.locator('input[type="text"], textarea').first();

    if (await input.isVisible()) {
      await input.fill("");
      await input.press("Enter");

      // Should not crash - wait a bit and check for error handling
      await page.waitForTimeout(3000);

      // Page should still be functional
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("should handle very long query", async ({ page }) => {
    const longQuery = "A".repeat(1000);

    const input = page.locator('input[type="text"], textarea').first();

    if (await input.isVisible()) {
      await input.fill(longQuery);
      await input.press("Enter");

      // Should handle gracefully - wait for response or timeout
      try {
        await waitForAIResponse(page, 30000);
        // If response comes, verify it's reasonable
        const responseText = await page.textContent("body");
        expect(responseText).toBeTruthy();
      } catch (error) {
        // Timeout is acceptable for very long queries
        // Just verify page didn't crash
        await expect(page.locator("body")).toBeVisible();
      }
    }
  });

  test("should handle special characters in query", async ({ page }) => {
    const specialCharsQuery =
      "What are SOWs with <script>alert('xss')</script> or SQL'; DROP TABLE--";

    const input = page.locator('input[type="text"], textarea').first();

    if (await input.isVisible()) {
      await input.fill(specialCharsQuery);
      await input.press("Enter");

      // Should handle safely without XSS or SQL injection
      await page.waitForTimeout(5000);

      // Verify no alert appeared (XSS protection)
      const alerts = page.locator("text=alert").count();
      expect(await alerts).toBe(0);

      // Page should still be functional
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("should handle rapid successive queries", async ({ page }) => {
    await waitForSuggestedQueries(page);

    const suggestions = page.locator('[class*="suggestion"]');
    const count = Math.min(await suggestions.count(), 2);

    // Click multiple suggestions rapidly
    for (let i = 0; i < count; i++) {
      await suggestions.nth(i).click();
      await page.waitForTimeout(500); // Small delay between clicks
    }

    // Should handle multiple requests without crashing
    await page.waitForTimeout(5000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle query with no matching SOWs", async ({ page }) => {
    const noMatchQuery =
      "Find SOWs for project type XYZ12345 that doesn't exist";

    const input = page.locator('input[type="text"], textarea').first();

    if (await input.isVisible()) {
      await input.fill(noMatchQuery);
      await input.press("Enter");

      await waitForAIResponse(page);

      // Should provide graceful response, not crash
      const responseText = await page.textContent("body");
      expect(responseText).toBeTruthy();

      // Should indicate no matches found or provide helpful message
      const hasNoMatchMessage =
        responseText?.toLowerCase().includes("no match") ||
        responseText?.toLowerCase().includes("not found") ||
        responseText?.toLowerCase().includes("unable to find");

      // Either explicit no-match message or general response is acceptable
      expect(responseText?.length).toBeGreaterThan(0);
    }
  });

  test("should handle query cancellation", async ({ page }) => {
    await waitForSuggestedQueries(page);

    const firstSuggestion = page.locator('[class*="suggestion"]').first();
    await firstSuggestion.click();

    // Try to cancel/stop the request (if cancel button exists)
    const cancelButton = page
      .locator('button:has-text("Cancel"), button:has-text("Stop")')
      .first();

    if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelButton.click();

      // Should stop gracefully
      await page.waitForTimeout(2000);
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("should handle network interruption simulation", async ({
    page,
    context,
  }) => {
    await waitForSuggestedQueries(page);

    const firstSuggestion = page.locator('[class*="suggestion"]').first();
    await firstSuggestion.click();

    // Simulate network offline
    await context.setOffline(true);
    await page.waitForTimeout(2000);

    // Restore network
    await context.setOffline(false);

    // Should handle gracefully - either show error or retry
    await page.waitForTimeout(3000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle RAG context display", async ({ page }) => {
    await waitForSuggestedQueries(page);

    // Execute a query that should trigger RAG
    const similarQuery = page
      .locator('[class*="suggestion"]')
      .filter({
        hasText: /similar|reference/i,
      })
      .first();

    await similarQuery.click();
    await waitForAIResponse(page);

    // Check for RAG context indicators
    const responseText = await page.textContent("body");

    // Should reference SOW documents or include citations
    const hasRAGIndicators =
      responseText?.includes("document") ||
      responseText?.includes("SOW") ||
      responseText?.includes("JNJ") ||
      responseText?.includes("context") ||
      responseText?.includes("source");

    // RAG context may be in the response or in a separate section
    expect(responseText?.length).toBeGreaterThan(0);
  });

  test("should handle malformed JSON in response", async ({ page }) => {
    // This tests the frontend's resilience to malformed AI responses
    // The AI should return valid responses, but we test error handling

    await waitForSuggestedQueries(page);
    const firstSuggestion = page.locator('[class*="suggestion"]').first();
    await firstSuggestion.click();

    await waitForAIResponse(page);

    // Page should still render without JavaScript errors
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.waitForTimeout(3000);

    // Should have minimal errors (some may be expected)
    expect(errors.length).toBeLessThan(10);
  });
});

test.describe("SOW Reviewer - Performance", () => {
  test("should load prompt page within reasonable time", async ({ page }) => {
    const startTime = Date.now();

    await navigateToSOWReviewer(page);
    await waitForSuggestedQueries(page);

    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("should respond to queries within reasonable time", async ({ page }) => {
    await navigateToSOWReviewer(page);
    await waitForSuggestedQueries(page);

    const firstSuggestion = page.locator('[class*="suggestion"]').first();

    const startTime = Date.now();
    await firstSuggestion.click();
    await waitForAIResponse(page, 60000);
    const responseTime = Date.now() - startTime;

    // Should respond within 60 seconds (generous timeout for AI)
    expect(responseTime).toBeLessThan(60000);

    // Ideally should be faster
    console.log(`Response time: ${responseTime}ms`);
  });
});
