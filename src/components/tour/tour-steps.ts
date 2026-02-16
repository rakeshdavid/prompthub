export interface TourStep {
  id: string;
  target?: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
  isVirtual?: boolean;
  /** When true, step is skipped on next if target element is not in DOM */
  skipIfMissing?: boolean;
}

export const DISCOVERY_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Agent Hub",
    description: "Browse, test, and share AI prompts.",
    isVirtual: true,
  },
  {
    id: "search",
    target: '[data-tour="search-bar"]',
    title: "Search Prompts",
    description: "Find prompts by keyword.",
    placement: "bottom",
  },
  {
    id: "departments",
    target: '[data-tour="department-pills"]',
    title: "Filter by Department",
    description: "Filter by team.",
    placement: "bottom",
  },
  {
    id: "prompt-card",
    target: '[data-tour="prompt-card"]',
    title: "Prompt Cards",
    description: "Each card shows prompt details. Click Run to test with AI.",
    placement: "right",
  },
  {
    id: "share-prompt",
    target: '[data-tour="share-prompt"]',
    title: "Share Your Prompts",
    description: "Contribute your own prompts.",
    placement: "top",
  },
];

export const CHAT_STEPS: TourStep[] = [
  {
    id: "chat-suggestions",
    target: '[data-tour="chat-suggestions"]',
    title: "Suggested Queries",
    description: "Start with a pre-built analysis or type your own question.",
    placement: "bottom",
    skipIfMissing: true,
  },
  {
    id: "chat-composer",
    target: '[data-tour="chat-composer"]',
    title: "Ask Anything",
    description:
      "Type any question. The AI detects your intent and responds with charts, tables, plans, or Q&A wizards.",
    placement: "top",
  },
  {
    id: "chat-activity-toggle",
    target: '[data-tour="chat-activity-toggle"]',
    title: "Activity & Data Sources",
    description:
      "See which data sources the AI used — RAG documents, knowledge graph, tool calls.",
    placement: "bottom",
    skipIfMissing: true,
  },
  {
    id: "chat-done",
    title: "You're Ready",
    description:
      "Try the Procurement Intelligence SOW prompt for the full experience with RAG, Knowledge Graph, and interactive Q&A.",
    isVirtual: true,
  },
];
