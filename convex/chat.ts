import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

export const getConversationsByPrompt = query({
  args: { promptId: v.id("prompts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const userId = identity.subject;

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_prompt_and_user", (q) =>
        q.eq("promptId", args.promptId).eq("userId", userId),
      )
      .collect();

    return conversations;
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.userId !== identity.subject)
      throw new Error("Not authorized");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    return messages.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const getConversationWithMessages = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const prompt = await ctx.db.get(conversation.promptId);
    if (!prompt) throw new Error("Prompt not found");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    return {
      conversation,
      prompt,
      messages: messages.sort((a, b) => a.createdAt - b.createdAt),
    };
  },
});

export const createConversation = mutation({
  args: { promptId: v.id("prompts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) throw new Error("Prompt not found");

    const now = Date.now();

    const conversationId = await ctx.db.insert("conversations", {
      promptId: args.promptId,
      userId,
      title: prompt.title,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("messages", {
      conversationId,
      role: "system",
      content: prompt.prompt,
      createdAt: now,
    });

    return conversationId;
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.userId !== identity.subject)
      throw new Error("Not authorized");

    const now = Date.now();

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "user",
      content: args.content,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, { updatedAt: now });
  },
});

export const saveAssistantMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.userId !== identity.subject)
      throw new Error("Not authorized");

    const now = Date.now();

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "assistant",
      content: args.content,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, { updatedAt: now });
  },
});
