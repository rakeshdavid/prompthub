"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const EMBEDDING_MODEL = "gemini-embedding-001";
// gemini-embedding-001 outputs 768 dimensions by default
const EMBEDDING_DIMENSIONS = 768;

// Use the models endpoint format for embeddings
const EMBEDDING_API_URL = `${GEMINI_API_BASE}/${EMBEDDING_MODEL}:embedContent`;

/**
 * Processes all JSON files in the sow_docs folder.
 * Reads files, parses JSON, chunks semantically, generates embeddings, and stores in Convex.
 */
export const processSowFolder = action({
  args: {},
  returns: v.object({
    totalFiles: v.number(),
    processed: v.number(),
    errors: v.number(),
    errorDetails: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const sowFolderPath = join(process.cwd(), "sow_docs");

    try {
      const files = await readdir(sowFolderPath);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      const results = {
        totalFiles: jsonFiles.length,
        processed: 0,
        errors: 0,
        errorDetails: [] as string[],
      };

      for (const fileName of jsonFiles) {
        try {
          const filePath = join(sowFolderPath, fileName);
          const fileContent = await readFile(filePath, "utf-8");
          const jsonData = JSON.parse(fileContent);

          await ctx.runAction(internal.sow.processSowFile, {
            fileName,
            filePath,
            jsonData,
          });

          results.processed++;
        } catch (error) {
          results.errors++;
          const errorMsg = `Error processing ${fileName}: ${
            error instanceof Error ? error.message : String(error)
          }`;
          results.errorDetails.push(errorMsg);
          console.error(errorMsg);

          // Note: Error marking will be handled in processSowFile's try-catch
          // if document was created before error occurred
        }
      }

      return results;
    } catch (error) {
      throw new Error(
        `Failed to read sow_docs folder: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },
});

/**
 * Processes a single SOW JSON file: chunks, generates embeddings, stores.
 */
export const processSowFile = internalAction({
  args: {
    fileName: v.string(),
    filePath: v.string(),
    jsonData: v.any(),
  },
  handler: async (ctx, args) => {
    // Check if already processed
    const existingDocs = await ctx.runQuery(
      internal.sowDb.findDocumentByFileName,
      {
        fileName: args.fileName,
      },
    );

    if (existingDocs.length > 0 && existingDocs[0].status === "complete") {
      console.log(`Skipping ${args.fileName} - already processed`);
      return;
    }

    // Extract document metadata
    const documentId =
      typeof args.jsonData === "object" && args.jsonData !== null
        ? args.jsonData.id || args.jsonData.documentId || args.jsonData.name
        : undefined;

    const metadata =
      typeof args.jsonData === "object" && args.jsonData !== null
        ? {
            title: args.jsonData.title || args.jsonData.name,
            project: args.jsonData.project,
            client: args.jsonData.client,
            date: args.jsonData.date || args.jsonData.createdAt,
          }
        : undefined;

    // Create or update document record
    let docId;
    if (existingDocs.length > 0) {
      docId = existingDocs[0]._id;
      await ctx.runMutation(internal.sowDb.updateDocumentStatus, {
        docId,
        status: "processing",
      });
    } else {
      docId = await ctx.runMutation(internal.sowDb.createDocument, {
        fileName: args.fileName,
        filePath: args.filePath,
        documentId: typeof documentId === "string" ? documentId : undefined,
        metadata,
      });
    }

    try {
      // Chunk the document semantically
      const chunks = await ctx.runAction(internal.sow.chunkSowDocument, {
        jsonData: args.jsonData,
      });

      // Generate embeddings for all chunks
      const embeddings = await ctx.runAction(internal.sow.generateEmbeddings, {
        chunks: chunks.map((c: { content: string }) => c.content),
      });

      // Store chunks with embeddings
      await ctx.runMutation(internal.sowDb.storeSowChunks, {
        documentId: docId,
        chunks: chunks.map(
          (
            chunk: {
              content: string;
              metadata?: {
                jsonPath?: string;
                sectionPath?: string;
                parentSection?: string;
                fieldNames?: string[];
              };
            },
            index: number,
          ) => ({
            ...chunk,
            embedding: embeddings[index],
          }),
        ),
      });

      // Update document status to complete
      await ctx.runMutation(internal.sowDb.updateDocumentStatus, {
        docId,
        status: "complete",
        totalChunks: chunks.length,
      });
    } catch (error) {
      // Mark document as error on failure
      await ctx.runMutation(internal.sowDb.markDocumentError, {
        docId,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
});

/**
 * Semantically chunks a SOW JSON document by structure.
 * Preserves JSON path context and groups related fields.
 */
export const chunkSowDocument = internalAction({
  args: {
    jsonData: v.any(),
  },
  returns: v.array(
    v.object({
      content: v.string(),
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
  handler: async (_ctx, args) => {
    const chunks: Array<{
      content: string;
      metadata?: {
        jsonPath?: string;
        sectionPath?: string;
        parentSection?: string;
        fieldNames?: string[];
      };
    }> = [];

    const chunkObject = (
      obj: any,
      path: string = "",
      parentSection?: string,
    ): void => {
      if (obj === null || obj === undefined) return;

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          chunkObject(item, `${path}[${index}]`, parentSection);
        });
        return;
      }

      if (typeof obj === "object") {
        const keys = Object.keys(obj);
        const sectionName = path.split(".").pop() || "root";

        // Group small objects into single chunks
        if (keys.length <= 5 && !hasNestedObjects(obj)) {
          const content = formatObjectChunk(obj, sectionName, parentSection);
          chunks.push({
            content,
            metadata: {
              jsonPath: path,
              sectionPath: sectionName,
              parentSection,
              fieldNames: keys,
            },
          });
          return;
        }

        // For larger objects, chunk by section
        for (const key of keys) {
          const newPath = path ? `${path}.${key}` : key;
          const value = obj[key];

          if (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
          ) {
            chunkObject(value, newPath, sectionName);
          } else if (Array.isArray(value)) {
            // Handle arrays - chunk each item if complex, or group if simple
            if (value.length > 0 && typeof value[0] === "object") {
              value.forEach((item, idx) => {
                chunkObject(item, `${newPath}[${idx}]`, sectionName);
              });
            } else {
              const content = formatArrayChunk(
                key,
                value,
                sectionName,
                parentSection,
              );
              chunks.push({
                content,
                metadata: {
                  jsonPath: newPath,
                  sectionPath: key,
                  parentSection: sectionName,
                  fieldNames: [key],
                },
              });
            }
          } else {
            // Simple key-value pairs - group into chunks
            const content = formatKeyValueChunk(
              key,
              value,
              sectionName,
              parentSection,
            );
            chunks.push({
              content,
              metadata: {
                jsonPath: newPath,
                sectionPath: key,
                parentSection: sectionName,
                fieldNames: [key],
              },
            });
          }
        }
      }
    };

    chunkObject(args.jsonData);

    // Merge small adjacent chunks to meet minimum size
    return mergeSmallChunks(chunks);
  },
});

/**
 * Generates embeddings for text chunks using Gemini embedding API.
 */
export const generateEmbeddings = internalAction({
  args: {
    chunks: v.array(v.string()),
  },
  returns: v.array(v.array(v.number())),
  handler: async (_ctx, args) => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY for embeddings");
    }

    // Process chunks individually (Gemini embedContent endpoint)
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < args.chunks.length; i++) {
      const text = args.chunks[i];
      const url = `${EMBEDDING_API_URL}?key=${apiKey}`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: `models/${EMBEDDING_MODEL}`,
            content: {
              parts: [{ text }],
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Gemini embedding API error: ${response.status} ${errorText}`,
          );
        }

        const json = await response.json();
        if (
          json.embedding &&
          json.embedding.values &&
          Array.isArray(json.embedding.values)
        ) {
          allEmbeddings.push(json.embedding.values);
        } else {
          throw new Error("Invalid embedding format from Gemini");
        }
      } catch (error) {
        console.error(`Error generating embedding for chunk ${i}:`, error);
        throw error;
      }
    }

    return allEmbeddings;
  },
});

/**
 * Verifies that all files in sow_docs folder are processed.
 */
export const verifyProcessing = action({
  args: {},
  returns: v.object({
    allProcessed: v.boolean(),
    missingFiles: v.array(v.string()),
    errorFiles: v.array(v.string()),
  }),
  handler: async (
    ctx,
  ): Promise<{
    allProcessed: boolean;
    missingFiles: string[];
    errorFiles: string[];
  }> => {
    const sowFolderPath = join(process.cwd(), "sow_docs");

    try {
      const files = await readdir(sowFolderPath);
      const jsonFiles = files.filter((f: string) => f.endsWith(".json"));

      const status: {
        documents: Array<{
          fileName: string;
          status: "processing" | "complete" | "error";
        }>;
      } = await ctx.runQuery(internal.sowDb.getProcessingStatus, {});

      const processedFileNames: string[] = status.documents
        .filter((d: { status: string }) => d.status === "complete")
        .map((d: { fileName: string }) => d.fileName);

      const errorFileNames: string[] = status.documents
        .filter((d: { status: string }) => d.status === "error")
        .map((d: { fileName: string }) => d.fileName);

      const missingFiles: string[] = jsonFiles.filter(
        (f: string) => !processedFileNames.includes(f),
      );

      return {
        allProcessed: missingFiles.length === 0 && errorFileNames.length === 0,
        missingFiles,
        errorFiles: errorFileNames,
      };
    } catch (error) {
      throw new Error(
        `Failed to verify processing: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },
});

// Helper functions

function hasNestedObjects(obj: any): boolean {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return false;
  }
  return Object.values(obj).some(
    (v) => typeof v === "object" && v !== null && !Array.isArray(v),
  );
}

function formatObjectChunk(
  obj: any,
  sectionName: string,
  parentSection?: string,
): string {
  const context = parentSection
    ? `[${parentSection} > ${sectionName}]`
    : `[${sectionName}]`;
  const content = JSON.stringify(obj, null, 2);
  return `${context}\n${content}`;
}

function formatArrayChunk(
  key: string,
  arr: any[],
  sectionName: string,
  parentSection?: string,
): string {
  const context = parentSection
    ? `[${parentSection} > ${sectionName} > ${key}]`
    : `[${sectionName} > ${key}]`;
  const content = Array.isArray(arr)
    ? arr.map((item) => JSON.stringify(item)).join("\n")
    : JSON.stringify(arr);
  return `${context}\n${key}: ${content}`;
}

function formatKeyValueChunk(
  key: string,
  value: any,
  sectionName: string,
  parentSection?: string,
): string {
  const context = parentSection
    ? `[${parentSection} > ${sectionName} > ${key}]`
    : `[${sectionName} > ${key}]`;
  return `${context}\n${key}: ${JSON.stringify(value)}`;
}

function mergeSmallChunks(
  chunks: Array<{
    content: string;
    metadata?: {
      jsonPath?: string;
      sectionPath?: string;
      parentSection?: string;
      fieldNames?: string[];
    };
  }>,
): Array<{
  content: string;
  metadata?: {
    jsonPath?: string;
    sectionPath?: string;
    parentSection?: string;
    fieldNames?: string[];
  };
}> {
  const MIN_CHUNK_SIZE = 100; // Approximate token count
  const merged: typeof chunks = [];
  let currentChunk: (typeof chunks)[0] | null = null;

  for (const chunk of chunks) {
    const chunkSize = chunk.content.length;

    if (chunkSize >= MIN_CHUNK_SIZE) {
      if (currentChunk) {
        merged.push(currentChunk);
        currentChunk = null;
      }
      merged.push(chunk);
    } else {
      if (currentChunk) {
        // Merge with current chunk
        currentChunk.content += "\n\n" + chunk.content;
        if (chunk.metadata?.fieldNames) {
          currentChunk.metadata = {
            ...currentChunk.metadata,
            fieldNames: [
              ...(currentChunk.metadata?.fieldNames || []),
              ...chunk.metadata.fieldNames,
            ],
          };
        }
        if (currentChunk.content.length >= MIN_CHUNK_SIZE) {
          merged.push(currentChunk);
          currentChunk = null;
        }
      } else {
        currentChunk = { ...chunk };
      }
    }
  }

  if (currentChunk) {
    merged.push(currentChunk);
  }

  return merged;
}
