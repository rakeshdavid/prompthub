import type { TourStep } from "./tour-steps";

interface TourTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function getTooltipStyle(
  targetRect: DOMRect | null,
  placement: TourStep["placement"],
): React.CSSProperties {
  if (!targetRect) {
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 61,
    };
  }

  const gap = 16;
  const base: React.CSSProperties = { position: "fixed", zIndex: 61 };

  // On mobile, pin to bottom
  if (window.innerWidth < 640) {
    return {
      ...base,
      bottom: 16,
      left: 16,
      right: 16,
      maxWidth: "none",
    };
  }

  switch (placement) {
    case "top":
      return {
        ...base,
        bottom: window.innerHeight - targetRect.top + gap,
        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 336)),
      };
    case "left":
      return {
        ...base,
        top: targetRect.top,
        right: window.innerWidth - targetRect.left + gap,
      };
    case "right":
      return {
        ...base,
        top: targetRect.top,
        left: targetRect.right + gap,
      };
    case "bottom":
    default:
      return {
        ...base,
        top: targetRect.bottom + gap,
        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 336)),
      };
  }
}

export function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
}: TourTooltipProps) {
  const isLast = stepIndex === totalSteps - 1;
  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const style = getTooltipStyle(targetRect, step.placement);

  return (
    <div
      style={style}
      className="bg-card border border-border border-l-[3px] border-l-[var(--maslow-teal)] rounded-xl shadow-lg p-5 max-w-[320px]"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-base font-semibold text-foreground">{step.title}</p>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        {step.description}
      </p>
      <p className="text-xs text-muted-foreground mt-3">
        Step {stepIndex + 1} of {totalSteps}
      </p>
      <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--maslow-teal)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <button
              onClick={onPrev}
              className="px-3 py-1.5 text-xs rounded-md border border-input bg-background hover:bg-accent transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={onNext}
            className="px-3 py-1.5 text-xs rounded-md text-white bg-[var(--maslow-teal)] hover:bg-[var(--maslow-teal)]/90 transition-colors"
          >
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
