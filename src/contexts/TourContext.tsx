import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DISCOVERY_STEPS,
  CHAT_STEPS,
  type TourStep,
} from "../components/tour/tour-steps";

const TourOverlay = React.lazy(() => import("../components/tour/TourOverlay"));

export type TourTrack = "discovery" | "chat";

const STORAGE_KEYS: Record<TourTrack, string> = {
  discovery: "agenthub-tour-discovery-completed",
  chat: "agenthub-tour-chat-completed",
};

function getStepsForTrack(track: TourTrack | null): TourStep[] {
  if (track === "discovery") return DISCOVERY_STEPS;
  if (track === "chat") return CHAT_STEPS;
  return [];
}

interface TourContextValue {
  activeTour: TourTrack | null;
  isActive: boolean;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: TourStep | null;
  startTour: (track: TourTrack) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  isTourCompleted: (track: TourTrack) => boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [activeTour, setActiveTour] = useState<TourTrack | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = getStepsForTrack(activeTour);
  const currentStep = steps[currentStepIndex] ?? null;
  const totalSteps = steps.length;

  const startTour = useCallback((track: TourTrack) => {
    setActiveTour(track);
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    if (activeTour) {
      localStorage.setItem(STORAGE_KEYS[activeTour], "true");
    }
    setActiveTour(null);
    setIsActive(false);
  }, [activeTour]);

  const nextStep = useCallback(() => {
    const currentSteps = getStepsForTrack(activeTour);
    if (currentSteps.length === 0) return;

    let nextIndex = currentStepIndex + 1;
    while (
      nextIndex < currentSteps.length &&
      currentSteps[nextIndex]?.skipIfMissing === true &&
      currentSteps[nextIndex].target &&
      !document.querySelector(currentSteps[nextIndex].target!)
    ) {
      nextIndex++;
    }

    if (nextIndex >= currentSteps.length) {
      endTour();
      return;
    }
    setCurrentStepIndex(nextIndex);
  }, [activeTour, currentStepIndex, endTour]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const isTourCompleted = useCallback((track: TourTrack) => {
    return localStorage.getItem(STORAGE_KEYS[track]) === "true";
  }, []);

  const hasStartedTourRef = React.useRef(false);

  useEffect(() => {
    if (isTourCompleted("discovery")) return;
    const timeout = setTimeout(() => {
      if (hasStartedTourRef.current) return;
      startTour("discovery");
    }, 1500);
    return () => clearTimeout(timeout);
  }, [startTour, isTourCompleted]);

  const startTourWithRef = useCallback(
    (track: TourTrack) => {
      hasStartedTourRef.current = true;
      startTour(track);
    },
    [startTour],
  );

  const value: TourContextValue = {
    activeTour,
    isActive,
    currentStepIndex,
    totalSteps,
    currentStep,
    startTour: startTourWithRef,
    endTour,
    nextStep,
    prevStep,
    isTourCompleted,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      {isActive && (
        <React.Suspense fallback={null}>
          <TourOverlay />
        </React.Suspense>
      )}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
