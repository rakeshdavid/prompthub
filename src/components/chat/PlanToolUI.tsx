import { makeAssistantToolUI } from "@assistant-ui/react";
import { ListChecks, Circle, CircleDot, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanStep {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "complete";
}

interface PlanArgs {
  title: string;
  steps: PlanStep[];
}

type PlanResult = string;

const statusConfig = {
  pending: {
    icon: Circle,
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    label: "Pending",
  },
  in_progress: {
    icon: CircleDot,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    label: "In Progress",
  },
  complete: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    label: "Complete",
  },
};

function PlanContent({ args }: { args: PlanArgs }) {
  const { title, steps } = args;
  const completed = steps.filter((s) => s.status === "complete").length;

  return (
    <div className="my-2 rounded-lg border border-border border-l-[3px] border-l-maslow-teal bg-background">
      <div className="px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-xs text-foreground/60 mt-0.5">
          {completed} of {steps.length} steps complete
        </p>
      </div>
      <div className="p-2">
        {steps.map((step, idx) => {
          const config = statusConfig[step.status];
          const Icon = config.icon;
          return (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-3 rounded-md px-3 py-2.5",
                config.bg,
              )}
            >
              <div className="relative flex flex-col items-center">
                <Icon size={18} className={cn("flex-shrink-0", config.color)} />
                {idx < steps.length - 1 && (
                  <div className="absolute top-5 w-px h-full bg-border/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.status === "complete"
                      ? "text-muted-foreground line-through"
                      : "text-foreground",
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-foreground/60 mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const PlanToolUI = makeAssistantToolUI<PlanArgs, PlanResult>({
  toolName: "show_plan",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <ListChecks size={14} className="animate-pulse text-maslow-teal" />
          <span>Building plan...</span>
        </div>
      );
    }

    if (!result) return null;

    try {
      const args: PlanArgs =
        typeof result === "string" ? JSON.parse(result) : result;
      return <PlanContent args={args} />;
    } catch {
      return null;
    }
  },
});
