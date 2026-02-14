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
  "Explicit: show_stats": {
    icon: BarChart3,
    label: "Stats Request",
    colorClass: "text-maslow-blue",
  },
  "Explicit: show_plan": {
    icon: Lightbulb,
    label: "Plan Request",
    colorClass: "text-maslow-teal",
  },
  "Explicit: show_options": {
    icon: MessageSquare,
    label: "Options Request",
    colorClass: "text-maslow-purple-light",
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
  "Data Analysis": {
    icon: BarChart3,
    label: "Data Analysis",
    colorClass: "text-maslow-blue",
  },
  Conversational: {
    icon: MessageSquare,
    label: "Conversational",
    colorClass: "text-maslow-teal",
  },
};

export function IntentBadge() {
  const { detectedIntent, isRunning } = useStreamingStatus();

  if (!isRunning || !detectedIntent) return null;

  const config =
    INTENT_CONFIG[detectedIntent.detectedIntent] ||
    INTENT_CONFIG["Conversational"];
  const Icon = config.icon;

  return (
    <div className="mb-2 flex items-center gap-2 rounded-2xl border border-l-[3px] border-l-maslow-teal bg-[#0A0A0A] px-4 py-3 text-sm text-[color:var(--tw-ring-offset-color)] transition-colors dark:bg-[#EBF7F4]/15 dark:text-foreground">
      <Icon className={cn("size-4", config.colorClass)} />
      <span className="font-medium">{config.label}</span>
    </div>
  );
}
