import { Brain, Globe, Sparkles, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStreamingStatus,
  type StreamStatus,
} from "@/contexts/StreamingStatusContext";

interface StatusConfig {
  icon: typeof Brain;
  label: string;
  animation: string;
  iconColor: string;
}

const statusConfig: Record<Exclude<StreamStatus, "idle">, StatusConfig> = {
  thinking: {
    icon: Brain,
    label: "Analyzing request and planning approach...",
    animation: "animate-pulse",
    iconColor: "text-maslow-purple-light",
  },
  searching: {
    icon: Globe,
    label: "Searching knowledge base and web sources...",
    animation: "animate-spin",
    iconColor: "text-maslow-blue",
  },
  generating: {
    icon: Sparkles,
    label: "Generating response...",
    animation: "animate-pulse",
    iconColor: "text-maslow-teal",
  },
  tool_calling: {
    icon: Wrench,
    label: "Executing tools and preparing visualizations...",
    animation: "animate-bounce",
    iconColor: "text-maslow-orange",
  },
};

export function StreamingStatusBadge() {
  const { status, isRunning } = useStreamingStatus();

  if (!isRunning || status === "idle") return null;

  const config = statusConfig[status];

  return (
    <div className="mb-2 flex items-center gap-2 rounded-2xl border border-l-[3px] border-l-maslow-teal bg-[#0A0A0A] px-4 py-3 text-sm text-[color:var(--tw-ring-offset-color)] transition-colors dark:bg-[#EBF7F4]/15 dark:text-foreground">
      <config.icon
        className={cn("size-4", config.iconColor, config.animation)}
      />
      <span className="animate-pulse">{config.label}</span>
    </div>
  );
}
