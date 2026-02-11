import { createContext, useContext } from "react";

export type StreamStatus =
  | "idle"
  | "thinking"
  | "searching"
  | "generating"
  | "tool_calling";

export interface ToolCallState {
  toolCallId: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

export interface StreamingStatusContextValue {
  status: StreamStatus;
  isRunning: boolean;
  text: string;
  sources: Array<{ uri: string; title: string }>;
  toolCalls: ToolCallState[];
}

const StreamingStatusContext = createContext<StreamingStatusContextValue | null>(
  null,
);

export function useStreamingStatus(): StreamingStatusContextValue {
  const context = useContext(StreamingStatusContext);
  // Fallback to idle state if context not available
  return (
    context || {
      status: "idle",
      isRunning: false,
      text: "",
      sources: [],
      toolCalls: [],
    }
  );
}

export { StreamingStatusContext };
