import type { TourStep } from "./tour-steps";

interface TourTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  /** For dialog-relative positioning (chat tour); when set, tooltip uses position: absolute */
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

function getTooltipStyle(
  targetRect: DOMRect | null,
  placement: TourStep["placement"],
  containerRect: DOMRect | null,
): React.CSSProperties {
  const useContainer = containerRect != null;
  const gap = 16;
  const base: React.CSSProperties = {
    position: useContainer ? "absolute" : "fixed",
    zIndex: 61,
  };

  if (!targetRect) {
    if (useContainer && containerRect) {
      return {
        ...base,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }
    return {
      ...base,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const top =
    useContainer && containerRect
      ? targetRect.top - containerRect.top
      : targetRect.top;
  const left =
    useContainer && containerRect
      ? targetRect.left - containerRect.left
      : targetRect.left;
  const right =
    useContainer && containerRect
      ? containerRect.right - targetRect.right
      : window.innerWidth - targetRect.right;
  const bottom =
    useContainer && containerRect
      ? containerRect.bottom - targetRect.bottom
      : window.innerHeight - targetRect.bottom;
  const widthLimit = 336;
  const minLeft =
    useContainer && containerRect
      ? Math.max(16, Math.min(left, containerRect.width - widthLimit))
      : Math.max(16, Math.min(targetRect.left, window.innerWidth - widthLimit));

  // On mobile, pin to bottom
  if (window.innerWidth < 640) {
    if (useContainer && containerRect) {
      return {
        ...base,
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: "none",
      };
    }
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
        bottom: bottom + gap,
        left: minLeft,
      };
    case "left":
      return {
        ...base,
        top,
        right: right + gap,
      };
    case "right":
      return {
        ...base,
        top,
        left: left + targetRect.width + gap,
      };
    case "bottom":
    default:
      return {
        ...base,
        top: top + targetRect.height + gap,
        left: minLeft,
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
  containerRef,
}: TourTooltipProps) {
  const isLast = stepIndex === totalSteps - 1;
  const progress = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;
  const containerRect = containerRef?.current?.getBoundingClientRect() ?? null;
  const style = getTooltipStyle(targetRect, step.placement, containerRect);

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
