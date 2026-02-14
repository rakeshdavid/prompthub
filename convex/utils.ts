/**
 * Shared utility functions for Convex backend
 */

/**
 * Generate a URL-friendly slug from a title string.
 * Converts to lowercase, replaces non-alphanumeric characters with hyphens,
 * and removes leading/trailing hyphens.
 *
 * Examples:
 * - "Competitor M&A Impact Assessment" → "competitor-m-a-impact-assessment"
 * - "Hello World!" → "hello-world"
 * - "  Test  123  " → "test-123"
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
