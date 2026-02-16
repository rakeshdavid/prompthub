import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { useUser, useClerk } from "@clerk/clerk-react";

const STORAGE_KEY = "agenthub-auth-pending-intent";

interface PendingAction {
  action: () => void;
  reason?: string;
}

interface AuthGateContextValue {
  requireAuth: (
    action: () => void,
    reason?: string,
    intentKey?: string,
  ) => void;
  pendingIntent: string | null;
  clearPendingIntent: () => void;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const pendingRef = useRef<PendingAction | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<string | null>(null);

  // When the user signs in, execute any stored pending action (in-page flow)
  // or surface a stored intent from localStorage (OAuth redirect flow)
  useEffect(() => {
    if (!isSignedIn) return;

    if (pendingRef.current) {
      const { action } = pendingRef.current;
      pendingRef.current = null;
      action();
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      localStorage.removeItem(STORAGE_KEY);
      setPendingIntent(stored);
    }
  }, [isSignedIn]);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast === null) return;
    setToastVisible(true);
    const fadeTimer = setTimeout(() => setToastVisible(false), 2700);
    const removeTimer = setTimeout(() => setToast(null), 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [toast]);

  const clearPendingIntent = useCallback(() => {
    setPendingIntent(null);
  }, []);

  const requireAuth = useCallback(
    (action: () => void, reason?: string, intentKey?: string) => {
      if (isSignedIn) {
        action();
        return;
      }
      pendingRef.current = { action, reason };
      if (intentKey) {
        localStorage.setItem(STORAGE_KEY, intentKey);
      }
      if (reason) {
        setToast(reason);
      }
      openSignIn();
    },
    [isSignedIn, openSignIn],
  );

  return (
    <AuthGateContext.Provider
      value={{ requireAuth, pendingIntent, clearPendingIntent }}
    >
      {children}
      {toast !== null && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            opacity: toastVisible ? 1 : 0,
            transition: "opacity 300ms ease-in-out",
            pointerEvents: "none",
          }}
          className="bg-card border border-border rounded-lg shadow-lg px-4 py-2 text-sm text-foreground"
        >
          {toast}
        </div>
      )}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate(): AuthGateContextValue {
  const context = useContext(AuthGateContext);
  if (!context) {
    throw new Error("useAuthGate must be used within an AuthGateProvider");
  }
  return context;
}
