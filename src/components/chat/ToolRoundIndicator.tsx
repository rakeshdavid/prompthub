import { useStreamingStatus } from "@/contexts/StreamingStatusContext";

export function ToolRoundIndicator() {
  const { currentRound, roundHistory } = useStreamingStatus();

  const totalRounds = Math.max(roundHistory.length, currentRound?.current ?? 0);
  const maxRounds = Math.max(
    currentRound?.maxRounds ?? 0,
    ...roundHistory.map((r) => r.maxRounds),
    totalRounds,
  );

  if (totalRounds === 0) return null;
  if (totalRounds === 1 && !currentRound) return null;

  const displayMax = Math.min(maxRounds, 5);

  const activeRoundToolNames =
    currentRound?.toolCalls?.map((tc) => tc.name).filter(Boolean) ?? [];

  return (
    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        {Array.from({ length: displayMax }, (_, i) => {
          const roundNumber = i + 1;
          const isActive =
            currentRound?.status === "started" &&
            currentRound.current === roundNumber;
          const isCompleted =
            roundNumber < (currentRound?.current ?? totalRounds + 1) ||
            roundHistory.some(
              (r) => r.current === roundNumber && r.status === "complete",
            );

          return (
            <span
              key={roundNumber}
              className={`size-2 rounded-full ${
                isActive
                  ? "bg-maslow-teal animate-pulse"
                  : isCompleted
                    ? "bg-maslow-teal"
                    : "border border-muted-foreground/30 bg-transparent"
              }`}
            />
          );
        })}
      </div>
      <span>
        Round {currentRound?.current ?? totalRounds}/{displayMax}
      </span>
      {activeRoundToolNames.length > 0 && (
        <span className="text-muted-foreground/70">
          {activeRoundToolNames.join(", ")}
        </span>
      )}
    </div>
  );
}
