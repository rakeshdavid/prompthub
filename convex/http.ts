import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

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
  "generate_document",
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
  {
    name: "generate_document",
    description:
      "Generate a structured document (PRD, proposal, contract, brief, etc.) based on user requirements and SOW knowledge graph. Use this when the user asks to draft, write, create, or generate a document. The document renders as an editable component with source citations.",
    parameters: {
      type: "object",
      properties: {
        documentType: {
          type: "string",
          enum: ["PRD", "proposal", "contract", "brief", "SOW", "requirements"],
          description: "Type of document to generate",
        },
        title: {
          type: "string",
          description: "Document title",
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique section ID" },
              title: { type: "string", description: "Section heading" },
              content: {
                type: "string",
                description: "Section content in markdown",
              },
              sources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    documentId: { type: "string" },
                    jsonPath: { type: "string" },
                    snippet: { type: "string" },
                  },
                },
                description: "SOW sources referenced in this section",
              },
            },
            required: ["id", "title", "content"],
          },
          description: "Document sections",
        },
        metadata: {
          type: "object",
          properties: {
            objective: { type: "string" },
            scope: { type: "string" },
            roles: { type: "array", items: { type: "string" } },
            slas: { type: "string" },
          },
          description: "Document metadata from Q&A",
        },
      },
      required: ["documentType", "title", "sections"],
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
  generate_document:
    "[Document rendered as editable component with source citations. The user can edit sections and see which SOWs informed each part.]",
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
// Prompt Enhancement
// ---------------------------------------------------------------------------

/**
 * Enhances prompts using token anchoring, constraint pinning, and structure improvements.
 * Non-destructive: only adds/repositions content, never removes author's original text.
 *
 * Techniques applied:
 * - Token anchoring: Ensures persona/role at start, constraints/output format at end
 * - Constraint pinning: Moves critical constraints to end for recency bias
 * - Structure gap detection: Adds minimal output format if missing
 * - Constraint sharpening: Converts vague constraints to specific ones where possible
 */
function enhancePrompt(promptText: string): string {
  if (!promptText || promptText.trim().length === 0) {
    return promptText;
  }

  const trimmed = promptText.trim();
  const lower = trimmed.toLowerCase();

  // Extract components
  let personaSection = "";
  let mainContent = "";
  let constraintsSection = "";
  let outputFormatSection = "";

  // Detect persona/role statement (typically at start, contains "You are", "You are a", "Role:", etc.)
  const personaPatterns = [
    /^You are [^.\n]+(?:\.|:)/i,
    /^You are a [^.\n]+(?:\.|:)/i,
    /^Role:?\s*[^\n]+/i,
    /^Persona:?\s*[^\n]+/i,
  ];

  let personaMatch: RegExpMatchArray | null = null;
  for (const pattern of personaPatterns) {
    personaMatch = trimmed.match(pattern);
    if (personaMatch) break;
  }

  if (personaMatch) {
    personaSection = personaMatch[0].trim();
    mainContent = trimmed.slice(personaMatch[0].length).trim();
  } else {
    mainContent = trimmed;
  }

  // Extract constraints section (look for "Constraints:", "Constraints", "Rules:", etc.)
  const constraintsPatterns = [
    /(?:^|\n)##?\s*Constraints?:?\s*\n([\s\S]+?)(?=\n##?\s*|$)/i,
    /(?:^|\n)Constraints?:?\s*\n([\s\S]+?)(?=\n##?\s*|$)/i,
    /(?:^|\n)Rules?:?\s*\n([\s\S]+?)(?=\n##?\s*|$)/i,
  ];

  let constraintsMatch: RegExpMatchArray | null = null;
  for (const pattern of constraintsPatterns) {
    constraintsMatch = mainContent.match(pattern);
    if (constraintsMatch) break;
  }

  if (constraintsMatch) {
    constraintsSection = constraintsMatch[1].trim();
    // Remove constraints from main content (will be repositioned to end)
    const matchedPattern = constraintsPatterns.find((p) =>
      mainContent.match(p),
    );
    if (matchedPattern) {
      mainContent = mainContent.replace(matchedPattern, "").trim();
    }
  }

  // Extract output format section
  const outputFormatPatterns = [
    /(?:^|\n)##?\s*Output Format:?\s*\n([\s\S]+?)(?=\n##?\s*|$)/i,
    /(?:^|\n)Output Format:?\s*\n([\s\S]+?)(?=\n##?\s*|$)/i,
    /(?:^|\n)##?\s*Format:?\s*\n([\s\S]+?)(?=\n##?\s*|$)/i,
  ];

  let outputFormatMatch: RegExpMatchArray | null = null;
  let matchedOutputPattern: RegExp | null = null;
  for (const pattern of outputFormatPatterns) {
    outputFormatMatch = mainContent.match(pattern);
    if (outputFormatMatch) {
      matchedOutputPattern = pattern;
      break;
    }
  }

  if (outputFormatMatch && matchedOutputPattern) {
    outputFormatSection = outputFormatMatch[1].trim();
    // Remove output format from main content (will be repositioned to end)
    mainContent = mainContent.replace(matchedOutputPattern, "").trim();
  }

  // Constraint sharpening: Convert vague constraints to specific ones
  function sharpenConstraints(constraints: string): string {
    let sharpened = constraints;

    // "Be concise" → "Keep each section under 150 words"
    if (
      /\bbe\s+concise\b/i.test(sharpened) &&
      !/\d+\s+words/i.test(sharpened)
    ) {
      sharpened = sharpened.replace(
        /\bbe\s+concise\b/gi,
        "Keep each section under 150 words",
      );
    }

    // "Be professional" → "Use executive-ready language suitable for C-suite review"
    if (
      /\bbe\s+professional\b/i.test(sharpened) &&
      !/executive/i.test(sharpened)
    ) {
      sharpened = sharpened.replace(
        /\bbe\s+professional\b/gi,
        "Use executive-ready language suitable for C-suite review",
      );
    }

    // "Keep it brief" → "Limit response to 500 words total"
    if (
      /\bkeep\s+it\s+brief\b/i.test(sharpened) &&
      !/\d+\s+words/i.test(sharpened)
    ) {
      sharpened = sharpened.replace(
        /\bkeep\s+it\s+brief\b/gi,
        "Limit response to 500 words total",
      );
    }

    return sharpened;
  }

  // Structure gap detection: Add minimal output format if missing
  const hasOutputFormat =
    outputFormatSection.length > 0 ||
    lower.includes("output format") ||
    lower.includes("format:") ||
    lower.includes("structure your") ||
    lower.includes("provide") ||
    lower.includes("include the following");

  // Build enhanced prompt with token anchoring
  const parts: string[] = [];

  // 1. Persona at start (token anchor - highest attention)
  if (personaSection) {
    parts.push(personaSection);
  }

  // 2. Main content (core task/instructions)
  if (mainContent) {
    parts.push(mainContent);
  }

  // 3. Output format at end (recency anchor - second highest attention)
  if (outputFormatSection) {
    parts.push(`\n\n## Output Format\n${outputFormatSection}`);
  } else if (!hasOutputFormat && mainContent.length > 200) {
    // Add minimal output format if missing and prompt is substantial
    parts.push(
      "\n\n## Output Format\nStructure your response with clear sections using markdown formatting (headers, bold, bullets) for readability. End with actionable next steps.",
    );
  }

  // 4. Constraints at very end (recency anchor - highest attention for compliance)
  if (constraintsSection) {
    const sharpened = sharpenConstraints(constraintsSection);
    parts.push(`\n\n## Constraints\n${sharpened}`);
  } else if (
    !lower.includes("constraint") &&
    !lower.includes("do not") &&
    !lower.includes("avoid") &&
    mainContent.length > 200
  ) {
    // Add minimal constraints if missing
    parts.push(
      "\n\n## Constraints\n- Use executive-ready language\n- Use markdown formatting for readability\n- End with clear next steps",
    );
  }

  return parts.join("\n\n").trim();
}

/**
 * Detects user intent from message content to determine response mode and tool availability.
 * Intent categories (in priority order):
 * 1. explicitTool - user asked for a specific visualization
 * 2. isDocumentDrafting - user wants to draft/generate a document
 * 3. isNarrativeOnly - user explicitly asked for text/narrative only
 * 4. isOffTopic - query is unrelated to the prompt's purpose
 * 5. isDataHeavy - query genuinely needs visual tools (comparisons, trends, rankings)
 * 6. isConversational - DEFAULT: qualitative questions, explanations, assessments
 */
function detectUserIntent(userMessage: string): {
  explicitTool: string | null;
  isDocumentDrafting: boolean;
  isNarrativeOnly: boolean;
  isOffTopic: boolean;
  isDataHeavy: boolean;
  isConversational: boolean;
  visualizationHint: string | null;
} {
  // Explicit component requests
  const explicitPatterns = {
    table:
      /\b(?:put|show|display|create|format).*(?:in|as|with).*table|table.*format|tabular/i,
    chart:
      /\b(?:show|create|display|visualize|graph).*(?:chart|graph|visualization)|chart.*of|graph.*of/i,
    plan: /\b(?:create|show|display|build).*plan|plan.*for|multi.*step|workflow|roadmap/i,
    options:
      /\b(?:give|show|what|list).*options|options.*for|choices|alternatives/i,
    stats: /\b(?:show|display|give).*stats|statistics|metrics.*summary/i,
  };

  let explicitTool: string | null = null;
  for (const [key, pattern] of Object.entries(explicitPatterns)) {
    if (pattern.test(userMessage)) {
      explicitTool =
        key === "table"
          ? "show_data_table"
          : key === "chart"
            ? "show_chart"
            : key === "plan"
              ? "show_plan"
              : key === "options"
                ? "show_options"
                : key === "stats"
                  ? "show_stats"
                  : null;
      break; // First match wins
    }
  }

  // Document drafting (expanded beyond PRD)
  const documentDraftingPattern =
    /\b(?:draft|write|create|generate|compose|build).*(?:prd|proposal|contract|brief|document|requirements|spec|sow|statement.*of.*work|product.*requirement|project.*requirement)/i;
  const isDocumentDrafting = documentDraftingPattern.test(userMessage);

  // Narrative-only requests
  const narrativePattern =
    /\b(?:write|provide|give).*(?:summary|narrative|prose|paragraph|text.*only|no.*charts|no.*tables)/i;
  const isNarrativeOnly = narrativePattern.test(userMessage);

  // Off-topic detection
  const offTopicPattern =
    /\b(?:weather|time.*in|what.*day|unrelated|off.*topic|how.*are.*you)/i;
  const isOffTopic = offTopicPattern.test(userMessage);

  // Data-heavy detection: queries that genuinely benefit from visualization
  const dataHeavyPatterns = [
    /\bcompare\b.*\b(?:across|between|vs\.?|versus)\b/i,
    /\b(?:trend|trends)\b.*\b(?:over time|quarterly|monthly|yearly|annual)\b/i,
    /\bbreakdown\b.*\bby\b/i,
    /\btop\s+\d+\b.*\b(?:rank|list|competitor|company|vendor|supplier)/i,
    /\b(?:revenue|margin|cost|spend|price|rate)\b.*\b(?:comparison|compare|benchmark|vs)/i,
    /\b(?:market share|growth rate|CAGR)\b.*\b(?:across|by|compare|vs)/i,
    /\b(?:Q[1-4]|quarter|FY\d{2,4})\b.*\b(?:compare|vs|trend|growth)/i,
    /\b(?:forecast|project|predict)\b.*\b(?:revenue|demand|volume|growth)\b/i,
    /\b(?:year.over.year|YoY|MoM|QoQ)\b/i,
    /\b(?:sensitivity|scenario)\s+analysis\b/i,
  ];
  const isDataHeavy = dataHeavyPatterns.some((p) => p.test(userMessage));

  // Conversational: the default when no other intent matches
  const isConversational =
    !explicitTool &&
    !isDocumentDrafting &&
    !isDataHeavy &&
    !isNarrativeOnly &&
    !isOffTopic;

  // Visualization hint: for conversational queries, suggest which tool would be relevant
  let visualizationHint: string | null = null;
  if (isConversational) {
    const lower = userMessage.toLowerCase();
    if (
      /\b(?:competitor|medtronic|stryker|abbott|boston scientific|zimmer)\b/i.test(
        userMessage,
      ) &&
      /\b(?:advantage|strength|weakness|position|compare|versus|vs)\b/i.test(
        userMessage,
      )
    ) {
      visualizationHint = "show_data_table";
    } else if (/\b(?:metric|kpi|performance|score|rate)\b/i.test(userMessage)) {
      visualizationHint = "show_stats";
    } else if (/\b(?:trend|growth|decline|change)\b/i.test(userMessage)) {
      visualizationHint = "show_chart";
    } else if (
      /\b(?:step|phase|process|workflow|approach)\b/i.test(userMessage)
    ) {
      visualizationHint = "show_plan";
    } else if (
      lower.includes("supplier") ||
      lower.includes("vendor") ||
      lower.includes("pricing") ||
      lower.includes("cost")
    ) {
      visualizationHint = "show_data_table";
    }
  }

  return {
    explicitTool,
    isDocumentDrafting,
    isNarrativeOnly,
    isOffTopic,
    isDataHeavy,
    isConversational,
    visualizationHint,
  };
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

  const systemMessage = messages.find(
    (m: { role: string }) => m.role === "system",
  );

  // Check if this is a SOW / Procurement Intelligence prompt (by slug or category)
  const isSowReviewerPrompt =
    prompt.slug.includes("sow-reviewer") ||
    prompt.slug === "procurement-intelligence-sow" ||
    prompt.categories.includes("SOW Reviewer") ||
    prompt.title.toLowerCase().includes("sow reviewer") ||
    prompt.title.toLowerCase().includes("procurement intelligence sow");

  // Get the last user message for RAG search
  const lastUserMessage = messages
    .filter((m: { role: string }) => m.role === "user")
    .pop();

  // Perform hybrid RAG search if this is a SOW Reviewer prompt and there's a user query
  let ragContext = "";
  // Collect data source events to emit once the SSE stream opens
  const pendingDataSources: Array<Record<string, unknown>> = [];
  if (isSowReviewerPrompt && lastUserMessage) {
    const ragStartTime = Date.now();
    try {
      const ragResults = await ctx.runAction(api.sowRag.hybridSearch, {
        queryText: lastUserMessage.content,
        vectorLimit: 5,
        includeGraph: true, // Include Neo4j graph search
      });
      const ragDurationMs = Date.now() - ragStartTime;

      // Format RAG results as context
      if (ragResults.vectorResults.length > 0) {
        ragContext = "\n\n## Relevant SOW Document Context:\n\n";
        ragResults.vectorResults.forEach((result: any, index: number) => {
          ragContext += `[Document ${index + 1}, Score: ${result.score.toFixed(3)}]\n`;
          ragContext += `${result.content}\n\n`;
          if (result.metadata?.jsonPath) {
            ragContext += `Source: ${result.metadata.jsonPath}\n`;
          }
          ragContext += "---\n\n";
        });

        // Collect vector search data source event
        pendingDataSources.push({
          type: "vector_search",
          status: "complete",
          resultCount: ragResults.vectorResults.length,
          topScore: ragResults.vectorResults[0]?.score ?? 0,
          durationMs: ragDurationMs,
          documents: ragResults.vectorResults.slice(0, 3).map((r: any) => ({
            score: r.score,
            jsonPath: r.metadata?.jsonPath,
            snippet: r.content.substring(0, 150),
          })),
        });
      }

      // Add graph context if available
      if (ragResults.graphResults && ragResults.graphResults.nodes.length > 0) {
        ragContext += "\n## Knowledge Graph Context:\n\n";
        ragContext += `Found ${ragResults.graphResults.nodes.length} related entities and ${ragResults.graphResults.relationships.length} relationships.\n\n`;

        // Include key entities
        const keyEntities = ragResults.graphResults.nodes.slice(0, 5);
        keyEntities.forEach((node: any) => {
          ragContext += `- ${node.labels.join(", ")}: ${JSON.stringify(node.properties)}\n`;
        });
        ragContext += "\n";

        // Collect knowledge graph data source event
        pendingDataSources.push({
          type: "knowledge_graph",
          status: "complete",
          nodeCount: ragResults.graphResults.nodes.length,
          relationshipCount: ragResults.graphResults.relationships.length,
          entities: keyEntities.map((n: any) => ({
            labels: n.labels,
            name: JSON.stringify(n.properties).substring(0, 100),
          })),
          durationMs: ragDurationMs,
        });
      }
    } catch (error) {
      console.error("RAG search error:", error);
      const ragDurationMs = Date.now() - ragStartTime;
      // Emit error data source event
      pendingDataSources.push({
        type: "vector_search",
        status: "error",
        error: error instanceof Error ? error.message : "RAG search failed",
        durationMs: ragDurationMs,
      });
      // Continue without RAG context if search fails
    }
  }

  // Detect user intent from last message
  const userMessageText = lastUserMessage?.content || "";
  let intent = detectUserIntent(userMessageText);

  // Use prompt's responseMode as tie-breaker for conversational intent
  const responseMode = (prompt as { responseMode?: string }).responseMode;
  if (intent.isConversational && responseMode) {
    if (responseMode === "visual_first") {
      // Promote to data-heavy so tools are included
      intent = { ...intent, isConversational: false, isDataHeavy: true };
    } else if (responseMode === "document") {
      intent = {
        ...intent,
        isConversational: false,
        isDocumentDrafting: true,
      };
    } else if (responseMode === "interactive") {
      // Interactive prompts self-manage tool selection via prompt instructions;
      // promote to data-heavy so all frontend + MCP tools are available
      intent = { ...intent, isConversational: false, isDataHeavy: true };
    }
    // text_first keeps the conversational default
  }

  // Check conversation history to detect if we're in a document drafting flow
  // Look for ask_questions tool calls in recent assistant messages (within last 5 messages)
  const recentAssistantMessages = messages
    .filter((m: { role: string }) => m.role === "assistant")
    .slice(-5);
  const isInDocumentDraftingFlow = recentAssistantMessages.some(
    (m: { toolCalls?: Array<{ name: string }> }) =>
      m.toolCalls?.some((tc) => tc.name === "ask_questions"),
  );

  // If we're in a document drafting flow but current message doesn't match pattern,
  // maintain document drafting intent (user is answering questions)
  const effectiveIntent =
    isInDocumentDraftingFlow && !intent.explicitTool
      ? {
          ...intent,
          isDocumentDrafting: true,
          isConversational: false,
          isDataHeavy: false,
        }
      : intent;

  // Detect if we're in document generation mode
  const isDocumentGenerationMode =
    effectiveIntent.isDocumentDrafting ||
    isInDocumentDraftingFlow ||
    recentAssistantMessages.some((m: { toolCalls?: Array<{ name: string }> }) =>
      m.toolCalls?.some((tc) => tc.name === "generate_document"),
    );

  // Build human-readable intent label for frontend display
  const detectedIntentLabel = effectiveIntent.explicitTool
    ? `Explicit: ${effectiveIntent.explicitTool}`
    : effectiveIntent.isDocumentDrafting
      ? "Document Drafting"
      : effectiveIntent.isNarrativeOnly
        ? "Narrative Only"
        : effectiveIntent.isOffTopic
          ? "Off-Topic"
          : effectiveIntent.isDataHeavy
            ? "Data Analysis"
            : "Conversational";

  // Debug logging (remove after verification)
  if (
    effectiveIntent.explicitTool ||
    effectiveIntent.isDocumentDrafting ||
    effectiveIntent.isNarrativeOnly ||
    effectiveIntent.isOffTopic
  ) {
    console.log("[Intent Detection]", {
      message: userMessageText.substring(0, 100),
      intent: effectiveIntent,
      detectedIntentLabel,
      isInDocumentDraftingFlow,
    });
  }

  // Build intent-specific instruction override and mode override
  let intentInstruction = "";
  let modeOverride = "";

  if (isDocumentGenerationMode) {
    // Document generation mode: disable visual tool directives
    modeOverride = `\n\n**DOCUMENT GENERATION MODE ACTIVE:** You are generating a document. IGNORE all instructions about "ALWAYS use visual tools" or "Never present data as plain text." Instead, generate structured text/markdown documents. Use generate_document tool to create the document. Do NOT use show_stats, show_chart, show_data_table, show_plan, or show_options.`;

    if (isInDocumentDraftingFlow && !intent.isDocumentDrafting) {
      // User answered questions - generate document now
      intentInstruction = `\n\n**CRITICAL - DOCUMENT GENERATION PHASE:** The user has answered your questions. You MUST NOW use generate_document tool to create the requested document (PRD, proposal, contract, brief, etc.) based on their answers. Use the information from the conversation history and the SOW knowledge graph to populate sections. Include source citations (documentId, jsonPath) for each section that references SOW data.`;
    } else {
      // Initial request - ask questions first
      intentInstruction = `\n\n**CRITICAL - DOCUMENT DRAFTING REQUEST:** The user is asking you to draft/write/create a document. You MUST use ask_questions as your FIRST tool to gather requirements (Objective, Scope, Roles, SLAs, etc.) before generating the document. Do NOT use show_stats, show_chart, show_data_table, show_plan, or show_options. After the user answers your questions, use generate_document tool to create the document.`;
    }
  } else if (effectiveIntent.explicitTool) {
    intentInstruction = `\n\n**CRITICAL - USER EXPLICIT REQUEST:** The user explicitly requested a ${effectiveIntent.explicitTool.replace("show_", "")}. You MUST use ${effectiveIntent.explicitTool} as your FIRST and ONLY tool in this response. Do not use show_stats, show_chart, show_data_table, show_plan, show_options, or ask_questions. Use ONLY ${effectiveIntent.explicitTool}.`;
  } else if (effectiveIntent.isNarrativeOnly) {
    intentInstruction = `\n\n**CRITICAL - NARRATIVE-ONLY REQUEST:** The user wants a text/narrative response. Do NOT use ANY visual tools (show_stats, show_chart, show_data_table, show_plan, show_options, ask_questions). Respond with prose/text only. No tools.`;
  } else if (effectiveIntent.isOffTopic) {
    intentInstruction = `\n\n**CRITICAL - OFF-TOPIC QUERY:** This query is unrelated to the prompt's purpose. Respond with text only explaining that you cannot help with this topic. Do NOT use ANY tools (show_stats, show_chart, show_data_table, show_plan, show_options, ask_questions). Text only.`;
  } else if (effectiveIntent.isConversational) {
    intentInstruction = `\n\nRespond with insightful, well-structured text using markdown formatting (headers, bold, bullets). Provide executive-ready analysis that answers the question directly. Do not attempt to use visualization tools — focus on clear, concise written intelligence.`;
  }

  const contents: Array<{
    role: string;
    parts: Array<Record<string, unknown>>;
  }> = messages
    .filter((m: { role: string }) => m.role !== "system")
    .map((m: { role: string; content: string }) => ({
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

  // Build Gemini tools array with intent-conditional frontend tool inclusion.
  // NOTE: Gemini 3 does not support combining google_search with
  // function_declarations in the same request. When custom function
  // declarations are present, we use those and skip google_search.
  // When no function declarations exist, we fall back to google_search only.
  //
  // Intent-based tool selection:
  // - isConversational: NO frontend tools (text-first, google_search fallback)
  // - isDataHeavy: ALL 7 frontend tools
  // - explicitTool: only the requested tool + generate_document
  // - isDocumentDrafting: ALL tools (PRDs benefit from charts/tables as generative UI)
  // - isNarrativeOnly / isOffTopic: NO frontend tools
  let selectedFrontendTools: typeof FRONTEND_TOOL_DECLARATIONS = [];

  if (effectiveIntent.isOffTopic || effectiveIntent.isNarrativeOnly) {
    selectedFrontendTools = [];
  } else if (effectiveIntent.isDocumentDrafting || isDocumentGenerationMode) {
    // Document drafting gets all tools — PRDs/proposals benefit from charts,
    // tables, and stats rendered as generative UI instead of raw JSON
    selectedFrontendTools = [...FRONTEND_TOOL_DECLARATIONS];
  } else if (effectiveIntent.explicitTool) {
    selectedFrontendTools = FRONTEND_TOOL_DECLARATIONS.filter(
      (t) =>
        t.name === effectiveIntent.explicitTool ||
        t.name === "generate_document",
    );
  } else if (effectiveIntent.isDataHeavy) {
    selectedFrontendTools = [...FRONTEND_TOOL_DECLARATIONS];
  } else {
    // isConversational: no frontend tools — text-first response
    selectedFrontendTools = [];
  }

  // For conversational/narrative/off-topic queries, use google_search only
  // (no function declarations) to prevent Gemini from hallucinating tool calls
  // from tool names mentioned in the prompt text.
  const skipFunctionCalling =
    effectiveIntent.isConversational ||
    effectiveIntent.isNarrativeOnly ||
    effectiveIntent.isOffTopic;

  const allFunctionDeclarations = skipFunctionCalling
    ? []
    : [...selectedFrontendTools, ...geminiToolDeclarations];

  const tools: Array<Record<string, unknown>> = [];
  if (allFunctionDeclarations.length > 0) {
    tools.push({ function_declarations: allFunctionDeclarations });
  } else {
    tools.push({ google_search: {} });
  }

  const geminiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

  // Behavioral preamble: quality standards (text-first, tools only when appropriate)
  const behavioralPreamble = `Deliver executive-ready analysis with actionable intelligence. Use markdown formatting (headers, bold, bullets) for readability. Structure every response for decision-makers: lead with insight (1-2 sentences), support with evidence, close with a clear next step.`;

  // Tool selection matrix: only included when tools are available and query warrants them
  const toolSelectionMatrix = `

## Interactive UI Tools

Use tools when data is genuinely better presented visually. For qualitative analysis, text is preferred.

**Tool Selection Matrix:**
- Quantitative metrics/KPIs → show_stats
- Trends/comparisons over time → show_chart (bar/line/area/pie)
- Structured lists/matrices → show_data_table
- Multi-phase workflows → show_plan
- User decision required → show_options (WAIT for selection)
- Multiple inputs needed → ask_questions (WAIT for answers)

**Response Flow:**
1. Open with 1-2 sentence analytical framing
2. Use visual tools when data benefits from visualization
3. Add supporting analysis in text as needed
4. Close with actionable next step

**Rules:**
- After calling a display tool, do NOT repeat the data as text — the user can see the widget
- After calling an interactive tool (options/questions), STOP and WAIT for the user's next message
- Keep prose sections under 150 words between tool calls
- Prefer show_options over listing choices as "A) ... B) ... C) ..." in text`;

  // Constraint pin: only for data-heavy queries where tools are available
  const constraintPin = `

**CRITICAL:** For this data-focused query, use visual tools to present quantitative findings. End every response with a clear next step.`;

  // Enhance prompt with token anchoring, constraint pinning, and structure improvements
  const rawPrompt = systemMessage?.content ?? prompt.prompt;
  const enhancedPrompt = enhancePrompt(rawPrompt) + ragContext;

  // Detect which prompt enhancement modifications were applied
  const enhancementModifications: string[] = [];
  if (enhancedPrompt !== rawPrompt + ragContext) {
    const rawLower = rawPrompt.toLowerCase();
    if (/^you are |^role:|^persona:/i.test(rawPrompt.trim()))
      enhancementModifications.push("token_anchoring");
    if (
      rawLower.includes("be concise") ||
      rawLower.includes("be professional") ||
      rawLower.includes("keep it brief")
    )
      enhancementModifications.push("constraints_sharpened");
    if (
      !rawLower.includes("output format") &&
      !rawLower.includes("format:") &&
      rawPrompt.trim().length > 200
    )
      enhancementModifications.push("structure_added");
    if (
      /(?:^|\n)##?\s*Constraints?/i.test(rawPrompt) ||
      /(?:^|\n)Rules?:/i.test(rawPrompt)
    )
      enhancementModifications.push("constraints_repositioned");
  }
  if (enhancementModifications.length > 0) {
    pendingDataSources.push({
      type: "prompt_enhanced",
      status: "complete",
      modifications: enhancementModifications,
    });
  }

  // Determine whether to include tool-related instructions
  const hasTools = selectedFrontendTools.length > 0;
  const includeToolMatrix =
    hasTools && !isDocumentGenerationMode && !effectiveIntent.isConversational;
  const includeConstraintPin =
    hasTools && effectiveIntent.isDataHeavy && !isDocumentGenerationMode;

  const systemInstruction = {
    parts: [
      {
        text:
          behavioralPreamble +
          "\n\n" +
          enhancedPrompt +
          (includeToolMatrix ? "\n\n" + toolSelectionMatrix : "") +
          (includeConstraintPin ? "\n\n" + constraintPin : "") +
          modeOverride + // Mode override comes before intent instruction
          intentInstruction, // Intent instruction at end for recency bias - overrides defaults
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
        // Emit detected intent early in the stream for frontend visualization
        emit({
          intent: {
            explicitTool: effectiveIntent.explicitTool,
            isDocumentDrafting: effectiveIntent.isDocumentDrafting,
            isNarrativeOnly: effectiveIntent.isNarrativeOnly,
            isOffTopic: effectiveIntent.isOffTopic,
            isDataHeavy: effectiveIntent.isDataHeavy,
            isConversational: effectiveIntent.isConversational,
            visualizationHint: effectiveIntent.visualizationHint,
            detectedIntent: detectedIntentLabel,
          },
        });

        // Emit collected data source events (RAG, KG, prompt enhancement)
        for (const ds of pendingDataSources) {
          emit({ data_source: ds });
        }

        const runContents = [...contents];
        let emittedThinking = false;
        let emittedSearching = false;
        let fullResponseText = "";
        const collectedSources: Array<{ uri: string; title: string }> = [];

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          // Emit round start event
          emit({
            round: {
              current: round + 1,
              maxRounds: MAX_TOOL_ROUNDS,
              status: "started",
            },
          });

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
                      fullResponseText += part.text;
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

          // Emit round complete event
          emit({
            round: {
              current: round + 1,
              maxRounds: MAX_TOOL_ROUNDS,
              status: "complete",
              toolCalls: functionCalls.map((fc) => ({
                name: fc.name,
                isFrontendTool: FRONTEND_TOOL_NAMES.has(fc.name),
              })),
            },
          });

          // Loop continues — Gemini will process the tool results
        }

        if (collectedSources.length > 0) {
          emit({ sources: collectedSources });
        }

        // Emit visualization offer for conversational responses with relevant hints
        if (
          effectiveIntent.isConversational &&
          effectiveIntent.visualizationHint &&
          fullResponseText.length > 200
        ) {
          const hintLabels: Record<string, string> = {
            show_data_table: "View as table",
            show_chart: "View as chart",
            show_stats: "View as dashboard",
            show_plan: "View as plan",
          };
          emit({
            visualization_offer: {
              hint: effectiveIntent.visualizationHint,
              label:
                hintLabels[effectiveIntent.visualizationHint] ??
                "Visualize this",
            },
          });
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
