import { Link } from "@tanstack/react-router";
import { Copy, Check, TrendingUp, Lock, Play } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DepartmentBadge } from "./DepartmentBadge";
import { ChatPanel } from "./chat/ChatPanel";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

interface Prompt {
  _id: string;
  title: string;
  description: string;
  prompt: string;
  categories: string[];
  likes?: number;
  department?: string;
  isPublic: boolean;
  slug?: string;
  userId?: string;
  suggestedQueries?: string[];
}

interface PromptCardProps {
  prompt: Prompt;
  onLike?: (id: string) => void;
  isLiked?: boolean;
  isSignedIn?: boolean;
}

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export function PromptCard({
  prompt,
  onLike,
  isLiked,
  isSignedIn,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewLines = prompt.prompt.split("\n").slice(0, 3).join("\n");
  const slug = prompt.slug || generateSlug(prompt.title);

  return (
    <>
      <Card className="group transition-all duration-200 hover:bg-state-hover hover:border-l-[3px] hover:border-l-maslow-teal border-l-[3px] border-l-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {!prompt.isPublic && isSignedIn && (
                <div className="bg-neutral-black p-1 rounded shrink-0">
                  <Lock size={12} className="text-white" />
                </div>
              )}
              <Link
                to="/prompt/$slug"
                params={{ slug }}
                className="text-base font-semibold text-foreground hover:text-maslow-teal transition-colors truncate"
              >
                {prompt.title}
              </Link>
            </div>
          </div>
          {prompt.department && (
            <DepartmentBadge
              department={prompt.department}
              className="mt-1 w-fit"
            />
          )}
        </CardHeader>

        <CardContent className="pb-2">
          {prompt.description && (
            <p className="text-muted-foreground text-sm mb-2">
              {prompt.description}
            </p>
          )}
          <div className="bg-dark-blue rounded-md p-3 mt-1">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words font-mono line-clamp-3">
              {previewLines}
            </pre>
          </div>
        </CardContent>

        <CardFooter className="pt-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {prompt.categories.slice(0, 3).map((category, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
            {prompt.categories.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{prompt.categories.length - 3}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onLike && (
              <button
                onClick={() => onLike(prompt._id)}
                className={`flex items-center gap-1 transition-colors duration-200 ${
                  isLiked
                    ? "text-maslow-teal"
                    : "text-muted-foreground hover:text-maslow-teal"
                }`}
              >
                <TrendingUp
                  size={14}
                  className={isLiked ? "fill-current" : ""}
                />
                <span className="text-xs">{prompt.likes || 0}</span>
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-7 px-2 text-xs gap-1"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(true)}
              className="h-7 px-2 text-xs gap-1 text-maslow-teal hover:text-maslow-teal"
            >
              <Play size={12} />
              Test
            </Button>
          </div>
        </CardFooter>
      </Card>
      <ChatPanel
        promptId={prompt._id as Id<"prompts">}
        promptTitle={prompt.title}
        promptText={prompt.prompt}
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        suggestedQueries={prompt.suggestedQueries}
      />
    </>
  );
}
