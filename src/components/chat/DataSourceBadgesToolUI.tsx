import { makeAssistantToolUI } from "@assistant-ui/react";
import { DataSourceBadges } from "./DataSourceBadges";

type DataSourcesResult = string;

export const DataSourceBadgesToolUI = makeAssistantToolUI<
  Record<string, never>,
  DataSourcesResult
>({
  toolName: "data_sources_metadata",
  render: ({ result }) => {
    if (!result) return null;

    try {
      const parsed: Array<{ type: string; count: number; topScore?: number }> =
        typeof result === "string" ? JSON.parse(result) : result;
      if (!Array.isArray(parsed) || parsed.length === 0) return null;
      return <DataSourceBadges persistedDataSources={parsed} />;
    } catch {
      return null;
    }
  },
});
