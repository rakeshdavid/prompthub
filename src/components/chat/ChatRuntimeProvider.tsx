import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useAuth } from "@clerk/clerk-react";
import {
  useExternalStoreRuntime,
  AssistantRuntimeProvider,
  useAui,
  Suggestions,
  type ThreadMessageLike,
  type AppendMessage,
} from "@assistant-ui/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { WebSearchToolUI } from "./WebSearchToolUI";
import { ChartToolUI } from "./ChartToolUI";
import { DataTableToolUI } from "./DataTableToolUI";
import { PlanToolUI } from "./PlanToolUI";
import { StatsToolUI } from "./StatsToolUI";
import { OptionListToolUI } from "./OptionListToolUI";
import { QuestionFlowToolUI } from "./QuestionFlowToolUI";

/** Names of tools that render as frontend UI widgets */
const FRONTEND_TOOL_NAMES = new Set([
  "show_chart",
  "show_data_table",
  "show_plan",
  "show_stats",
  "show_options",
  "ask_questions",
]);

interface ChatRuntimeProviderProps {
  conversationId: Id<"conversations"> | null;
  promptId: Id<"prompts">;
  suggestedQueries?: string[];
  children: ReactNode;
}

type StreamStatus =
  | "idle"
  | "thinking"
  | "searching"
  | "generating"
  | "tool_calling";

interface ToolCallState {
  toolCallId: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

interface StreamingState {
  text: string;
  sources: Array<{ uri: string; title: string }>;
  status: StreamStatus;
  toolCalls: ToolCallState[];
}

/**
 * Converts a Convex message into assistant-ui's ThreadMessageLike format.
 * Assistant messages with sources get a tool-call/tool-result pair so
 * assistant-ui renders the WebSearchToolUI component. Persisted tool calls
 * are reconstructed so frontend tool UIs re-render on page reload.
 */
function convertConvexMessage(message: {
  _id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: Array<{ uri: string; title: string }>;
  toolCalls?: Array<{
    toolCallId: string;
    name: string;
    args: string;
    result?: string;
  }>;
}): ThreadMessageLike | null {
  if (message.role === "system") return null;

  if (message.role === "user") {
    return {
      role: "user",
      id: message._id,
      content: [{ type: "text", text: message.content }],
    };
  }

  // Assistant message
  const content: ThreadMessageLike["content"] = [];

  if (message.sources && message.sources.length > 0) {
    content.push({
      type: "tool-call",
      toolCallId: `search_${message._id}`,
      toolName: "web_search",
      args: {},
      result: { sources: message.sources },
    });
  }

  // Reconstruct persisted tool calls (frontend tools + MCP tools)
  if (message.toolCalls && message.toolCalls.length > 0) {
    for (const tc of message.toolCalls) {
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(tc.args);
      } catch {
        // Keep empty args
      }

      content.push({
        type: "tool-call",
        toolCallId: tc.toolCallId,
        toolName: tc.name,
        args: parsedArgs,
        ...(tc.result !== undefined ? { result: tc.result } : {}),
      });
    }
  }

  content.push({ type: "text", text: message.content });

  return {
    role: "assistant",
    id: message._id,
    content,
    status: { type: "complete" },
  };
}

export function ChatRuntimeProvider({
  conversationId,
  promptId,
  suggestedQueries,
  children,
}: ChatRuntimeProviderProps) {
  const { getToken } = useAuth();
  const sendMessage = useMutation(api.chat.sendMessage);
  const saveAssistantMessage = useMutation(api.chat.saveAssistantMessage);

  const dbMessages = useQuery(
    api.chat.getMessages,
    conversationId ? { conversationId } : "skip",
  );

  const [isRunning, setIsRunning] = useState(false);
  const [streaming, setStreaming] = useState<StreamingState>({
    text: "",
    sources: [],
    status: "idle",
    toolCalls: [],
  });
  const abortRef = useRef<AbortController | null>(null);

  // On-demand fallback: generate suggestions if prompt has none
  const generateSuggestions = useAction(
    api.suggestions.generateSuggestionsForPrompt,
  );
  const triggeredRef = useRef(false);
  useEffect(() => {
    if (
      !triggeredRef.current &&
      (!suggestedQueries || suggestedQueries.length === 0)
    ) {
      triggeredRef.current = true;
      generateSuggestions({ promptId }).catch(() => {
        // Suggestion generation is best-effort
      });
    }
  }, [suggestedQueries, promptId, generateSuggestions]);

  // Convert persisted Convex messages
  const persistedMessages: ThreadMessageLike[] = (dbMessages ?? [])
    .map(convertConvexMessage)
    .filter((m): m is ThreadMessageLike => m !== null);

  // Build the in-flight streaming message (if active)
  const allMessages: ThreadMessageLike[] = [...persistedMessages];
  if (isRunning || streaming.text) {
    const streamContent: ThreadMessageLike["content"] = [];

    // Show thinking indicator as a tool call in "running" state
    if (streaming.status === "thinking" && !streaming.text) {
      streamContent.push({
        type: "tool-call",
        toolCallId: "thinking_active",
        toolName: "thinking",
        args: {},
      });
    }

    // Show search indicator
    if (
      streaming.status === "searching" ||
      (streaming.sources.length > 0 && !streaming.text)
    ) {
      streamContent.push({
        type: "tool-call",
        toolCallId: "search_active",
        toolName: "web_search",
        args: {},
        ...(streaming.sources.length > 0
          ? { result: { sources: streaming.sources } }
          : {}),
      });
    }

    // MCP tool call indicators
    for (const tc of streaming.toolCalls) {
      streamContent.push({
        type: "tool-call",
        toolCallId: tc.toolCallId,
        toolName: tc.name,
        args: tc.args,
        ...(tc.result !== undefined ? { result: tc.result } : {}),
      });
    }

    if (streaming.text) {
      // If sources arrived, add them as completed tool result
      if (streaming.sources.length > 0 && streaming.status !== "searching") {
        streamContent.push({
          type: "tool-call",
          toolCallId: "search_active",
          toolName: "web_search",
          args: {},
          result: { sources: streaming.sources },
        });
      }
      streamContent.push({ type: "text", text: streaming.text });
    }

    if (streamContent.length > 0) {
      allMessages.push({
        role: "assistant",
        id: "streaming",
        content: streamContent,
        status: isRunning ? { type: "running" } : { type: "complete" },
      });
    }
  }

  const onNew = useCallback(
    async (message: AppendMessage) => {
      if (!conversationId) return;

      const textPart = message.content.find((p) => p.type === "text");
      if (!textPart || textPart.type !== "text") return;
      const input = textPart.text;

      await sendMessage({ conversationId, content: input });

      setIsRunning(true);
      setStreaming({ text: "", sources: [], status: "idle", toolCalls: [] });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const token = await getToken({ template: "convex" });
        const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
        const httpUrl = convexUrl.replace(".cloud", ".site");

        const response = await fetch(`${httpUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ conversationId }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("Stream request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let collectedSources: Array<{ uri: string; title: string }> = [];
        const collectedToolCalls: Array<{
          toolCallId: string;
          name: string;
          args: string;
          result?: string;
        }> = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.status) {
                setStreaming((prev) => ({
                  ...prev,
                  status: parsed.status as StreamStatus,
                }));
              } else if (parsed.error) {
                fullText += `\n\nError: ${parsed.error}`;
                setStreaming((prev) => ({ ...prev, text: fullText }));
              } else if (parsed.sources) {
                collectedSources = parsed.sources;
                setStreaming((prev) => ({
                  ...prev,
                  sources: collectedSources,
                }));
              } else if (parsed.tool_call) {
                const tc = parsed.tool_call as ToolCallState;
                setStreaming((prev) => {
                  const idx = prev.toolCalls.findIndex(
                    (t) => t.name === tc.name && !t.result,
                  );
                  if (idx >= 0 && tc.result) {
                    const updated = [...prev.toolCalls];
                    updated[idx] = {
                      ...updated[idx],
                      result: tc.result,
                      toolCallId: tc.toolCallId,
                    };
                    return { ...prev, toolCalls: updated };
                  }
                  return { ...prev, toolCalls: [...prev.toolCalls, tc] };
                });

                // Collect frontend tool calls for persistence
                if (FRONTEND_TOOL_NAMES.has(tc.name) && tc.result) {
                  collectedToolCalls.push({
                    toolCallId: tc.toolCallId,
                    name: tc.name,
                    args: JSON.stringify(tc.args),
                    result: tc.result,
                  });
                }
              } else if (parsed.text) {
                fullText += parsed.text;
                setStreaming((prev) => ({ ...prev, text: fullText }));
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        if (fullText || collectedToolCalls.length > 0) {
          await saveAssistantMessage({
            conversationId,
            content: fullText || "(tool response)",
            sources: collectedSources.length > 0 ? collectedSources : undefined,
            toolCalls:
              collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
          });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // User cancelled
        } else {
          console.error("Stream error:", error);
        }
      } finally {
        setIsRunning(false);
        setStreaming({ text: "", sources: [], status: "idle", toolCalls: [] });
        abortRef.current = null;
      }
    },
    [conversationId, sendMessage, saveAssistantMessage, getToken],
  );

  const onCancel = useCallback(() => {
    abortRef.current?.abort();
    setIsRunning(false);
    setStreaming({ text: "", sources: [], status: "idle", toolCalls: [] });
  }, []);

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages: allMessages,
    onNew,
    onCancel,
    convertMessage: (m: ThreadMessageLike) => m,
  });

  // Register suggestions via useAui — this is how assistant-ui's
  // ThreadPrimitive.Suggestions picks them up (not via the runtime).
  const aui = useAui({
    suggestions: Suggestions(
      (suggestedQueries ?? []).map((query) => ({
        prompt: query,
        title: query,
      })),
    ),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime} aui={aui}>
      <WebSearchToolUI />
      <ChartToolUI />
      <DataTableToolUI />
      <PlanToolUI />
      <StatsToolUI />
      <OptionListToolUI />
      <QuestionFlowToolUI />
      {children}
    </AssistantRuntimeProvider>
  );
}
