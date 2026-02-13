import { useStreamingStatus } from "@/contexts/StreamingStatusContext";
import {
  Lightbulb,
  FileText,
  MessageSquare,
  AlertCircle,
  Table,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const INTENT_CONFIG: Record<
  string,
  {
    icon: LucideIcon;
    label: string;
    colorClass: string;
  }
> = {
  "Explicit: show_data_table": {
    icon: Table,
    label: "Table Request",
    colorClass: "text-maslow-blue",
  },
  "Explicit: show_chart": {
    icon: BarChart3,
    label: "Chart Request",
    colorClass: "text-maslow-teal",
  },
  "Explicit: ask_questions": {
    icon: MessageSquare,
    label: "Questions",
    colorClass: "text-maslow-purple-light",
  },
  "Document Drafting": {
    icon: FileText,
    label: "Document Draft",
    colorClass: "text-maslow-orange",
  },
  "Narrative Only": {
    icon: MessageSquare,
    label: "Text Response",
    colorClass: "text-muted-foreground",
  },
  "Off-Topic": {
    icon: AlertCircle,
    label: "Off-Topic",
    colorClass: "text-destructive",
  },
  Default: {
    icon: Lightbulb,
    label: "Auto-Detecting",
    colorClass: "text-maslow-teal",
  },
};

export function IntentBadge() {
  const { detectedIntent, isRunning } = useStreamingStatus();

  if (!isRunning || !detectedIntent) return null;

  const config =
    INTENT_CONFIG[detectedIntent.detectedIntent] || INTENT_CONFIG["Default"];
  const Icon = config.icon;

  return (
    <div className="mb-2 flex items-center gap-2 rounded-2xl border border-l-[3px] border-l-maslow-teal bg-[#0A0A0A] px-4 py-3 text-sm text-[color:var(--tw-ring-offset-color)] transition-colors dark:bg-[#EBF7F4]/15 dark:text-foreground">
      <Icon className={cn("size-4", config.colorClass)} />
      <span className="font-medium">{config.label}</span>
    </div>
  );
}
