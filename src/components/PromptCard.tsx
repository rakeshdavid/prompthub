import { Link } from "@tanstack/react-router";
import { Copy, Check, TrendingUp, Lock, Play } from "lucide-react";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MagicCard } from "@/components/ui/magic-card";
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

  const previewLines = prompt.prompt.split("\n").slice(0, 4).join("\n");
  const slug = prompt.slug || generateSlug(prompt.title);

  return (
    <>
      <MagicCard
        gradientColor="hsl(var(--muted))"
        gradientFrom="var(--maslow-teal)"
        gradientTo="var(--maslow-pink)"
        gradientSize={250}
        gradientOpacity={0.15}
        className="h-full rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.01]"
      >
        <CardHeader className="p-5 pb-3">
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
                className="text-lg font-semibold leading-snug text-foreground hover:text-maslow-teal transition-colors line-clamp-2"
              >
                {prompt.title}
              </Link>
            </div>
          </div>
          {prompt.department && (
            <DepartmentBadge
              department={prompt.department}
              className="mt-2 w-fit"
            />
          )}
        </CardHeader>

        <CardContent className="px-5 pb-4">
          {prompt.description && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              {prompt.description}
            </p>
          )}
          <div className="bg-dark-blue rounded-md p-3.5">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words font-mono line-clamp-4">
              {previewLines}
            </pre>
          </div>
        </CardContent>

        <CardFooter className="px-5 pt-3 pb-5 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 flex-wrap w-full">
            {prompt.categories.slice(0, 2).map((category, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-xs bg-secondary/60"
              >
                {category}
              </Badge>
            ))}
            {prompt.categories.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{prompt.categories.length - 2} more
              </span>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 w-full">
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
              className="h-7 px-3 text-xs gap-1.5 font-semibold text-white bg-maslow-purple hover:bg-maslow-purple/90 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Play size={12} className="fill-current" />
              Run
            </Button>
          </div>
        </CardFooter>
      </MagicCard>
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
