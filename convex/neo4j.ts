"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Tests Neo4j connection and returns basic graph information.
 * Uses Neo4j REST API with basic authentication.
 */
export const testNeo4jConnection = action({
  args: {},
  returns: v.object({
    connected: v.boolean(),
    error: v.optional(v.string()),
    nodeCount: v.optional(v.number()),
    relationshipCount: v.optional(v.number()),
    databaseInfo: v.optional(v.string()),
  }),
  handler: async (_ctx) => {
    const neo4jUri = process.env.NEO4J_URI;
    const neo4jUsername = process.env.NEO4J_USERNAME;
    const neo4jPassword = process.env.NEO4J_PASSWORD;

    if (!neo4jUri || !neo4jUsername || !neo4jPassword) {
      return {
        connected: false,
        error:
          "Missing Neo4j environment variables. Please set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD",
      };
    }

    try {
      // Convert Neo4j URI to HTTP endpoint
      // Handle both neo4j://, neo4j+s://, bolt://, and bolt+s:// formats
      let httpUri = neo4jUri;
      if (
        neo4jUri.startsWith("neo4j://") ||
        neo4jUri.startsWith("neo4j+s://")
      ) {
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

      // Ensure we have http/https prefix
      if (!httpUri.startsWith("http://") && !httpUri.startsWith("https://")) {
        httpUri = `https://${httpUri}`;
      }

      // Remove port if present and add default HTTP port
      const url = new URL(httpUri);
      if (url.port === "" || url.port === "7687") {
        // Default bolt port, use HTTP port instead
        url.port = url.protocol === "https:" ? "7473" : "7474";
      }
      const baseUrl = `${url.protocol}//${url.host}`;

      // Neo4j REST API endpoint for transactions
      const transactionUrl = `${baseUrl}/db/data/transaction/commit`;

      // Create basic auth header
      const auth = Buffer.from(`${neo4jUsername}:${neo4jPassword}`).toString(
        "base64",
      );

      // Test query: Get node and relationship counts
      const testQuery = {
        statements: [
          {
            statement: "MATCH (n) RETURN count(n) as nodeCount",
          },
          {
            statement: "MATCH ()-[r]->() RETURN count(r) as relCount",
          },
          {
            statement:
              "CALL db.info() YIELD name, version RETURN name, version",
          },
        ],
      };

      const response = await fetch(transactionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
        body: JSON.stringify(testQuery),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          connected: false,
          error: `Neo4j API error: ${response.status} ${errorText}`,
        };
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        return {
          connected: false,
          error: `Neo4j query error: ${result.errors.map((e: any) => e.message).join(", ")}`,
        };
      }

      // Extract results from Neo4j response format
      const results = result.results || [];
      let nodeCount: number | undefined;
      let relationshipCount: number | undefined;
      let databaseInfo: string | undefined;

      if (results.length > 0 && results[0].data) {
        const nodeData = results[0].data[0]?.row;
        if (nodeData && nodeData[0] !== undefined) {
          nodeCount = nodeData[0];
        }
      }

      if (results.length > 1 && results[1].data) {
        const relData = results[1].data[0]?.row;
        if (relData && relData[0] !== undefined) {
          relationshipCount = relData[0];
        }
      }

      if (results.length > 2 && results[2].data && results[2].data.length > 0) {
        const dbData = results[2].data[0]?.row;
        if (dbData) {
          databaseInfo = `${dbData[0]} (${dbData[1]})`;
        }
      }

      return {
        connected: true,
        nodeCount: nodeCount ?? 0,
        relationshipCount: relationshipCount ?? 0,
        databaseInfo: databaseInfo ?? "Unknown",
      };
    } catch (error) {
      return {
        connected: false,
        error: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
