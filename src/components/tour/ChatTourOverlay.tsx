import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "@/contexts/TourContext";
import { TourTooltip } from "./TourTooltip";

const RECT_PAD = 8;
const CHAT_MASK_ID = "chat-tour-spotlight-mask";

interface ChatTourOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatTourOverlay({ containerRef }: ChatTourOverlayProps) {
  const {
    activeTour,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    endTour,
    isActive,
  } = useTour();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    if (!currentStep || currentStep.isVirtual || !currentStep.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(currentStep.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    updateRect();

    if (currentStep && !currentStep.isVirtual && currentStep.target) {
      const el = document.querySelector(currentStep.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const timeout = setTimeout(updateRect, 400);
        window.addEventListener("resize", updateRect);
        window.addEventListener("scroll", updateRect, true);
        return () => {
          clearTimeout(timeout);
          window.removeEventListener("resize", updateRect);
          window.removeEventListener("scroll", updateRect, true);
        };
      }
    }
  }, [currentStep, updateRect]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [endTour]);

  if (activeTour !== "chat") return null;
  if (!isActive || !currentStep) return null;

  const containerRect = containerRef.current?.getBoundingClientRect();
  const r = targetRect;
  const rRel =
    r && containerRect
      ? {
          top: r.top - containerRect.top,
          left: r.left - containerRect.left,
          width: r.width,
          height: r.height,
        }
      : null;

  return (
    <AnimatePresence>
      <motion.div
        key="chat-tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 z-[70]"
        onClick={nextStep}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <mask id={CHAT_MASK_ID}>
              <rect width="100%" height="100%" fill="white" />
              {rRel && (
                <rect
                  x={rRel.left - RECT_PAD}
                  y={rRel.top - RECT_PAD}
                  width={rRel.width + RECT_PAD * 2}
                  height={rRel.height + RECT_PAD * 2}
                  rx={8}
                  ry={8}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask={`url(#${CHAT_MASK_ID})`}
            style={{ pointerEvents: "auto" }}
          />
        </svg>

        {rRel && (
          <div
            className="tour-spotlight-ring"
            style={{
              position: "absolute",
              top: rRel.top - RECT_PAD,
              left: rRel.left - RECT_PAD,
              width: rRel.width + RECT_PAD * 2,
              height: rRel.height + RECT_PAD * 2,
              borderRadius: 8,
              pointerEvents: "none",
            }}
          />
        )}

        <TourTooltip
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={totalSteps}
          targetRect={targetRect}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={endTour}
          containerRef={containerRef}
        />
      </motion.div>
    </AnimatePresence>
  );
}
