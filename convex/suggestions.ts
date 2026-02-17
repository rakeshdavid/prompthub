import { internalAction, internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_PROMPT_LENGTH = 2000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Generates 4 suggested queries for a prompt using Gemini Flash.
 * Scheduled automatically after prompt creation, or called on-demand
 * when a user opens a prompt that has no suggestions yet.
 */
export const generateSuggestions = internalAction({
  args: {
    promptId: v.id("prompts"),
    title: v.string(),
    description: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error("[suggestions] Missing GOOGLE_GENERATIVE_AI_API_KEY");
      return;
    }

    const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const systemPrompt = `You generate suggested queries for an AI competitive intelligence platform.
Given a prompt's title, description, and full text, produce exactly 4 specific, actionable queries
that demonstrate the platform's value. Each query should be under 80 characters and feel like
something a Head of Competitive Intelligence would type.

This platform serves MedTech medical device companies. Frame all suggestions to demonstrate
three business value pillars:

1. TIME SAVINGS: One query should demonstrate analysis that takes hours manually
   (e.g., "Run the full competitive benchmark analysis for Q1 2026")
2. NOVEL INSIGHTS: One query should surface non-obvious cross-cutting intelligence
   (e.g., "Which competitor is most vulnerable to tariff escalation?")
3. TEAM SELF-SERVICE: One query should be simple enough for a non-CI member
   (e.g., "What are Medtronic's key advantages in orthopedics?")
4. CURRENT RELEVANCE: One query should reference a timely market event or trend
   (e.g., "Impact of J&J MedTech restructuring on competitive dynamics")

Use industry-specific terminology and reference major MedTech competitors (Medtronic, Stryker, Abbott,
Boston Scientific, Zimmer Biomet) when relevant. Queries should feel like real CI analyst work.

CRITICAL CONSTRAINTS:
- Produce exactly 4 queries (no more, no fewer)
- Each query must be under 80 characters
- Respond with ONLY a JSON array of 4 strings
- No markdown, no explanation, no additional text
- Example format: ["Query one here", "Query two here", "Query three here", "Query four here"]`;

    const truncatedPrompt =
      args.prompt.length > MAX_PROMPT_LENGTH
        ? args.prompt.slice(0, MAX_PROMPT_LENGTH) + "..."
        : args.prompt;

    const userMessage = `Title: ${args.title}
Description: ${args.description}
Prompt: ${truncatedPrompt}`;

    const requestBody = JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        });

        if (!response.ok) {
          const errorBody = await response.text().catch(() => "(unreadable)");
          console.error(
            `[suggestions] Gemini API error (attempt ${attempt}/${MAX_RETRIES}):`,
            response.status,
            errorBody,
          );
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
            continue;
          }
          return;
        }

        const json = await response.json();
        const parts = json.candidates?.[0]?.content?.parts;
        if (!Array.isArray(parts) || parts.length === 0) {
          console.error(
            `[suggestions] Empty response parts for "${args.title}":`,
            JSON.stringify(json.candidates?.[0] ?? json),
          );
          return;
        }

        const text = parts
          .filter((p: { text?: string }) => p.text)
          .map((p: { text: string }) => p.text)
          .join("");
        if (!text) {
          console.error(
            `[suggestions] No text in response parts for "${args.title}":`,
            JSON.stringify(parts),
          );
          return;
        }

        const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
        const suggestions: unknown = JSON.parse(cleaned);

        if (
          !Array.isArray(suggestions) ||
          suggestions.length === 0 ||
          !suggestions.every((s) => typeof s === "string")
        ) {
          console.error(
            `[suggestions] Invalid format for "${args.title}". Got:`,
            cleaned.slice(0, 500),
          );
          return;
        }

        const validSuggestions = suggestions.slice(0, 4) as string[];

        await ctx.runMutation(internal.suggestions.saveSuggestions, {
          promptId: args.promptId,
          suggestions: validSuggestions,
        });

        console.log(
          `[suggestions] Generated ${validSuggestions.length} suggestions for "${args.title}"`,
        );
        return;
      } catch (error) {
        console.error(
          `[suggestions] Failed for "${args.title}" (attempt ${attempt}/${MAX_RETRIES}):`,
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
        );
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      }
    }
  },
});

/** Persists generated suggestions to the prompt document. */
export const saveSuggestions = internalMutation({
  args: {
    promptId: v.id("prompts"),
    suggestions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.promptId, {
      suggestedQueries: args.suggestions,
    });
  },
});

/**
 * Public action callable from the frontend. Reads the prompt data,
 * checks if suggestions are already present, and generates them if not.
 */
export const generateSuggestionsForPrompt = action({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.runQuery(internal.prompts.getPromptById, {
      id: args.promptId,
    });

    if (!prompt) return;

    // Already has suggestions — skip
    if (prompt.suggestedQueries && prompt.suggestedQueries.length > 0) return;

    await ctx.runAction(internal.suggestions.generateSuggestions, {
      promptId: args.promptId,
      title: prompt.title,
      description: prompt.description,
      prompt: prompt.prompt,
    });
  },
});
