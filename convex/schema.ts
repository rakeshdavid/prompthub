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
});
