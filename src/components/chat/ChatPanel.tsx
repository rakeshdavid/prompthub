import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/clerk-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Sparkles, MessageSquare } from "lucide-react";

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
  promptText,
  isOpen,
  onOpenChange,
  suggestedQueries,
}: ChatPanelProps) {
  const { getToken } = useAuth();
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const createConversation = useMutation(api.chat.createConversation);
  const sendMessage = useMutation(api.chat.sendMessage);
  const saveAssistantMessage = useMutation(api.chat.saveAssistantMessage);

  const messages = useQuery(
    api.chat.getMessages,
    conversationId ? { conversationId } : "skip",
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  // Initialize conversation when panel opens
  useEffect(() => {
    if (isOpen && !conversationId) {
      createConversation({ promptId }).then(setConversationId);
    }
  }, [isOpen, conversationId, promptId, createConversation]);

  // Cleanup on close
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      if (!conversationId || isStreaming) return;

      await sendMessage({ conversationId, content });

      setIsStreaming(true);
      setStreamingContent("");

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const token = await getToken({ template: "convex" });
        const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
        const httpUrl = convexUrl.replace(".cloud", ".site");

        const response = await fetch(`${httpUrl}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ conversationId }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("Stream request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);

            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                fullText += `\n\nError: ${parsed.error}`;
                setStreamingContent(fullText);
              } else if (parsed.text) {
                fullText += parsed.text;
                setStreamingContent(fullText);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        if (fullText) {
          await saveAssistantMessage({ conversationId, content: fullText });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // User closed the panel, ignore
        } else {
          console.error("Stream error:", error);
          setStreamingContent("An error occurred. Please try again.");
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        abortControllerRef.current = null;
      }
    },
    [conversationId, isStreaming, sendMessage, saveAssistantMessage, getToken],
  );

  const visibleMessages = (messages ?? []).filter((m) => m.role !== "system");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col p-0">
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

        <ScrollArea className="flex-1 min-h-0">
          <div className="py-4">
            {visibleMessages.length === 0 &&
              !streamingContent &&
              suggestedQueries &&
              suggestedQueries.length > 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-6">
                    <MessageSquare size={16} />
                    <span className="text-sm">
                      Try one of these to get started
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-2xl">
                    {suggestedQueries.map((query) => (
                      <button
                        key={query}
                        onClick={() => handleSend(query)}
                        disabled={isStreaming}
                        className="text-left px-4 py-3 rounded-lg border border-border bg-muted/50 text-sm text-foreground transition-colors hover:bg-[#EBF7F4] hover:border-[#6DC4AD] disabled:opacity-50 disabled:cursor-not-allowed max-w-md mx-auto w-full"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            {visibleMessages.map((msg) => (
              <ChatMessage
                key={msg._id}
                role={msg.role}
                content={msg.content}
              />
            ))}
            {streamingContent && (
              <ChatMessage
                role="assistant"
                content={streamingContent}
                isStreaming={isStreaming}
              />
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <ChatInput onSend={handleSend} isLoading={isStreaming} />
      </DialogContent>
    </Dialog>
  );
}
