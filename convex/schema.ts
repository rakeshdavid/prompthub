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
  })
    .index("by_department", ["department"])
    .index("by_isPublic", ["isPublic"])
    .index("by_slug", ["slug"]),
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
    dataSources: v.optional(
      v.array(
        v.object({
          type: v.string(),
          count: v.number(),
          topScore: v.optional(v.number()),
        }),
      ),
    ),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  sowDocuments: defineTable({
    fileName: v.string(),
    filePath: v.string(),
    documentId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    totalChunks: v.number(),
    processedAt: v.number(),
    status: v.union(
      v.literal("processing"),
      v.literal("complete"),
      v.literal("error"),
    ),
  }).index("by_status", ["status"]),

  sowChunks: defineTable({
    documentId: v.id("sowDocuments"),
    chunkIndex: v.number(),
    content: v.string(),
    embedding: v.array(v.number()),
    metadata: v.optional(
      v.object({
        jsonPath: v.optional(v.string()),
        sectionPath: v.optional(v.string()),
        parentSection: v.optional(v.string()),
        fieldNames: v.optional(v.array(v.string())),
      }),
    ),
    createdAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .vectorIndex("embedding_index", {
      vectorField: "embedding",
      dimensions: 3072, // gemini-embedding-001 default dimensions
      filterFields: ["documentId"],
    }),
});
