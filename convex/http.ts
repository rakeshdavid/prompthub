import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_TOOL_ROUNDS = 5;

const http = httpRouter();

// ---------------------------------------------------------------------------
// MCP Types
// ---------------------------------------------------------------------------

interface McpTool {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolResult {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

// ---------------------------------------------------------------------------
// MCP Helpers – Streamable HTTP (JSON-RPC 2.0 over POST)
// ---------------------------------------------------------------------------

async function mcpInitialize(serverUrl: string): Promise<string> {
  const response = await fetch(serverUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "promptstack", version: "1.0.0" },
      },
    }),
  });

  const sessionId = response.headers.get("Mcp-Session-Id") ?? "";

  // Consume the response body so it doesn't leak
  await response.json();

  // Send required initialized notification (no id = notification)
  await fetch(serverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    }),
  });

  return sessionId;
}

async function mcpListTools(
  serverUrl: string,
  sessionId: string,
): Promise<McpTool[]> {
  const response = await fetch(serverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    }),
  });

  const json = await response.json();
  return (json.result?.tools as McpTool[]) ?? [];
}

async function mcpCallTool(
  serverUrl: string,
  sessionId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  try {
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionId ? { "Mcp-Session-Id": sessionId } : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name, arguments: args },
      }),
    });

    const json = await response.json();

    if (json.error) {
      return {
        content: [{ type: "text", text: `Error: ${json.error.message}` }],
        isError: true,
      };
    }

    return json.result as McpToolResult;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "MCP call failed";
    return { content: [{ type: "text", text: msg }], isError: true };
  }
}

function convertMcpToolsToGemini(mcpTools: McpTool[]): Array<{
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}> {
  return mcpTools
    .filter((t) => t.name !== "google_search")
    .map((tool) => ({
      name: tool.name,
      description: tool.description ?? "",
      parameters: {
        type: tool.inputSchema.type,
        properties: tool.inputSchema.properties ?? {},
        ...(tool.inputSchema.required
          ? { required: tool.inputSchema.required }
          : {}),
      },
    }));
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

/**
 * Returns the appropriate CORS origin for the given request.
 * - Production: matches the configured CLIENT_ORIGIN exactly.
 * - Development: echoes back any localhost origin so Vite's
 *   dynamic port assignment doesn't break preflight checks.
 */
function getAllowedOrigin(request: Request): string {
  const requestOrigin = request.headers.get("Origin") ?? "";
  const configuredOrigin = process.env.CLIENT_ORIGIN;

  if (configuredOrigin && requestOrigin === configuredOrigin) {
    return configuredOrigin;
  }

  if (/^http:\/\/localhost(:\d+)?$/.test(requestOrigin)) {
    return requestOrigin;
  }

  return configuredOrigin ?? "http://localhost:5173";
}

// ---------------------------------------------------------------------------
// Chat Handler
// ---------------------------------------------------------------------------

const chatHandler = httpAction(async (ctx, request) => {
  const { conversationId } = await request.json();
  const origin = getAllowedOrigin(request);

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
  };

  const data = await ctx.runQuery(internal.chat.getConversationWithMessages, {
    conversationId,
  });

  if (!data) {
    return new Response(JSON.stringify({ error: "Conversation not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { prompt, messages } = data;

  const systemMessage = messages.find((m) => m.role === "system");
  const contents: Array<{
    role: string;
    parts: Array<Record<string, unknown>>;
  }> = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Gemini API key not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // --- MCP tool discovery (best-effort) ---
  const mcpServerUrl = process.env.MCP_SERVER_URL;
  let mcpSessionId = "";
  let geminiToolDeclarations: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }> = [];

  if (mcpServerUrl) {
    try {
      mcpSessionId = await mcpInitialize(mcpServerUrl);
      const mcpTools = await mcpListTools(mcpServerUrl, mcpSessionId);
      geminiToolDeclarations = convertMcpToolsToGemini(mcpTools);
    } catch (e) {
      console.error("MCP init failed, continuing without MCP tools:", e);
    }
  }

  // Build Gemini tools array
  const tools: Array<Record<string, unknown>> = [{ google_search: {} }];
  if (geminiToolDeclarations.length > 0) {
    tools.push({ function_declarations: geminiToolDeclarations });
  }

  const geminiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const systemInstruction = {
    parts: [{ text: systemMessage?.content ?? prompt.prompt }],
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const emit = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const runContents = [...contents];
        let emittedThinking = false;
        let emittedSearching = false;
        const collectedSources: Array<{ uri: string; title: string }> = [];

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const body = {
            system_instruction: systemInstruction,
            contents: runContents,
            tools,
            generationConfig: { thinkingConfig: { thinkingLevel: "medium" } },
          };

          const geminiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!geminiResponse.ok || !geminiResponse.body) {
            const errorText = await geminiResponse.text();
            emit({
              error: `Gemini API error: ${geminiResponse.status} ${errorText}`,
            });
            controller.close();
            return;
          }

          // Read this round's stream
          const reader = geminiResponse.body.getReader();
          const decoder = new TextDecoder();
          let emittedGenerating = false;
          const functionCalls: Array<{
            name: string;
            args: Record<string, unknown>;
          }> = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;

              try {
                const parsed = JSON.parse(jsonStr);
                const parts = parsed.candidates?.[0]?.content?.parts;

                if (Array.isArray(parts)) {
                  for (const part of parts) {
                    // Thinking tokens
                    if (part.thought) {
                      if (!emittedThinking) {
                        emit({ status: "thinking" });
                        emittedThinking = true;
                      }
                      continue;
                    }

                    // Function call from Gemini
                    if (part.functionCall) {
                      functionCalls.push({
                        name: part.functionCall.name,
                        args: part.functionCall.args ?? {},
                      });
                      continue;
                    }

                    // Text content
                    if (part.text) {
                      if (!emittedGenerating) {
                        emit({ status: "generating" });
                        emittedGenerating = true;
                      }
                      emit({ text: part.text });
                    }
                  }
                }

                // Grounding metadata
                const groundingMeta = parsed.candidates?.[0]?.groundingMetadata;
                if (groundingMeta?.groundingChunks) {
                  if (!emittedSearching) {
                    emit({ status: "searching" });
                    emittedSearching = true;
                  }
                  for (const gc of groundingMeta.groundingChunks) {
                    const web = gc.web;
                    if (web?.uri && web?.title) {
                      if (!collectedSources.some((s) => s.uri === web.uri)) {
                        collectedSources.push({
                          uri: web.uri,
                          title: web.title,
                        });
                      }
                    }
                  }
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }

          // No function calls = final round
          if (functionCalls.length === 0) {
            break;
          }

          // --- Execute MCP tool calls ---
          emit({ status: "tool_calling" });

          // Append model's function call turn
          runContents.push({
            role: "model",
            parts: functionCalls.map((fc) => ({
              functionCall: { name: fc.name, args: fc.args },
            })),
          });

          // Execute each tool and build responses
          const functionResponseParts: Array<Record<string, unknown>> = [];

          for (const fc of functionCalls) {
            const toolCallId = `mcp_${fc.name}_${Date.now()}`;

            // Emit in-progress tool call
            emit({
              tool_call: { toolCallId, name: fc.name, args: fc.args },
            });

            let resultText: string;
            if (mcpServerUrl && mcpSessionId) {
              const result = await mcpCallTool(
                mcpServerUrl,
                mcpSessionId,
                fc.name,
                fc.args,
              );
              resultText = result.content
                .filter((c) => c.type === "text" && c.text)
                .map((c) => c.text)
                .join("\n");
            } else {
              resultText = "MCP server not available";
            }

            // Emit completed tool call
            emit({
              tool_call: {
                toolCallId,
                name: fc.name,
                args: fc.args,
                result: resultText,
              },
            });

            functionResponseParts.push({
              functionResponse: {
                name: fc.name,
                response: { content: resultText },
              },
            });
          }

          // Append function responses as a user turn
          runContents.push({
            role: "user",
            parts: functionResponseParts,
          });

          // Loop continues — Gemini will process the tool results
        }

        if (collectedSources.length > 0) {
          emit({ sources: collectedSources });
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Stream failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});

// ---------------------------------------------------------------------------
// CORS Preflight
// ---------------------------------------------------------------------------

const corsHandler = httpAction(async (_ctx, request) => {
  const origin = getAllowedOrigin(request);
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
});

http.route({ path: "/api/chat", method: "POST", handler: chatHandler });
http.route({ path: "/api/chat", method: "OPTIONS", handler: corsHandler });

export default http;
