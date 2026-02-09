import { useState } from "react";
import {
  Copy,
  Check,
  Share,
  SquarePen,
  Lock,
  LockKeyhole,
  Expand,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

interface PromptDisplayProps {
  prompt: string;
  slug?: string;
  title?: string;
  isOwner?: boolean;
  isPublic?: boolean;
  onEdit?: () => void;
  onToggleVisibility?: () => void;
  onShare?: () => void;
  showOpen?: boolean;
}

export function PromptDisplay({
  prompt,
  slug,
  title,
  isOwner,
  isPublic,
  onEdit,
  onToggleVisibility,
  onShare,
  showOpen = false,
}: PromptDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <Card className="mt-4 overflow-hidden border-0">
      <div className="accent-line-teal" />
      <div className="flex items-center justify-between px-4 py-2 bg-dark-blue">
        <span className="text-dark-text text-xs font-medium tracking-wide uppercase">
          Prompt
        </span>
        <div className="flex items-center gap-1">
          {showOpen && slug && (
            <Link
              to="/prompt/$slug"
              params={{ slug: slug || generateSlug(title || "") }}
              className="flex items-center gap-1 px-2 py-1 text-dark-text hover:text-white transition-colors duration-200 text-xs"
            >
              <Expand size={14} />
              <span>Open</span>
            </Link>
          )}

          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center gap-1 px-2 py-1 text-dark-text hover:text-white transition-colors duration-200 text-xs"
            >
              <Share size={14} />
              <span>Share</span>
            </button>
          )}

          {isOwner && onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-2 py-1 text-dark-text hover:text-white transition-colors duration-200 text-xs"
            >
              <SquarePen size={14} />
              <span>Edit</span>
            </button>
          )}

          {isOwner && onToggleVisibility && (
            <button
              onClick={onToggleVisibility}
              className="flex items-center gap-1 px-2 py-1 text-dark-text hover:text-white transition-colors duration-200 text-xs"
            >
              {isPublic ? <Lock size={14} /> : <LockKeyhole size={14} />}
              <span>{isPublic ? "Private" : "Public"}</span>
            </button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-7 px-2 text-dark-text hover:text-white hover:bg-dark-surface text-xs gap-1"
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>
      <CardContent className="p-0">
        <div className="bg-dark-blue overflow-x-auto">
          <pre className="p-4 text-sm leading-relaxed">
            <code className="text-gray-200 whitespace-pre-wrap break-words font-mono">
              {prompt}
            </code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
