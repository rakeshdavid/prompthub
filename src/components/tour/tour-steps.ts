export interface TourStep {
  id: string;
  target?: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
  isVirtual?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Agent Hub",
    description:
      "Your enterprise AI prompt library. Browse, test, and share prompts across departments.",
    isVirtual: true,
  },
  {
    id: "search",
    target: '[data-tour="search-bar"]',
    title: "Search Prompts",
    description:
      "Find prompts by keyword — searches titles, descriptions, and prompt text.",
    placement: "bottom",
  },
  {
    id: "departments",
    target: '[data-tour="department-pills"]',
    title: "Filter by Department",
    description:
      "Quick-filter prompts by team. Each department has its own color.",
    placement: "bottom",
  },
  {
    id: "categories",
    target: '[data-tour="category-filter"]',
    title: "Category & Sort",
    description:
      "Narrow results by category tags or sort by impact and recency.",
    placement: "bottom",
  },
  {
    id: "prompt-card",
    target: '[data-tour="prompt-card"]',
    title: "Prompt Cards",
    description:
      "Each card shows the prompt preview, department, categories, and upvote count.",
    placement: "right",
  },
  {
    id: "run-button",
    target: '[data-tour="run-button"]',
    title: "Test with AI",
    description:
      "Click Run to open an AI chat panel and test any prompt with real data.",
    placement: "top",
  },
  {
    id: "intent-detection",
    title: "Smart Intent Detection",
    description:
      "The AI automatically detects what you need — charts, tables, plans, comparisons — and formats responses accordingly.",
    isVirtual: true,
  },
  {
    id: "suggested-queries",
    title: "Suggested Queries",
    description:
      "Each prompt comes with AI-generated starting questions to help you explore its capabilities.",
    isVirtual: true,
  },
  {
    id: "activity-panel",
    title: "Activity & Data Sources",
    description:
      "See which data sources the AI consulted — RAG documents, Neo4j graphs, tool results — for full transparency.",
    isVirtual: true,
  },
  {
    id: "share-prompt",
    target: '[data-tour="share-prompt"]',
    title: "Share Your Prompts",
    description:
      "Contribute prompts to the library. Set them as public for everyone or private for your own use.",
    placement: "top",
  },
];
