import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * One-time utility to regenerate all prompt suggestions with the updated
 * MedTech-contextualized Gemini system prompt.
 *
 * Usage from Convex dashboard:
 *   1. Run `clearAllSuggestions` mutation to wipe stale generic suggestions
 *   2. Run `regenerateAllSuggestions` action to re-generate with MedTech context
 *
 * Or just run `clearAllSuggestions` and let the on-demand fallback in
 * ChatRuntimeProvider regenerate when users click "Test".
 */

/** Clears suggestedQueries on all prompts so they get regenerated. */
export const clearAllSuggestions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const prompts = await ctx.db.query("prompts").collect();
    let cleared = 0;
    for (const prompt of prompts) {
      if (prompt.suggestedQueries && prompt.suggestedQueries.length > 0) {
        await ctx.db.patch(prompt._id, { suggestedQueries: undefined });
        cleared++;
      }
    }
    console.log(`Cleared suggestions on ${cleared} prompts`);
    return cleared;
  },
});

/** Clears and then re-generates suggestions for all prompts. */
export const regenerateAllSuggestions = internalAction({
  args: {},
  handler: async (ctx) => {
    const cleared = await ctx.runMutation(
      internal.regenerateSuggestions.clearAllSuggestions,
      {},
    );
    console.log(`Cleared ${cleared} prompts, now regenerating...`);

    // Fetch all prompts via the internal query
    const prompts = await ctx.runQuery(internal.prompts.listAllPrompts, {});

    for (const prompt of prompts) {
      await ctx.runAction(internal.suggestions.generateSuggestions, {
        promptId: prompt._id,
        title: prompt.title,
        description: prompt.description,
        prompt: prompt.prompt,
      });
    }

    console.log(`Regenerated suggestions for ${prompts.length} prompts`);
  },
});
