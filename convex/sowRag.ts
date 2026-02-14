"use node";

import { action, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const EMBEDDING_MODEL = "gemini-embedding-001";
// gemini-embedding-001 outputs 3072 dimensions by default
const EMBEDDING_DIMENSIONS = 3072;

/**
 * Generates embedding for a query string using Gemini.
 */
async function generateQueryEmbedding(queryText: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY for embeddings");
  }

  const url = `${GEMINI_API_BASE}/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text: queryText }],
      },
      taskType: "RETRIEVAL_QUERY",
      // No outputDimensionality - use default 3072 to match stored embeddings
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
    return json.embedding.values;
  } else {
    throw new Error("Invalid embedding format from Gemini");
  }
}

/**
 * Performs vector similarity search on SOW chunks.
 * Note: This is an action because it needs to generate embeddings (external API call).
 * For query-only access, use searchSowChunksWithEmbedding.
 */
export const searchSowChunks = action({
  args: {
    queryText: v.string(),
    limit: v.optional(v.number()),
    documentId: v.optional(v.id("sowDocuments")),
  },
  returns: v.array(
    v.object({
      _id: v.id("sowChunks"),
      documentId: v.id("sowDocuments"),
      chunkIndex: v.number(),
      content: v.string(),
      metadata: v.optional(
        v.object({
          jsonPath: v.optional(v.string()),
          sectionPath: v.optional(v.string()),
          parentSection: v.optional(v.string()),
          fieldNames: v.optional(v.array(v.string())),
        }),
      ),
      score: v.number(),
    }),
  ),
  handler: async (
    ctx,
    args,
  ): Promise<
    Array<{
      _id: any;
      documentId: any;
      chunkIndex: number;
      content: string;
      metadata?: {
        jsonPath?: string;
        sectionPath?: string;
        parentSection?: string;
        fieldNames?: string[];
      };
      score: number;
    }>
  > => {
    // Generate embedding for query
    const queryEmbedding = await generateQueryEmbedding(args.queryText);

    // Perform vector search via internal action (vectorSearch only works in actions)
    const results: Array<{
      _id: any;
      documentId: any;
      chunkIndex: number;
      content: string;
      metadata?: {
        jsonPath?: string;
        sectionPath?: string;
        parentSection?: string;
        fieldNames?: string[];
      };
      score: number;
    }> = await ctx.runAction(internal.sowRag.searchSowChunksQuery, {
      embedding: queryEmbedding,
      limit: args.limit ?? 10,
      documentId: args.documentId,
    });

    return results;
  },
});

/**
 * Queries Neo4j knowledge graph for related entities and relationships.
 */
async function queryNeo4jGraph(
  queryText: string,
  entities?: string[],
): Promise<{
  nodes: Array<{
    id: string;
    labels: string[];
    properties: Record<string, any>;
  }>;
  relationships: Array<{
    id: string;
    type: string;
    start: string;
    end: string;
    properties: Record<string, any>;
  }>;
}> {
  const neo4jUri = process.env.NEO4J_URI;
  const neo4jUsername = process.env.NEO4J_USERNAME;
  const neo4jPassword = process.env.NEO4J_PASSWORD;

  if (!neo4jUri || !neo4jUsername || !neo4jPassword) {
    throw new Error(
      "Neo4j credentials not configured. Please set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD",
    );
  }

  // Convert Neo4j URI to HTTP endpoint
  let httpUri = neo4jUri;
  if (neo4jUri.startsWith("neo4j://") || neo4jUri.startsWith("neo4j+s://")) {
    httpUri = neo4jUri
      .replace("neo4j://", "http://")
      .replace("neo4j+s://", "https://");
  } else if (
    neo4jUri.startsWith("bolt://") ||
    neo4jUri.startsWith("bolt+s://")
  ) {
    httpUri = neo4jUri
      .replace("bolt://", "http://")
      .replace("bolt+s://", "https://");
  }

  if (!httpUri.startsWith("http://") && !httpUri.startsWith("https://")) {
    httpUri = `https://${httpUri}`;
  }

  const url = new URL(httpUri);
  if (url.port === "" || url.port === "7687") {
    url.port = url.protocol === "https:" ? "7473" : "7474";
  }
  const baseUrl = `${url.protocol}//${url.host}`;
  const transactionUrl = `${baseUrl}/db/data/transaction/commit`;

  const auth = Buffer.from(`${neo4jUsername}:${neo4jPassword}`).toString(
    "base64",
  );

  // Build Cypher query based on query text and entities
  // This is a basic example - customize based on your graph schema
  let cypherQuery = "";
  if (entities && entities.length > 0) {
    // Search for specific entities
    const entityList = entities.map((e) => `'${e}'`).join(", ");
    cypherQuery = `
      MATCH (n)
      WHERE any(label in labels(n) WHERE label IN [${entityList}])
         OR any(prop in keys(n) WHERE toString(n[prop]) CONTAINS $queryText)
      OPTIONAL MATCH (n)-[r]-(m)
      RETURN DISTINCT n, labels(n) as labels, properties(n) as props,
             r, type(r) as relType, m, labels(m) as mLabels, properties(m) as mProps
      LIMIT 50
    `;
  } else {
    // General graph search
    cypherQuery = `
      MATCH (n)
      WHERE any(prop in keys(n) WHERE toString(n[prop]) CONTAINS $queryText)
      OPTIONAL MATCH (n)-[r]-(m)
      RETURN DISTINCT n, labels(n) as labels, properties(n) as props,
             r, type(r) as relType, m, labels(m) as mLabels, properties(m) as mProps
      LIMIT 50
    `;
  }

  const queryRequest = {
    statements: [
      {
        statement: cypherQuery,
        parameters: { queryText },
      },
    ],
  };

  try {
    const response = await fetch(transactionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      body: JSON.stringify(queryRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Neo4j API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `Neo4j query error: ${result.errors.map((e: any) => e.message).join(", ")}`,
      );
    }

    // Parse Neo4j results
    const nodesMap = new Map<string, any>();
    const relationships: any[] = [];

    if (result.results && result.results.length > 0) {
      const data = result.results[0].data || [];
      for (const row of data) {
        const rowData = row.row || [];
        if (rowData.length >= 3) {
          const node = rowData[0];
          const labels = rowData[1] || [];
          const props = rowData[2] || {};
          const rel = rowData[3];
          const relType = rowData[4];
          const targetNode = rowData[5];
          const targetLabels = rowData[6] || [];
          const targetProps = rowData[7] || {};

          // Store nodes
          if (node) {
            const nodeId = node.identity || node.id || String(node);
            nodesMap.set(nodeId, {
              id: nodeId,
              labels,
              properties: props,
            });
          }
          if (targetNode) {
            const targetId =
              targetNode.identity || targetNode.id || String(targetNode);
            nodesMap.set(targetId, {
              id: targetId,
              labels: targetLabels,
              properties: targetProps,
            });
          }

          // Store relationships
          if (rel && relType) {
            relationships.push({
              id: rel.identity || rel.id || String(rel),
              type: relType,
              start: node?.identity || node?.id || String(node),
              end: targetNode?.identity || targetNode?.id || String(targetNode),
              properties: rel.properties || {},
            });
          }
        }
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      relationships,
    };
  } catch (error) {
    console.error("Neo4j query error:", error);
    throw error;
  }
}

/**
 * Hybrid RAG + Knowledge Graph search.
 * Combines vector similarity search with Neo4j graph queries.
 */
export const hybridSearch = action({
  args: {
    queryText: v.string(),
    vectorLimit: v.optional(v.number()),
    includeGraph: v.optional(v.boolean()),
  },
  returns: v.object({
    vectorResults: v.array(
      v.object({
        _id: v.id("sowChunks"),
        documentId: v.id("sowDocuments"),
        chunkIndex: v.number(),
        content: v.string(),
        metadata: v.optional(
          v.object({
            jsonPath: v.optional(v.string()),
            sectionPath: v.optional(v.string()),
            parentSection: v.optional(v.string()),
            fieldNames: v.optional(v.array(v.string())),
          }),
        ),
        score: v.number(),
      }),
    ),
    graphResults: v.optional(
      v.object({
        nodes: v.array(
          v.object({
            id: v.string(),
            labels: v.array(v.string()),
            properties: v.any(),
          }),
        ),
        relationships: v.array(
          v.object({
            id: v.string(),
            type: v.string(),
            start: v.string(),
            end: v.string(),
            properties: v.any(),
          }),
        ),
      }),
    ),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    vectorResults: Array<{
      _id: any;
      documentId: any;
      chunkIndex: number;
      content: string;
      metadata?: {
        jsonPath?: string;
        sectionPath?: string;
        parentSection?: string;
        fieldNames?: string[];
      };
      score: number;
    }>;
    graphResults?: {
      nodes: Array<{
        id: string;
        labels: string[];
        properties: any;
      }>;
      relationships: Array<{
        id: string;
        type: string;
        start: string;
        end: string;
        properties: any;
      }>;
    };
  }> => {
    // 1. Vector search in Convex
    const vectorResults: Array<{
      _id: any;
      documentId: any;
      chunkIndex: number;
      content: string;
      metadata?: {
        jsonPath?: string;
        sectionPath?: string;
        parentSection?: string;
        fieldNames?: string[];
      };
      score: number;
    }> = await ctx.runAction(internal.sowRag.searchSowChunksInternal, {
      queryText: args.queryText,
      limit: args.vectorLimit ?? 10,
    });

    // 2. Neo4j graph search (if enabled)
    let graphResults:
      | {
          nodes: Array<{
            id: string;
            labels: string[];
            properties: any;
          }>;
          relationships: Array<{
            id: string;
            type: string;
            start: string;
            end: string;
            properties: any;
          }>;
        }
      | undefined;
    if (args.includeGraph !== false) {
      try {
        // Extract potential entity names from query for better graph search
        const words = args.queryText
          .split(/\s+/)
          .filter((w) => w.length > 3)
          .slice(0, 5);

        graphResults = await queryNeo4jGraph(args.queryText, words);
      } catch (error) {
        console.error("Neo4j search failed:", error);
        // Continue without graph results if Neo4j fails
        graphResults = undefined;
      }
    }

    return {
      vectorResults,
      graphResults,
    };
  },
});

/**
 * Internal version of searchSowChunks for use in other actions.
 */
export const searchSowChunksInternal = internalAction({
  args: {
    queryText: v.string(),
    limit: v.optional(v.number()),
    documentId: v.optional(v.id("sowDocuments")),
  },
  returns: v.array(
    v.object({
      _id: v.id("sowChunks"),
      documentId: v.id("sowDocuments"),
      chunkIndex: v.number(),
      content: v.string(),
      metadata: v.optional(
        v.object({
          jsonPath: v.optional(v.string()),
          sectionPath: v.optional(v.string()),
          parentSection: v.optional(v.string()),
          fieldNames: v.optional(v.array(v.string())),
        }),
      ),
      score: v.number(),
    }),
  ),
  handler: async (
    ctx,
    args,
  ): Promise<
    Array<{
      _id: any;
      documentId: any;
      chunkIndex: number;
      content: string;
      metadata?: {
        jsonPath?: string;
        sectionPath?: string;
        parentSection?: string;
        fieldNames?: string[];
      };
      score: number;
    }>
  > => {
    // Generate embedding
    const queryEmbedding = await generateQueryEmbedding(args.queryText);

    // Run action via internal action (vectorSearch only works in actions)
    const results: Array<{
      _id: any;
      documentId: any;
      chunkIndex: number;
      content: string;
      metadata?: {
        jsonPath?: string;
        sectionPath?: string;
        parentSection?: string;
        fieldNames?: string[];
      };
      score: number;
    }> = await ctx.runAction(internal.sowRag.searchSowChunksQuery, {
      embedding: queryEmbedding,
      limit: args.limit ?? 10,
      documentId: args.documentId,
    });

    return results;
  },
});

/**
 * Internal action that performs the actual vector search.
 * Note: vectorSearch is only available in actions, not queries.
 */
export const searchSowChunksQuery = internalAction({
  args: {
    embedding: v.array(v.number()),
    limit: v.number(),
    documentId: v.optional(v.id("sowDocuments")),
  },
  returns: v.array(
    v.object({
      _id: v.id("sowChunks"),
      documentId: v.id("sowDocuments"),
      chunkIndex: v.number(),
      content: v.string(),
      metadata: v.optional(
        v.object({
          jsonPath: v.optional(v.string()),
          sectionPath: v.optional(v.string()),
          parentSection: v.optional(v.string()),
          fieldNames: v.optional(v.array(v.string())),
        }),
      ),
      score: v.number(),
    }),
  ),
  handler: async (
    ctx,
    args,
  ): Promise<
    Array<{
      _id: any;
      documentId: any;
      chunkIndex: number;
      content: string;
      metadata?: {
        jsonPath?: string;
        sectionPath?: string;
        parentSection?: string;
        fieldNames?: string[];
      };
      score: number;
    }>
  > => {
    const results: Array<{ _id: any; _score: number }> = await ctx.vectorSearch(
      "sowChunks",
      "embedding_index",
      {
        vector: args.embedding,
        limit: args.limit,
        filter: args.documentId
          ? (q: any) => q.eq("documentId", args.documentId)
          : undefined,
      },
    );

    // Fetch full chunk documents using the IDs from vector search
    const chunks = await Promise.all(
      results.map(async (result) => {
        // Use internal query to fetch chunk by ID
        return await ctx.runQuery(internal.sowDb.getChunkById, {
          chunkId: result._id,
        });
      }),
    );

    // Filter out any null results and map to return format
    // Strip embedding (large), _creationTime and createdAt (not in downstream validators)
    return chunks
      .filter((chunk): chunk is NonNullable<typeof chunk> => chunk !== null)
      .map((chunk, index) => {
        const { embedding, _creationTime, createdAt, ...rest } = chunk;
        return {
          ...rest,
          score: results[index]._score,
        };
      });
  },
});
