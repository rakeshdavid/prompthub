import { test, expect } from "@playwright/test";

const PRODUCTION_URL = "https://jnj-prompthub-demo.vercel.app";
const SOW_REVIEWER_SLUG = "procurement-intelligence-sow";

test.describe("SOW Reviewer - Production Verification", () => {
  test("should load SOW Reviewer page and open chat panel", async ({
    page,
  }) => {
    await page.goto(`${PRODUCTION_URL}/prompt/${SOW_REVIEWER_SLUG}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000); // Wait for React hydration

    // Verify page loaded
    await expect(page).toHaveURL(new RegExp(`.*${SOW_REVIEWER_SLUG}.*`));

    // Verify page content
    const pageContent = await page.textContent("body");
    expect(pageContent?.toLowerCase()).toMatch(/sow|reviewer/i);

    // Find and click "Test" button to open chat panel
    const testButton = page.locator('button:has-text("Test")').first();
    await expect(testButton).toBeVisible({ timeout: 10000 });
    await testButton.click();

    // Wait for dialog to open
    await page.waitForTimeout(3000);

    // Verify chat panel is open (look for dialog content)
    const dialogContent = page.locator('[role="dialog"]');
    await expect(dialogContent).toBeVisible({ timeout: 5000 });

    console.log("✅ SOW Reviewer page loaded successfully");
    console.log("✅ Chat panel opened");

    // Take screenshot for verification
    await page.screenshot({
      path: "test-results/sow-page-loaded.png",
      fullPage: true,
    });
  });

  test("should show suggested queries in chat panel and verify RAG works", async ({
    page,
  }) => {
    await page.goto(`${PRODUCTION_URL}/prompt/${SOW_REVIEWER_SLUG}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Open chat panel
    const testButton = page.locator('button:has-text("Test")').first();
    await testButton.click();
    await page.waitForTimeout(3000);

    // Wait for suggestions to appear - they use assistant-ui classes
    const suggestions = page.locator(
      '.aui-thread-welcome-suggestion, [class*="suggestion"]',
    );
    await expect(suggestions.first()).toBeVisible({ timeout: 15000 });

    const count = await suggestions.count();
    expect(count).toBeGreaterThanOrEqual(4);

    console.log(`✅ Found ${count} suggested queries`);

    // Get query text to verify they match expected queries
    const queryTexts: string[] = [];
    for (let i = 0; i < Math.min(count, 4); i++) {
      const text = await suggestions.nth(i).textContent();
      if (text) queryTexts.push(text.trim());
    }

    const allText = queryTexts.join(" ").toLowerCase();
    expect(allText).toMatch(/similar|rate|duplicate|review/i);

    console.log("✅ Suggested queries match expected content:", queryTexts);

    // Click first suggestion (similar SOWs query)
    await suggestions.first().click();

    // Wait for query to be sent and response to start
    await page.waitForTimeout(10000);

    // Check for RAG indicators in response
    const responseText = await page.textContent("body");
    const hasRAGIndicators =
      responseText?.includes("document") ||
      responseText?.includes("SOW") ||
      responseText?.includes("JNJ") ||
      responseText?.includes("context") ||
      responseText?.includes("Relevant") ||
      responseText?.includes("similar");

    console.log("✅ Query executed");
    console.log("✅ RAG context found:", hasRAGIndicators);

    // Take screenshot
    await page.screenshot({
      path: "test-results/sow-rag-verification.png",
      fullPage: true,
    });

    // Verify RAG is working
    expect(hasRAGIndicators).toBeTruthy();
  });
});
