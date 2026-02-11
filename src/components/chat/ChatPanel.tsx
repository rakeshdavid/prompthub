import { useState, useEffect } from "react";
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

interface ChatPanelProps {
  promptId: Id<"prompts">;
  promptTitle: string;
  promptText: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedQueries?: string[];
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
              <Thread />
            </ChatRuntimeProvider>
          </TooltipProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
