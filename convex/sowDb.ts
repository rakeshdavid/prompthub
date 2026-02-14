import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Gets a single chunk by ID (internal query for use in actions).
 */
export const getChunkById = internalQuery({
  args: {
    chunkId: v.id("sowChunks"),
  },
  returns: v.union(
    v.object({
      _id: v.id("sowChunks"),
      _creationTime: v.number(),
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
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chunkId);
  },
});

/**
 * Handles errors during SOW file processing and marks document as error.
 */
export const markDocumentError = internalMutation({
  args: {
    docId: v.id("sowDocuments"),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.docId, {
      status: "error",
      processedAt: Date.now(),
    });
  },
});

/**
 * Stores SOW chunks with embeddings in Convex.
 */
export const storeSowChunks = internalMutation({
  args: {
    documentId: v.id("sowDocuments"),
    chunks: v.array(
      v.object({
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
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Delete existing chunks for this document
    const existingChunks = await ctx.db
      .query("sowChunks")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const chunk of existingChunks) {
      await ctx.db.delete(chunk._id);
    }

    // Insert new chunks
    const now = Date.now();
    for (let i = 0; i < args.chunks.length; i++) {
      const chunk = args.chunks[i];
      await ctx.db.insert("sowChunks", {
        documentId: args.documentId,
        chunkIndex: i,
        content: chunk.content,
        embedding: chunk.embedding,
        metadata: chunk.metadata,
        createdAt: now,
      });
    }
  },
});

/**
 * Creates a new SOW document record.
 */
export const createDocument = internalMutation({
  args: {
    fileName: v.string(),
    filePath: v.string(),
    documentId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.id("sowDocuments"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("sowDocuments", {
      fileName: args.fileName,
      filePath: args.filePath,
      documentId: args.documentId,
      metadata: args.metadata,
      totalChunks: 0,
      processedAt: Date.now(),
      status: "processing",
    });
  },
});

/**
 * Updates document processing status.
 */
export const updateDocumentStatus = internalMutation({
  args: {
    docId: v.id("sowDocuments"),
    status: v.union(
      v.literal("processing"),
      v.literal("complete"),
      v.literal("error"),
    ),
    totalChunks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const update: {
      status: "processing" | "complete" | "error";
      totalChunks?: number;
      processedAt?: number;
    } = {
      status: args.status,
    };

    if (args.totalChunks !== undefined) {
      update.totalChunks = args.totalChunks;
    }

    if (args.status === "complete" || args.status === "error") {
      update.processedAt = Date.now();
    }

    await ctx.db.patch(args.docId, update);
  },
});

/**
 * Finds document by file name (internal version).
 */
export const findDocumentByFileName = internalQuery({
  args: {
    fileName: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("sowDocuments"),
      fileName: v.string(),
      status: v.union(
        v.literal("processing"),
        v.literal("complete"),
        v.literal("error"),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const allDocs = await ctx.db.query("sowDocuments").collect();
    return allDocs
      .filter((doc) => doc.fileName === args.fileName)
      .map((doc) => ({
        _id: doc._id,
        fileName: doc.fileName,
        status: doc.status,
      }));
  },
});

/**
 * Returns processing status of all documents (internal version).
 */
export const getProcessingStatus = internalQuery({
  args: {},
  returns: v.object({
    totalFiles: v.number(),
    processed: v.number(),
    processing: v.number(),
    errors: v.number(),
    documents: v.array(
      v.object({
        _id: v.id("sowDocuments"),
        fileName: v.string(),
        status: v.union(
          v.literal("processing"),
          v.literal("complete"),
          v.literal("error"),
        ),
        totalChunks: v.number(),
        processedAt: v.number(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const documents = await ctx.db.query("sowDocuments").collect();

    const processed = documents.filter((d) => d.status === "complete").length;
    const processing = documents.filter(
      (d) => d.status === "processing",
    ).length;
    const errors = documents.filter((d) => d.status === "error").length;

    return {
      totalFiles: documents.length,
      processed,
      processing,
      errors,
      documents: documents.map((doc) => ({
        _id: doc._id,
        fileName: doc.fileName,
        status: doc.status,
        totalChunks: doc.totalChunks,
        processedAt: doc.processedAt,
      })),
    };
  },
});

/**
 * Returns processing status of all documents (public version).
 */
export const getProcessingStatusPublic = query({
  args: {},
  returns: v.object({
    totalFiles: v.number(),
    processed: v.number(),
    processing: v.number(),
    errors: v.number(),
    documents: v.array(
      v.object({
        _id: v.id("sowDocuments"),
        fileName: v.string(),
        status: v.union(
          v.literal("processing"),
          v.literal("complete"),
          v.literal("error"),
        ),
        totalChunks: v.number(),
        processedAt: v.number(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const documents = await ctx.db.query("sowDocuments").collect();

    const processed = documents.filter((d) => d.status === "complete").length;
    const processing = documents.filter(
      (d) => d.status === "processing",
    ).length;
    const errors = documents.filter((d) => d.status === "error").length;

    return {
      totalFiles: documents.length,
      processed,
      processing,
      errors,
      documents: documents.map((doc) => ({
        _id: doc._id,
        fileName: doc.fileName,
        status: doc.status,
        totalChunks: doc.totalChunks,
        processedAt: doc.processedAt,
      })),
    };
  },
});

/**
 * Returns statistics about stored chunks and documents.
 */
export const getChunkStats = query({
  args: {},
  returns: v.object({
    totalDocuments: v.number(),
    totalChunks: v.number(),
    avgChunksPerDocument: v.number(),
    documentsByStatus: v.object({
      complete: v.number(),
      processing: v.number(),
      error: v.number(),
    }),
  }),
  handler: async (ctx) => {
    const documents = await ctx.db.query("sowDocuments").collect();

    // Count chunks efficiently using document metadata instead of loading all chunks
    let totalChunks = 0;
    const complete = documents.filter((d) => d.status === "complete").length;
    const processing = documents.filter(
      (d) => d.status === "processing",
    ).length;
    const error = documents.filter((d) => d.status === "error").length;

    // Sum totalChunks from completed documents
    for (const doc of documents) {
      if (doc.status === "complete") {
        totalChunks += doc.totalChunks;
      }
    }

    const avgChunks = complete > 0 ? totalChunks / complete : 0;

    return {
      totalDocuments: documents.length,
      totalChunks,
      avgChunksPerDocument: avgChunks,
      documentsByStatus: {
        complete,
        processing,
        error,
      },
    };
  },
});
