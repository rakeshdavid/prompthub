import { Activity } from "lucide-react";
import { useStreamingStatus } from "@/contexts/StreamingStatusContext";

export function ActivityPanelToggle() {
  const { dataSources, roundHistory, toggleActivityPanel, showActivityPanel } =
    useStreamingStatus();

  const badgeCount = dataSources.length + roundHistory.length;

  if (badgeCount === 0) return null;

  return (
    <button
      data-tour="chat-activity-toggle"
      onClick={toggleActivityPanel}
      className="relative inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      title="View AI Activity"
      aria-label="Toggle AI activity panel"
    >
      <Activity
        className={`size-4 ${showActivityPanel ? "text-maslow-teal" : ""}`}
      />
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center size-4 rounded-full bg-maslow-teal text-[10px] font-medium text-white">
          {badgeCount}
        </span>
      )}
    </button>
  );
}
