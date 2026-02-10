import { makeAssistantToolUI } from "@assistant-ui/react";
import { Globe, ExternalLink } from "lucide-react";

type WebSearchArgs = { query?: string };
type WebSearchResult = {
  sources?: Array<{ uri: string; title: string }>;
};

export const WebSearchToolUI = makeAssistantToolUI<
  WebSearchArgs,
  WebSearchResult
>({
  toolName: "web_search",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <Globe size={14} className="animate-spin text-maslow-teal" />
          <span>Searching the web...</span>
        </div>
      );
    }

    const sources = result?.sources;
    if (!sources || sources.length === 0) return null;

    return (
      <div className="mt-2 mb-1">
        <p className="text-xs text-muted-foreground mb-1.5">Sources</p>
        <div className="flex flex-wrap gap-1.5">
          {sources.map((source) => (
            <a
              key={source.uri}
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors bg-background/50 rounded px-1.5 py-0.5 border border-border/50 hover:border-border"
            >
              <ExternalLink size={10} className="flex-shrink-0" />
              <span className="truncate max-w-[200px]">{source.title}</span>
            </a>
          ))}
        </div>
      </div>
    );
  },
});
