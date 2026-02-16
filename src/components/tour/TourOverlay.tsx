import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "@/contexts/TourContext";
import { TourTooltip } from "./TourTooltip";

const RECT_PAD = 8;

export default function TourOverlay() {
  const {
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
        // Re-measure after scroll settles
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

  if (!isActive) return null;

  const r = targetRect;
  const maskId = "tour-spotlight-mask";

  return (
    <AnimatePresence>
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[60]"
        onClick={nextStep}
      >
        {/* SVG overlay with spotlight cutout */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              {r && (
                <rect
                  x={r.left - RECT_PAD}
                  y={r.top - RECT_PAD}
                  width={r.width + RECT_PAD * 2}
                  height={r.height + RECT_PAD * 2}
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
            mask={`url(#${maskId})`}
            style={{ pointerEvents: "auto" }}
          />
        </svg>

        {/* Pulse ring around target */}
        {r && (
          <div
            className="tour-spotlight-ring"
            style={{
              position: "absolute",
              top: r.top - RECT_PAD,
              left: r.left - RECT_PAD,
              width: r.width + RECT_PAD * 2,
              height: r.height + RECT_PAD * 2,
              borderRadius: 8,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Tooltip */}
        <TourTooltip
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={totalSteps}
          targetRect={targetRect}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={endTour}
        />
      </motion.div>
    </AnimatePresence>
  );
}
