import { makeAssistantToolUI } from "@assistant-ui/react";
import { Activity, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "neutral";
}

interface StatsArgs {
  title: string;
  stats: StatItem[];
}

type StatsResult = string;

const trendConfig = {
  up: {
    icon: TrendingUp,
    color: "text-emerald-500",
  },
  down: {
    icon: TrendingDown,
    color: "text-red-500",
  },
  neutral: {
    icon: Minus,
    color: "text-muted-foreground",
  },
};

function StatsContent({ args }: { args: StatsArgs }) {
  const { title, stats } = args;

  return (
    <div className="my-2 rounded-lg border border-border border-l-[3px] border-l-maslow-teal bg-background">
      <div className="px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border/50 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const trend = stat.trend ?? "neutral";
          const config = trendConfig[trend];
          const TrendIcon = config.icon;

          return (
            <div key={stat.label} className="bg-background px-4 py-3">
              <p className="text-xs text-foreground/60 font-medium truncate">
                {stat.label}
              </p>
              <p className="mt-1 text-xl font-semibold text-foreground tabular-nums">
                {stat.value}
              </p>
              {stat.delta && (
                <div
                  className={cn("flex items-center gap-1 mt-1", config.color)}
                >
                  <TrendIcon size={12} />
                  <span className="text-xs font-medium">{stat.delta}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const StatsToolUI = makeAssistantToolUI<StatsArgs, StatsResult>({
  toolName: "show_stats",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <Activity size={14} className="animate-pulse text-maslow-teal" />
          <span>Loading stats...</span>
        </div>
      );
    }

    if (!result) return null;

    try {
      const args: StatsArgs =
        typeof result === "string" ? JSON.parse(result) : result;
      return <StatsContent args={args} />;
    } catch {
      return null;
    }
  },
});
