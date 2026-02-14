import { useState } from "react";
import { useStreamingStatus } from "@/contexts/StreamingStatusContext";
import { useThreadRuntime } from "@assistant-ui/react";
import { BarChart3, Table, LayoutDashboard, GitBranch } from "lucide-react";

const HINT_CONFIG: Record<string, { icon: typeof BarChart3; message: string }> =
  {
    show_chart: {
      icon: BarChart3,
      message: "Show this as a chart",
    },
    show_data_table: {
      icon: Table,
      message: "Show this as a table",
    },
    show_stats: {
      icon: LayoutDashboard,
      message: "Show this as a dashboard",
    },
    show_plan: {
      icon: GitBranch,
      message: "Show this as a plan",
    },
  };

export function VisualizationOffer() {
  const { visualizationOffer, isRunning } = useStreamingStatus();
  const threadRuntime = useThreadRuntime();
  const [clicked, setClicked] = useState(false);

  // Show only after streaming completes and offer exists
  if (isRunning || !visualizationOffer || clicked) return null;

  const config = HINT_CONFIG[visualizationOffer.hint] ?? {
    icon: BarChart3,
    message: "Visualize this",
  };
  const Icon = config.icon;

  const handleClick = () => {
    setClicked(true);
    threadRuntime.append({
      role: "user",
      content: [{ type: "text", text: config.message }],
    });
  };

  return (
    <button
      onClick={handleClick}
      className="mt-2 inline-flex items-center gap-2 rounded-2xl border border-l-[3px] border-l-maslow-teal bg-[#0A0A0A] px-4 py-3 text-sm text-[color:var(--tw-ring-offset-color)] transition-colors hover:opacity-90 dark:bg-[#EBF7F4]/15 dark:text-foreground cursor-pointer"
    >
      <Icon className="size-4 text-maslow-teal" />
      <span className="font-medium">{visualizationOffer.label}</span>
    </button>
  );
}
