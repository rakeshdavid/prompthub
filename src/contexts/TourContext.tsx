import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { TOUR_STEPS, type TourStep } from "../components/tour/tour-steps";

const STORAGE_KEY = "agenthub-tour-completed";

const TourOverlay = React.lazy(() => import("../components/tour/TourOverlay"));

interface TourContextValue {
  isActive: boolean;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: TourStep;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const next = prev + 1;
      if (next >= TOUR_STEPS.length) {
        endTour();
        return prev;
      }
      return next;
    });
  }, [endTour]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(STORAGE_KEY);
    if (!hasCompleted) {
      const timeout = setTimeout(() => {
        startTour();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [startTour]);

  const value: TourContextValue = {
    isActive,
    currentStepIndex,
    totalSteps: TOUR_STEPS.length,
    currentStep: TOUR_STEPS[currentStepIndex],
    startTour,
    endTour,
    nextStep,
    prevStep,
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
