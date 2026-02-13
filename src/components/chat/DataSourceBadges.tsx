import { Database, GitBranch, Globe, Wrench, Sparkles } from "lucide-react";
import {
  useStreamingStatus,
  type DataSourceEvent,
} from "@/contexts/StreamingStatusContext";

interface PersistedDataSource {
  type: string;
  count: number;
  topScore?: number;
}

interface DataSourceBadgesProps {
  persistedDataSources?: PersistedDataSource[];
}

interface BadgeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  detail: string;
}

function buildBadges(
  dataSources: DataSourceEvent[],
  toolCalls: Array<{ name: string }>,
  sources: Array<{ uri: string; title: string }>,
  isRunning: boolean,
  status: string,
  persisted?: PersistedDataSource[],
): BadgeConfig[] {
  const badges: BadgeConfig[] = [];

  // If we have persisted data (reload scenario), use that instead of live state
  if (persisted && persisted.length > 0) {
    for (const p of persisted) {
      if (p.type === "vector_search") {
        badges.push({
          label: "Vector DB",
          icon: Database,
          colorClass: "text-maslow-blue",
          detail: `${p.count} doc${p.count !== 1 ? "s" : ""}`,
        });
      } else if (p.type === "knowledge_graph") {
        badges.push({
          label: "KG",
          icon: GitBranch,
          colorClass: "text-maslow-purple-light",
          detail: `${p.count} entit${p.count !== 1 ? "ies" : "y"}`,
        });
      } else if (p.type === "web_search") {
        badges.push({
          label: "Web Search",
          icon: Globe,
          colorClass: "text-maslow-teal",
          detail: `${p.count} source${p.count !== 1 ? "s" : ""}`,
        });
      } else if (p.type === "generative_ui") {
        badges.push({
          label: "Generative UI",
          icon: Wrench,
          colorClass: "text-maslow-orange",
          detail: `${p.count} tool${p.count !== 1 ? "s" : ""}`,
        });
      }
    }
    if (badges.length === 0) {
      badges.push({
        label: "LLM Only",
        icon: Sparkles,
        colorClass: "text-muted-foreground",
        detail: "",
      });
    }
    return badges;
  }

  // Live streaming state: derive badges from context
  const vectorSearch = dataSources.find((ds) => ds.type === "vector_search");
  if (
    vectorSearch &&
    vectorSearch.status === "complete" &&
    vectorSearch.resultCount
  ) {
    badges.push({
      label: "Vector DB",
      icon: Database,
      colorClass: "text-maslow-blue",
      detail: `${vectorSearch.resultCount} doc${vectorSearch.resultCount !== 1 ? "s" : ""}`,
    });
  }

  const knowledgeGraph = dataSources.find(
    (ds) => ds.type === "knowledge_graph",
  );
  if (knowledgeGraph && knowledgeGraph.status === "complete") {
    const entityCount =
      knowledgeGraph.nodeCount ?? knowledgeGraph.entities?.length ?? 0;
    if (entityCount > 0) {
      badges.push({
        label: "KG",
        icon: GitBranch,
        colorClass: "text-maslow-purple-light",
        detail: `${entityCount} entit${entityCount !== 1 ? "ies" : "y"}`,
      });
    }
  }

  if (sources.length > 0) {
    badges.push({
      label: "Web Search",
      icon: Globe,
      colorClass: "text-maslow-teal",
      detail: `${sources.length} source${sources.length !== 1 ? "s" : ""}`,
    });
  }

  const frontendTools = toolCalls.filter(
    (tc) => tc.name && !tc.name.startsWith("_internal"),
  );
  if (frontendTools.length > 0) {
    const toolNames = frontendTools.map((tc) => tc.name);
    const uniqueNames = [...new Set(toolNames)];
    badges.push({
      label: "Generative UI",
      icon: Wrench,
      colorClass: "text-maslow-orange",
      detail: uniqueNames.join(", "),
    });
  }

  // If nothing detected and stream is done, show LLM Only
  if (badges.length === 0 && !isRunning && status !== "idle") {
    badges.push({
      label: "LLM Only",
      icon: Sparkles,
      colorClass: "text-muted-foreground",
      detail: "",
    });
  }

  return badges;
}

export function DataSourceBadges({
  persistedDataSources,
}: DataSourceBadgesProps) {
  const { dataSources, toolCalls, sources, isRunning, status } =
    useStreamingStatus();

  const badges = buildBadges(
    dataSources,
    toolCalls,
    sources,
    isRunning,
    status,
    persistedDataSources,
  );

  // Don't render if no meaningful badges to show
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5">
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <span
            key={badge.label}
            className={`inline-flex items-center gap-1 rounded-full bg-[#0A0A0A] px-2.5 py-1 text-xs dark:bg-[#EBF7F4]/10`}
          >
            <Icon className={`h-3 w-3 ${badge.colorClass}`} />
            <span className={badge.colorClass}>{badge.label}</span>
            {badge.detail && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{badge.detail}</span>
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}
