import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  prompts: defineTable({
    title: v.string(),
    description: v.string(),
    prompt: v.string(),
    categories: v.array(v.string()),
    stars: v.number(),
    likes: v.optional(v.number()),
    department: v.optional(v.string()),
    githubProfile: v.optional(v.string()),
    isPublic: v.boolean(),
    slug: v.string(),
    createdAt: v.number(),
    userId: v.optional(v.string()),
    suggestedQueries: v.optional(v.array(v.string())),
  }).index("by_department", ["department"]),
  starRatings: defineTable({
    promptId: v.id("prompts"),
    rating: v.number(),
    createdAt: v.number(),
  }),
  comments: defineTable({
    promptId: v.id("prompts"),
    content: v.string(),
    userId: v.string(),
    userName: v.string(),
    createdAt: v.number(),
    parentId: v.optional(v.id("comments")),
  }).index("by_prompt", ["promptId"]),
  customCategories: defineTable({
    name: v.string(),
    userId: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  conversations: defineTable({
    promptId: v.id("prompts"),
    userId: v.string(),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_prompt_and_user", ["promptId", "userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system"),
    ),
    content: v.string(),
    sources: v.optional(
      v.array(v.object({ uri: v.string(), title: v.string() })),
    ),
    toolCalls: v.optional(
      v.array(
        v.object({
          toolCallId: v.string(),
          name: v.string(),
          args: v.string(),
          result: v.optional(v.string()),
        }),
      ),
    ),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
