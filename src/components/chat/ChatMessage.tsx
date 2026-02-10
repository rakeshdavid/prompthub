import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  if (role === "system") return null;

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        role === "user" ? "justify-end" : "justify-start",
      )}
    >
      {role === "assistant" && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
          <Bot size={14} className="text-muted-foreground" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          role === "user"
            ? "bg-dark-blue text-white"
            : "bg-muted border-l-2 border-maslow-teal",
        )}
      >
        {role === "assistant" ? (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-2 ml-1 rounded-full bg-maslow-teal animate-pulse" />
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </div>
      {role === "user" && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-dark-blue flex items-center justify-center">
          <User size={14} className="text-white" />
        </div>
      )}
    </div>
  );
}
