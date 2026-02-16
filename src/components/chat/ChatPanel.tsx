import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";
import { ChatRuntimeProvider } from "./ChatRuntimeProvider";
import { Thread } from "@/components/assistant-ui/thread";
import { ActivityPanel } from "./ActivityPanel";
import { useStreamingStatus } from "@/contexts/StreamingStatusContext";
import { useTour } from "@/contexts/TourContext";
import { ChatTourOverlay } from "@/components/tour/ChatTourOverlay";

interface ChatPanelProps {
  promptId: Id<"prompts">;
  promptTitle: string;
  promptText: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedQueries?: string[];
}

function ChatContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { showActivityPanel, toggleActivityPanel } = useStreamingStatus();
  const { startTour, isTourCompleted } = useTour();

  useEffect(() => {
    if (!isTourCompleted("chat")) {
      const timeout = setTimeout(() => startTour("chat"), 800);
      return () => clearTimeout(timeout);
    }
  }, [startTour, isTourCompleted]);

  return (
    <div ref={containerRef} className="flex h-full relative">
      <div className="flex-1 min-h-0">
        <Thread />
      </div>
      <ActivityPanel isOpen={showActivityPanel} onClose={toggleActivityPanel} />
      <ChatTourOverlay containerRef={containerRef} />
    </div>
  );
}

export function ChatPanel({
  promptId,
  promptTitle,
  isOpen,
  onOpenChange,
  suggestedQueries,
}: ChatPanelProps) {
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);

  const createConversation = useMutation(api.chat.createConversation);

  // Always create a fresh conversation when panel opens (enforces clean demo context)
  useEffect(() => {
    if (isOpen) {
      // Create new conversation every time Test is opened
      createConversation({ promptId }).then(setConversationId);
    } else {
      // Clear conversation ID when panel closes to ensure next open is fresh
      setConversationId(null);
    }
  }, [isOpen, promptId, createConversation]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-maslow-teal" />
            <div>
              <DialogTitle className="text-sm font-semibold">
                {promptTitle}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Execution
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <TooltipProvider>
            <ChatRuntimeProvider
              conversationId={conversationId}
              promptId={promptId}
              suggestedQueries={suggestedQueries}
            >
              <ChatContent />
            </ChatRuntimeProvider>
          </TooltipProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
