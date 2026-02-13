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

export interface DetectedIntent {
  explicitTool: string | null;
  isDocumentDrafting: boolean;
  isNarrativeOnly: boolean;
  isOffTopic: boolean;
  detectedIntent: string; // Human-readable label
}

export interface DataSourceEvent {
  type: "vector_search" | "knowledge_graph" | "prompt_enhanced";
  status: "complete" | "error";
  // vector_search fields
  resultCount?: number;
  topScore?: number;
  durationMs?: number;
  documents?: Array<{ score: number; jsonPath?: string; snippet: string }>;
  // knowledge_graph fields
  nodeCount?: number;
  relationshipCount?: number;
  entities?: Array<{ labels: string[]; name: string }>;
  // prompt_enhanced fields
  modifications?: string[];
  // error field
  error?: string;
}

export interface RoundEvent {
  current: number;
  maxRounds: number;
  status: "started" | "complete";
  toolCalls?: Array<{ name: string; isFrontendTool: boolean }>;
}

export interface StreamingStatusContextValue {
  status: StreamStatus;
  isRunning: boolean;
  text: string;
  sources: Array<{ uri: string; title: string }>;
  toolCalls: ToolCallState[];
  detectedIntent: DetectedIntent | null;
  dataSources: DataSourceEvent[];
  currentRound: RoundEvent | null;
  roundHistory: RoundEvent[];
  showActivityPanel: boolean;
  toggleActivityPanel: () => void;
}

const StreamingStatusContext =
  createContext<StreamingStatusContextValue | null>(null);

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
      detectedIntent: null,
      dataSources: [],
      currentRound: null,
      roundHistory: [],
      showActivityPanel: false,
      toggleActivityPanel: () => {},
    }
  );
}

export { StreamingStatusContext };
