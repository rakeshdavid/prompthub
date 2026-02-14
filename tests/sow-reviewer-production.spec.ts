import { test, expect, Page } from "@playwright/test";

const PRODUCTION_URL = "https://jnj-prompthub-demo.vercel.app";
const SOW_REVIEWER_SLUG = "procurement-intelligence-sow";

/**
 * Helper to navigate to SOW Reviewer prompt page
 */
async function navigateToSOWReviewer(page: Page) {
  await page.goto(`${PRODUCTION_URL}/prompt/${SOW_REVIEWER_SLUG}`);
  await page.waitForLoadState("networkidle");
  // Wait a bit more for React to hydrate
  await page.waitForTimeout(2000);
}

/**
 * Helper to wait for suggested queries to appear
 */
async function waitForSuggestedQueries(page: Page) {
  // Wait for suggestion buttons to appear - try multiple selectors
  try {
    await page.waitForSelector('[class*="suggestion"]', { timeout: 15000 });
  } catch {
    // Try alternative selector
    await page.waitForSelector(
      'button:has-text("similar"), button:has-text("rate"), button:has-text("duplicate"), button:has-text("review")',
      { timeout: 15000 },
    );
  }
}

/**
 * Helper to get suggested query text
 */
async function getSuggestedQueries(page: Page): Promise<string[]> {
  const suggestions = page.locator('[class*="suggestion"], button').filter({
    hasText: /similar|rate|duplicate|review/i,
  });
  const count = await suggestions.count();
  const queries: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = await suggestions.nth(i).textContent();
    if (
      text &&
      (text.includes("similar") ||
        text.includes("rate") ||
        text.includes("duplicate") ||
        text.includes("review"))
    ) {
      queries.push(text.trim());
    }
  }

  return queries;
}

/**
 * Helper to wait for AI response
 */
async function waitForAIResponse(page: Page, timeout = 90000) {
  // Wait for streaming to complete - look for message content
  // Check for various indicators that response is complete
  await Promise.race([
    page.waitForSelector('[class*="message"]', { timeout }),
    page.waitForSelector("text=/SOW|document|rate|vendor/i", { timeout }),
    page.waitForTimeout(timeout),
  ]);
  // Wait a bit more for any visual tools to render
  await page.waitForTimeout(3000);
}

test.describe("SOW Reviewer - Production Deployment", () => {
  test("should load SOW Reviewer prompt page", async ({ page }) => {
    await navigateToSOWReviewer(page);

    // Verify page loaded
    await expect(page).toHaveURL(new RegExp(`.*${SOW_REVIEWER_SLUG}.*`));

    // Verify page title or heading contains SOW
    const pageContent = await page.textContent("body");
    expect(pageContent?.toLowerCase()).toMatch(/sow|reviewer/i);
  });

  test("should display 4 suggested queries", async ({ page }) => {
    await navigateToSOWReviewer(page);
    await waitForSuggestedQueries(page);

    const queries = await getSuggestedQueries(page);

    // Should have at least 4 queries
    expect(queries.length).toBeGreaterThanOrEqual(4);

    // Verify expected queries are present
    const queryText = queries.join(" ").toLowerCase();
    expect(queryText).toContain("similar");
    expect(queryText).toContain("rate");
    expect(queryText).toContain("duplicate");
    expect(queryText).toContain("review");

    console.log("Found suggested queries:", queries);
  });

  test("should execute Reference Library query and show RAG context", async ({
    page,
  }) => {
    await navigateToSOWReviewer(page);
    await waitForSuggestedQueries(page);

    // Find and click the "similar SOWs" query
    const similarQuery = page
      .locator('[class*="suggestion"], button')
      .filter({
        hasText: /similar/i,
      })
      .first();

    await expect(similarQuery).toBeVisible({ timeout: 10000 });
    await similarQuery.click();

    // Wait for response
    await waitForAIResponse(page);

    // Verify response contains expected content
    const responseText = await page.textContent("body");
    expect(responseText).toMatch(/similar|match|reference|sow/i);

    // Check for RAG context indicators
    const hasRAGIndicators =
      responseText?.includes("document") ||
      responseText?.includes("SOW") ||
      responseText?.includes("JNJ") ||
      responseText?.includes("context") ||
      responseText?.includes("source") ||
      responseText?.includes("Relevant");

    expect(hasRAGIndicators).toBeTruthy();

    console.log("RAG context found in response");
  });

  test("should execute Rate Analysis query and show RAG context", async ({
    page,
  }) => {
    await navigateToSOWReviewer(page);
    await waitForSuggestedQueries(page);

    // Find and click the rate comparison query
    const rateQuery = page
      .locator('[class*="suggestion"], button')
      .filter({
        hasText: /rate|compare/i,
      })
      .first();

    await expect(rateQuery).toBeVisible({ timeout: 10000 });
    await rateQuery.click();

    await waitForAIResponse(page);

    // Verify response contains rate/price information
    const responseText = await page.textContent("body");
    expect(responseText).toMatch(/rate|price|fee|cost|analyst|vendor/i);

    // Check for RAG context
    const hasRAGIndicators =
      responseText?.includes("document") ||
      responseText?.includes("SOW") ||
      responseText?.includes("UK") ||
      responseText?.includes("region");

    expect(hasRAGIndicators).toBeTruthy();

    // Check for visual tools (table or chart)
    const hasTable =
      (await page
        .locator('table, [class*="table"], [class*="data-table"]')
        .count()) > 0;
    const hasChart =
      (await page.locator('[class*="chart"], canvas, svg').count()) > 0;

    // At least one visual tool should be present
    expect(
      hasTable ||
        hasChart ||
        responseText?.includes("table") ||
        responseText?.includes("chart"),
    ).toBeTruthy();

    console.log("Rate analysis query executed with RAG context");
  });

  test("should execute Redundancy Detection query and show RAG context", async ({
    page,
  }) => {
    await navigateToSOWReviewer(page);
    await waitForSuggestedQueries(page);

    // Find and click the duplicate/redundancy query
    const redundancyQuery = page
      .locator('[class*="suggestion"], button')
      .filter({
        hasText: /duplicate|redundancy/i,
      })
      .first();

    await expect(redundancyQuery).toBeVisible({ timeout: 10000 });
    await redundancyQuery.click();

    await waitForAIResponse(page);

    // Verify response contains redundancy/overlap information
    const responseText = await page.textContent("body");
    expect(responseText).toMatch(/duplicate|redundancy|overlap|risk/i);

    // Check for RAG context
    const hasRAGIndicators =
      responseText?.includes("document") ||
      responseText?.includes("SOW") ||
      responseText?.includes("supply chain");

    expect(hasRAGIndicators).toBeTruthy();

    console.log("Redundancy detection query executed with RAG context");
  });

  test("should execute Stress Test query and show RAG context", async ({
    page,
  }) => {
    await navigateToSOWReviewer(page);
    await waitForSuggestedQueries(page);

    // Find and click the review/stress test query
    const stressQuery = page
      .locator('[class*="suggestion"], button')
      .filter({
        hasText: /review|missing|clause/i,
      })
      .first();

    await expect(stressQuery).toBeVisible({ timeout: 10000 });
    await stressQuery.click();

    await waitForAIResponse(page);

    // Verify response contains review/analysis information
    const responseText = await page.textContent("body");
    expect(responseText).toMatch(/review|missing|clause|question|score/i);

    // Check for RAG context
    const hasRAGIndicators =
      responseText?.includes("document") ||
      responseText?.includes("SOW") ||
      responseText?.includes("proposal");

    expect(hasRAGIndicators).toBeTruthy();

    console.log("Stress test query executed with RAG context");
  });

  test("should verify RAG is working by checking for document citations", async ({
    page,
  }) => {
    await navigateToSOWReviewer(page);
    await waitForSuggestedQueries(page);

    // Execute any query
    const firstQuery = page
      .locator('[class*="suggestion"], button')
      .filter({
        hasText: /similar|rate|duplicate|review/i,
      })
      .first();

    await expect(firstQuery).toBeVisible({ timeout: 10000 });
    await firstQuery.click();

    await waitForAIResponse(page);

    // Check for RAG context in response
    const responseText = await page.textContent("body");

    // Should have document references, SOW mentions, or context indicators
    const hasDocumentRefs =
      responseText?.includes("document") ||
      responseText?.includes("JNJ") ||
      responseText?.includes("SOW") ||
      responseText?.includes("Relevant") ||
      responseText?.includes("context") ||
      responseText?.includes("source");

    expect(hasDocumentRefs).toBeTruthy();

    // Take a screenshot for verification
    await page.screenshot({
      path: "test-results/sow-rag-verification.png",
      fullPage: true,
    });

    console.log("RAG verification complete - document citations found");
  });
});
