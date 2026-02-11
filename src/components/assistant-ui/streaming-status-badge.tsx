import { Brain, Globe, Sparkles, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStreamingStatus, type StreamStatus } from "@/contexts/StreamingStatusContext";

interface StatusConfig {
  icon: typeof Brain;
  label: string;
  animation: string;
}

const statusConfig: Record<
  Exclude<StreamStatus, "idle">,
  StatusConfig
> = {
  thinking: {
    icon: Brain,
    label: "Thinking...",
    animation: "animate-pulse",
  },
  searching: {
    icon: Globe,
    label: "Searching...",
    animation: "animate-spin",
  },
  generating: {
    icon: Sparkles,
    label: "Generating...",
    animation: "animate-pulse",
  },
  tool_calling: {
    icon: Wrench,
    label: "Using tools...",
    animation: "animate-spin",
  },
};

export function StreamingStatusBadge() {
  const { status, isRunning } = useStreamingStatus();

  if (!isRunning || status === "idle") return null;

  const config = statusConfig[status];

  return (
    <div className="mb-2 flex items-center gap-2 rounded-2xl border border-l-[3px] border-l-maslow-teal bg-[#0A0A0A] px-4 py-3 text-sm text-[color:var(--tw-ring-offset-color)] transition-colors hover:bg-[#0A0A0A] hover:opacity-90 dark:bg-[#EBF7F4]/15 dark:text-foreground">
      <config.icon
        className={cn("size-4 text-maslow-teal", config.animation)}
      />
      <span>{config.label}</span>
    </div>
  );
}
