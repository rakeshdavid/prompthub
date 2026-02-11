import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_TOOL_ROUNDS = 5;

// ---------------------------------------------------------------------------
// Frontend Tool Declarations
// ---------------------------------------------------------------------------
// These tools render as interactive UI components on the frontend.
// When Gemini calls them, we return a placeholder response immediately
// so the stream continues, and the frontend renders the rich widget.

const FRONTEND_TOOL_NAMES = new Set([
  "show_chart",
  "show_data_table",
  "show_plan",
  "show_stats",
  "show_options",
  "ask_questions",
]);

const FRONTEND_TOOL_DECLARATIONS = [
  {
    name: "show_chart",
    description:
      "Display an interactive chart to the user. Use this when presenting numerical trends, comparisons, or time-series data. The chart renders as a visual widget in the chat — do NOT repeat the data as text afterward.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Chart title" },
        type: {
          type: "string",
          enum: ["bar", "line", "area", "pie"],
          description: "Chart type",
        },
        data: {
          type: "array",
          items: { type: "object" },
          description:
            "Array of data objects. Each object should have a key matching xKey and keys matching each series name.",
        },
        xKey: {
          type: "string",
          description: "Key in each data object to use for the X-axis",
        },
        series: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Series data key" },
              label: { type: "string", description: "Display label" },
              color: {
                type: "string",
                description: "CSS color (hex or named)",
              },
            },
            required: ["name", "label"],
          },
          description: "Data series to plot",
        },
      },
      required: ["title", "type", "data", "xKey", "series"],
    },
  },
  {
    name: "show_data_table",
    description:
      "Display a structured data table to the user. Use this for supplier lists, comparison matrices, regulatory timelines, or any tabular data. The table renders as a visual widget — do NOT repeat the data as text afterward.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Table title" },
        columns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string", description: "Data key in each row" },
              label: { type: "string", description: "Column header label" },
            },
            required: ["key", "label"],
          },
          description: "Column definitions",
        },
        rows: {
          type: "array",
          items: { type: "object" },
          description:
            "Array of row objects. Each object should have keys matching column key values.",
        },
      },
      required: ["title", "columns", "rows"],
    },
  },
  {
    name: "show_plan",
    description:
      "Display a multi-step plan or progress tracker to the user. Use this when outlining analysis steps, compliance review phases, or any multi-stage workflow. The plan renders as a visual widget — do NOT repeat the steps as a numbered list afterward.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Plan title" },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique step ID" },
              title: { type: "string", description: "Step title" },
              description: {
                type: "string",
                description: "Brief step description",
              },
              status: {
                type: "string",
                enum: ["pending", "in_progress", "complete"],
                description: "Step status",
              },
            },
            required: ["id", "title", "status"],
          },
          description: "Plan steps",
        },
      },
      required: ["title", "steps"],
    },
  },
  {
    name: "show_stats",
    description:
      "Display a KPI dashboard or stats summary. Use this when presenting key metrics, supply chain KPIs, or performance indicators. The stats render as a visual widget — do NOT repeat the numbers as text afterward.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Stats section title" },
        stats: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "Metric name" },
              value: { type: "string", description: "Current value" },
              delta: {
                type: "string",
                description: "Change indicator e.g. +5% or -2%",
              },
              trend: {
                type: "string",
                enum: ["up", "down", "neutral"],
                description: "Trend direction",
              },
            },
            required: ["label", "value"],
          },
          description: "Stats to display",
        },
      },
      required: ["title", "stats"],
    },
  },
  {
    name: "show_options",
    description:
      "Present a set of clickable options for the user to choose from. Use this when you need the user to make a decision, select an analysis type, or choose between approaches. The options render as interactive buttons — do NOT list them as text. Wait for the user's selection in the next message before proceeding.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Question or prompt for the user",
        },
        options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique option ID" },
              label: { type: "string", description: "Option label" },
              description: {
                type: "string",
                description: "Brief description of what this option does",
              },
            },
            required: ["id", "label"],
          },
          description: "Available options",
        },
        selectionMode: {
          type: "string",
          enum: ["single", "multi"],
          description:
            "Whether user can select one or multiple options. Default: single",
        },
      },
      required: ["title", "options"],
    },
  },
  {
    name: "ask_questions",
    description:
      "Present a multi-step question flow to the user. Use this when you need to gather multiple pieces of information before proceeding (e.g., clarifying requirements, gathering preferences). The questions render as an interactive wizard — do NOT list them as text. Wait for the user's answers in the next message before proceeding.",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Unique identifier for this question flow",
        },
        title: {
          type: "string",
          description: "Overall title for the question flow",
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique step ID" },
              title: { type: "string", description: "Question text" },
              description: {
                type: "string",
                description: "Additional context for the question",
              },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Option ID" },
                    label: { type: "string", description: "Option label" },
                    description: {
                      type: "string",
                      description: "Option description",
                    },
                  },
                  required: ["id", "label"],
                },
                description: "Available answers for this step",
              },
            },
            required: ["id", "title", "options"],
          },
          description: "Question steps",
        },
      },
      required: ["id", "title", "steps"],
    },
  },
];

const FRONTEND_TOOL_PLACEHOLDERS: Record<string, string> = {
  show_chart:
    "[Chart rendered as interactive widget to user. Do NOT describe the chart data in text — the user can see it.]",
  show_data_table:
    "[Data table rendered as interactive widget to user. Do NOT repeat the table data in text — the user can see it.]",
  show_plan:
    "[Plan rendered as interactive widget to user. Do NOT repeat the steps as a list — the user can see them.]",
  show_stats:
    "[Stats rendered as interactive widget to user. Do NOT repeat the metrics in text — the user can see them.]",
  show_options:
    "[Options presented to user as clickable buttons. WAIT for the user's selection in the next message. Do NOT list the options as text or make a choice for the user.]",
  ask_questions:
    "[Question flow presented to user as interactive wizard. WAIT for the user's answers in the next message. Do NOT list the questions as text or answer them yourself.]",
};

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
 * - Production: request origin must be in CLIENT_ORIGIN (single URL or comma-separated list).
 * - Development: echoes back any localhost origin so Vite's
 *   dynamic port assignment doesn't break preflight checks.
 * No trailing slashes in CLIENT_ORIGIN; add both alias and deployment URLs for Vercel.
 */
function getAllowedOrigin(request: Request): string {
  const normalizeOrigin = (origin: string): string =>
    origin.endsWith("/") ? origin.slice(0, -1) : origin;

  const rawRequestOrigin = request.headers.get("Origin") ?? "";
  const requestOrigin = normalizeOrigin(rawRequestOrigin);
  const configured = process.env.CLIENT_ORIGIN;
  const allowed = configured
    ? configured
        .split(",")
        .map((o) => normalizeOrigin(o.trim()))
        .filter(Boolean)
    : [];

  if (requestOrigin && allowed.includes(requestOrigin)) {
    return requestOrigin;
  }

  if (/^http:\/\/localhost(:\d+)?$/.test(requestOrigin)) {
    return requestOrigin;
  }

  return allowed[0] ?? "http://localhost:5173";
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
  // NOTE: Gemini 3 does not support combining google_search with
  // function_declarations in the same request. When custom function
  // declarations are present, we use those and skip google_search.
  // When no function declarations exist, we fall back to google_search only.
  const allFunctionDeclarations = [
    ...FRONTEND_TOOL_DECLARATIONS,
    ...geminiToolDeclarations,
  ];
  const tools: Array<Record<string, unknown>> = [];
  if (allFunctionDeclarations.length > 0) {
    tools.push({ function_declarations: allFunctionDeclarations });
  } else {
    tools.push({ google_search: {} });
  }

  const geminiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const frontendToolInstructions = `

## Interactive UI Tools

You have access to frontend tools that render rich interactive components in the chat interface. Use them to enhance your responses:

- **show_chart**: For numerical trends, comparisons, time-series. Use bar/line/area/pie types.
- **show_data_table**: For structured data like supplier lists, comparison matrices.
- **show_plan**: For multi-step workflows, analysis phases, compliance reviews.
- **show_stats**: For KPI dashboards, key metrics, performance indicators.
- **show_options**: When you need the user to choose between approaches. WAIT for their response.
- **ask_questions**: When you need multiple answers before proceeding. WAIT for their response.

### Rules for frontend tools:
1. After calling a display tool (chart, table, plan, stats), do NOT repeat the data as text — the user can see the widget.
2. After calling an interactive tool (options, questions), STOP and WAIT for the user's next message with their selection.
3. Use these tools proactively when data would be better visualized than described in text.
4. You may call multiple display tools in one response (e.g., a chart AND a table).
5. Prefer show_options over listing choices as "A) ... B) ... C) ..." in text.`;

  const systemInstruction = {
    parts: [
      {
        text:
          (systemMessage?.content ?? prompt.prompt) + frontendToolInstructions,
      },
    ],
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
          // Collect all model parts including thoughts (with signatures)
          // Gemini 3 requires thought signatures to be passed back in
          // the model turn during function calling round-trips.
          const modelParts: Array<Record<string, unknown>> = [];

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
                    // Collect every part for the model turn (thought
                    // signatures, function calls, text — all of it)
                    modelParts.push(part);

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

          // --- Execute tool calls ---
          emit({ status: "tool_calling" });

          // Append model's full turn including thought signatures.
          // Gemini 3 requires thought signatures to be passed back
          // during function calling round-trips for chain-of-reasoning.
          runContents.push({
            role: "model",
            parts: modelParts,
          });

          // Execute each tool and build responses
          const functionResponseParts: Array<Record<string, unknown>> = [];

          for (const fc of functionCalls) {
            const toolCallId = `${fc.name}_${Date.now()}`;

            // Check if this is a frontend tool (renders UI on client)
            if (FRONTEND_TOOL_NAMES.has(fc.name)) {
              const placeholder =
                FRONTEND_TOOL_PLACEHOLDERS[fc.name] ??
                "[Rendered as interactive widget to user]";

              // Emit as completed tool call with args as result
              // (frontend uses args to render the component)
              emit({
                tool_call: {
                  toolCallId,
                  name: fc.name,
                  args: fc.args,
                  result: JSON.stringify(fc.args),
                },
              });

              functionResponseParts.push({
                functionResponse: {
                  name: fc.name,
                  response: { content: placeholder },
                },
              });
              continue;
            }

            // MCP tool call
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
