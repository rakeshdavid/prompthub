import { mutation, query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { slugify } from "./utils";

export const createPrompt = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    prompt: v.string(),
    categories: v.array(v.string()),
    department: v.optional(v.string()),
    isPublic: v.boolean(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity && !args.isPublic) {
      throw new Error("Must be logged in to create private prompts");
    }

    const userId = identity?.subject;

    // Normalize slug from title
    const normalizedSlug = slugify(args.title);

    // Validate or auto-correct slug - if client sent wrong slug, use normalized version
    let finalSlug = args.slug === normalizedSlug ? args.slug : normalizedSlug;

    // Handle uniqueness - check for existing slug and append counter if needed
    let slugCounter = 1;
    let uniqueSlug = finalSlug;
    while (true) {
      const existing = await ctx.db
        .query("prompts")
        .withIndex("by_slug", (q) => q.eq("slug", uniqueSlug))
        .first();
      if (!existing) break;
      uniqueSlug = `${finalSlug}-${slugCounter}`;
      slugCounter++;
    }

    const promptId = await ctx.db.insert("prompts", {
      ...args,
      slug: uniqueSlug, // Use validated/unique slug
      stars: 0,
      likes: 0,
      createdAt: Date.now(),
      isPublic: args.isPublic,
      userId: userId,
    });

    // Generate suggested queries in the background
    await ctx.scheduler.runAfter(0, internal.suggestions.generateSuggestions, {
      promptId,
      title: args.title,
      description: args.description,
      prompt: args.prompt,
    });

    return promptId;
  },
});

export const searchPrompts = query({
  args: {
    searchQuery: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    department: v.optional(v.string()),
    starRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    let prompts: Array<any>;

    if (userId) {
      // For authenticated users, get both public and their private prompts
      const publicPrompts = await ctx.db
        .query("prompts")
        .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
        .collect();
      const privatePrompts = await ctx.db
        .query("prompts")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("isPublic"), false),
          ),
        )
        .collect();
      prompts = [...publicPrompts, ...privatePrompts];
    } else {
      // For unauthenticated users, only get public prompts
      prompts = await ctx.db
        .query("prompts")
        .withIndex("by_isPublic", (q) => q.eq("isPublic", true))
        .collect();
    }

    prompts = prompts.map((prompt) => ({
      ...prompt,
      _id: prompt._id,
    }));

    if (args.searchQuery) {
      const searchQuery = args.searchQuery.toLowerCase();
      prompts = prompts.filter(
        (prompt) =>
          prompt.title.toLowerCase().includes(searchQuery) ||
          prompt.description.toLowerCase().includes(searchQuery) ||
          prompt.prompt.toLowerCase().includes(searchQuery),
      );
    }

    if (args.categories && args.categories.length > 0) {
      prompts = prompts.filter((prompt) =>
        prompt.categories.some((category: string) =>
          args.categories?.includes(category),
        ),
      );
    }

    if (args.department) {
      prompts = prompts.filter(
        (prompt) => prompt.department === args.department,
      );
    }

    if (args.starRating !== undefined) {
      prompts = prompts.filter((prompt) => prompt.stars === args.starRating);
    }

    return prompts;
  },
});

/** One-off: update suggestedQueries for Procurement Intelligence SOW (dev sync). */
export const patchProcurementSuggestedQueries = mutation({
  args: {},
  returns: v.union(v.literal("updated"), v.literal("not_found")),
  handler: async (ctx) => {
    const prompt = await ctx.db
      .query("prompts")
      .filter((q) => q.eq(q.field("slug"), "procurement-intelligence-sow"))
      .first();
    if (!prompt) return "not_found";
    const suggestedQueries = [
      "Are we double-paying? Find overlapping SOWs or duplicate scope across departments",
      "What did competitors charge for this role? Give me rate benchmarks to use in negotiation",
      "Stress test this proposal: find loopholes and compare to where past projects failed",
      "Draft a PRD that sounds expert—pull best practices from our top SOWs",
    ];
    await ctx.db.patch(prompt._id, { suggestedQueries });
    return "updated";
  },
});

export const getPromptBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;

    const prompt = await ctx.db
      .query("prompts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!prompt) return null;

    if (!prompt.isPublic && prompt.userId !== userId) {
      return null;
    }

    return {
      ...prompt,
      _id: prompt._id,
    };
  },
});

export const ratePrompt = mutation({
  args: {
    promptId: v.id("prompts"),
    rating: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    await ctx.db.insert("starRatings", {
      promptId: args.promptId,
      rating: args.rating,
      createdAt: Date.now(),
    });

    const ratings = await ctx.db
      .query("starRatings")
      .filter((q) => q.eq(q.field("promptId"), args.promptId))
      .collect();

    const averageRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await ctx.db.patch(args.promptId, {
      stars: Math.round(averageRating),
    });
  },
});

export const likePrompt = mutation({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) throw new Error("Prompt not found");

    await ctx.db.patch(args.promptId, {
      likes: (prompt.likes || 0) + 1,
    });
  },
});

export const unlikePrompt = mutation({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) throw new Error("Prompt not found");

    await ctx.db.patch(args.promptId, {
      likes: (prompt.likes || 0) - 1,
    });
  },
});

export const getPrivatePrompts = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const prompts = await ctx.db
      .query("prompts")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), identity.subject),
          q.eq(q.field("isPublic"), false),
        ),
      )
      .collect();

    return prompts.map((prompt) => ({
      ...prompt,
      _id: prompt._id,
    }));
  },
});

export const deletePrompt = mutation({
  args: { id: v.id("prompts") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const prompt = await ctx.db.get(id);
    if (!prompt) throw new Error("Prompt not found");
    if (prompt.userId !== identity.subject) throw new Error("Not authorized");

    await ctx.db.delete(id);
  },
});

export const updatePrompt = mutation({
  args: {
    id: v.id("prompts"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    prompt: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existingPrompt = await ctx.db.get(args.id);
    if (!existingPrompt) throw new Error("Prompt not found");
    if (existingPrompt.userId !== identity.subject)
      throw new Error("Not authorized");

    const { id, ...updateData } = args;
    await ctx.db.patch(args.id, updateData);
  },
});

export const togglePromptVisibility = mutation({
  args: {
    id: v.id("prompts"),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const prompt = await ctx.db.get(args.id);
    if (!prompt) throw new Error("Prompt not found");
    if (prompt.userId !== identity.subject) throw new Error("Not authorized");

    await ctx.db.patch(args.id, {
      isPublic: args.isPublic,
    });
  },
});

// Custom Categories Functions
export const createCustomCategory = mutation({
  args: {
    name: v.string(),
  },
  returns: v.id("customCategories"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      throw new Error("Must be logged in to create custom categories");

    const existingCategory = await ctx.db
      .query("customCategories")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingCategory) {
      throw new Error("Category already exists");
    }

    const categoryId = await ctx.db.insert("customCategories", {
      name: args.name,
      userId: identity.subject,
      createdAt: Date.now(),
    });

    return categoryId;
  },
});

export const getUserCustomCategories = query({
  returns: v.array(
    v.object({
      _id: v.id("customCategories"),
      _creationTime: v.number(),
      name: v.string(),
      userId: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const categories = await ctx.db
      .query("customCategories")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    return categories;
  },
});

/** Internal query used by suggestions.ts to read prompt data from an action. */
export const getPromptById = internalQuery({
  args: { id: v.id("prompts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Internal query used by regenerateSuggestions.ts to fetch all prompts. */
export const listAllPrompts = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("prompts").collect();
  },
});

export const deleteCustomCategory = mutation({
  args: {
    id: v.id("customCategories"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      throw new Error("Must be logged in to delete custom categories");

    const category = await ctx.db.get(args.id);
    if (!category) throw new Error("Category not found");

    if (category.userId !== identity.subject) {
      throw new Error("You can only delete your own custom categories");
    }

    const promptsWithCategory = await ctx.db
      .query("prompts")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .collect();

    for (const prompt of promptsWithCategory) {
      if (prompt.categories.includes(category.name)) {
        const updatedCategories = prompt.categories.filter(
          (cat) => cat !== category.name,
        );
        await ctx.db.patch(prompt._id, {
          categories: updatedCategories,
        });
      }
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

/** Helper query for test validation - checks if prompt exists by slug */
export const getPromptBySlugForTest = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({ _id: v.id("prompts"), slug: v.string() }),
    v.null(),
  ),
  handler: async (ctx, { slug }) => {
    const prompt = await ctx.db
      .query("prompts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    return prompt ? { _id: prompt._id, slug: prompt.slug } : null;
  },
});
