import {
  useStreamingStatus,
  type DataSourceEvent,
  type RoundEvent,
} from "@/contexts/StreamingStatusContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Activity,
  Database,
  GitBranch,
  Wrench,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface ActivityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODIFICATION_LABELS: Record<string, string> = {
  token_anchoring: "Token Anchoring",
  constraints_sharpened: "Constraints Sharpened",
  structure_added: "Structure Added",
  constraints_repositioned: "Constraints Repositioned",
};

function RAGResultsCard({ event }: { event: DataSourceEvent }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Database className="size-4 text-maslow-blue" />
        <h3 className="text-sm font-semibold">Vector Search</h3>
        {event.durationMs != null && (
          <span className="ml-auto rounded-full bg-maslow-blue/10 px-2 py-0.5 text-[10px] font-medium text-maslow-blue">
            {event.durationMs}ms
          </span>
        )}
      </div>
      {event.documents && event.documents.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {event.documents.map((doc, i) => (
            <li key={i} className="text-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-1.5 rounded-full bg-maslow-teal/30 flex-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-maslow-teal"
                    style={{ width: `${Math.round(doc.score * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  {doc.score.toFixed(2)}
                </span>
              </div>
              {doc.jsonPath && (
                <p className="text-[10px] text-muted-foreground font-mono truncate mb-0.5">
                  {doc.jsonPath}
                </p>
              )}
              <p className="text-muted-foreground line-clamp-2">
                {doc.snippet}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          {event.resultCount ?? 0} results found
        </p>
      )}
    </div>
  );
}

function KnowledgeGraphCard({ event }: { event: DataSourceEvent }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="size-4 text-maslow-purple-light" />
        <h3 className="text-sm font-semibold">Knowledge Graph</h3>
        {event.durationMs != null && (
          <span className="ml-auto rounded-full bg-maslow-purple-light/10 px-2 py-0.5 text-[10px] font-medium text-maslow-purple-light">
            {event.durationMs}ms
          </span>
        )}
      </div>
      {event.entities && event.entities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {event.entities.map((entity, i) => (
            <span
              key={i}
              className="rounded-full bg-maslow-purple-light/10 px-2 py-0.5 text-xs text-maslow-purple-light"
            >
              {entity.name}
            </span>
          ))}
        </div>
      )}
      {event.relationshipCount != null && (
        <p className="text-xs text-muted-foreground">
          {event.relationshipCount} relationship
          {event.relationshipCount !== 1 ? "s" : ""} found
        </p>
      )}
    </div>
  );
}

function ToolRoundsCard({ rounds }: { rounds: RoundEvent[] }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="size-4 text-maslow-orange" />
        <h3 className="text-sm font-semibold">Tool Rounds</h3>
      </div>
      <ul className="flex flex-col gap-2">
        {rounds.map((round, i) => (
          <li key={i} className="text-xs">
            <span className="font-medium text-muted-foreground">
              Round {round.current}/{round.maxRounds}
            </span>
            {round.toolCalls && round.toolCalls.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {round.toolCalls.map((tc, j) => (
                  <span
                    key={j}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium text-white ${
                      tc.isFrontendTool ? "bg-maslow-orange" : "bg-maslow-blue"
                    }`}
                  >
                    {tc.name}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PromptEnhancementCard({ event }: { event: DataSourceEvent }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="size-4 text-maslow-pink" />
        <h3 className="text-sm font-semibold">Prompt Enhancement</h3>
      </div>
      {event.modifications && event.modifications.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {event.modifications.map((mod, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="size-3.5 text-maslow-teal shrink-0" />
              <span className="text-muted-foreground">
                {MODIFICATION_LABELS[mod] ?? mod}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Enhanced</p>
      )}
    </div>
  );
}

export function ActivityPanel({ isOpen, onClose }: ActivityPanelProps) {
  const { dataSources, roundHistory } = useStreamingStatus();

  const vectorSearch = dataSources.find((ds) => ds.type === "vector_search");
  const knowledgeGraph = dataSources.find(
    (ds) => ds.type === "knowledge_graph",
  );
  const promptEnhanced = dataSources.find(
    (ds) => ds.type === "prompt_enhanced",
  );

  const hasContent =
    vectorSearch || knowledgeGraph || promptEnhanced || roundHistory.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="w-80 h-full bg-background border-l flex flex-col shrink-0"
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
            <Activity className="size-4 text-maslow-teal" />
            <h2 className="text-sm font-semibold flex-1">AI Activity</h2>
            <button
              onClick={onClose}
              className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              aria-label="Close activity panel"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {!hasContent && (
              <p className="text-sm text-muted-foreground text-center mt-8">
                No activity data yet
              </p>
            )}

            {vectorSearch && <RAGResultsCard event={vectorSearch} />}
            {knowledgeGraph && <KnowledgeGraphCard event={knowledgeGraph} />}
            {roundHistory.length > 0 && (
              <ToolRoundsCard rounds={roundHistory} />
            )}
            {promptEnhanced && <PromptEnhancementCard event={promptEnhanced} />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
