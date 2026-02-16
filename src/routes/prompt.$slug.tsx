import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "../ThemeContext";
import { Bug, Trash2, Lock } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Header } from "../components/Header";

import { NotFound } from "../components/NotFound";
import { PromptForm } from "../components/PromptForm";
import { PromptDisplay } from "../components/PromptDisplay";
import { DepartmentBadge } from "../components/DepartmentBadge";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CommentSection } from "../components/CommentSection";
import { ChatPanel } from "../components/chat/ChatPanel";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { Id, type Doc } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/prompt/$slug")({
  component: PromptDetail,
});

function PromptDetail() {
  const { theme } = useTheme();
  const [copied, setCopied] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Doc<"prompts"> | null>(
    null,
  );
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { isSignedIn, user } = useUser();
  const { slug } = Route.useParams();
  const prompt = useQuery(api.prompts.getPromptBySlug, { slug });
  const deletePrompt = useMutation(api.prompts.deletePrompt);
  const toggleVisibilityMutation = useMutation(
    api.prompts.togglePromptVisibility,
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (prompt && user) {
      console.log({
        isSignedIn,
        userId: user.id,
        promptUserId: prompt.userId,
        canDelete: isSignedIn && user.id === prompt.userId,
      });
    }
  }, [isSignedIn, user, prompt]);

  // Show loading state while query is still loading
  if (prompt === undefined) return <div>Loading...</div>;

  // Show 404 if prompt doesn't exist or user doesn't have access
  if (prompt === null) return <NotFound />;

  const bgColor = theme === "dark" ? "bg-[#0A0A0A]" : "bg-white";
  const textColor = theme === "dark" ? "text-white" : "text-black";
  const mutedTextColor =
    theme === "dark" ? "text-muted-foreground" : "text-gray-500";
  const borderColor = theme === "dark" ? "border-border" : "border-gray-200";
  const buttonBgColor = theme === "dark" ? "bg-[#222222]" : "bg-gray-100";

  const isOwner = isSignedIn && user && user.id === prompt.userId;

  const handleDeletePrompt = async (promptId: Id<"prompts">) => {
    void promptId; // kept for API consistency; confirmDeletePrompt uses prompt from closure
    if (!isSignedIn || !user || user.id !== prompt.userId) {
      console.error("Not authorized to delete this prompt");
      return;
    }

    setIsDeleteModalOpen(true);
  };

  const confirmDeletePrompt = async () => {
    if (!prompt) return;

    try {
      await deletePrompt({ id: prompt._id });
      navigate({ to: "/" });
    } catch (error) {
      console.error("Error deleting prompt:", error);
    }
  };

  const handleEditPrompt = () => {
    setEditingPrompt(prompt);
    setIsEditModalOpen(true);
  };

  const handleToggleVisibility = () => {
    setIsVisibilityModalOpen(true);
  };

  const confirmToggleVisibility = async () => {
    if (!prompt || !isSignedIn || !user || user.id !== prompt.userId) {
      console.error("Not authorized to change visibility");
      return;
    }

    try {
      await toggleVisibilityMutation({
        id: prompt._id as Id<"prompts">,
        isPublic: !prompt.isPublic,
      });
      setIsVisibilityModalOpen(false);
    } catch (error) {
      console.error("Error toggling visibility:", error);
      alert("Failed to update prompt visibility. Please try again.");
    }
  };

  return (
    <div className="min-h-screen">
      <HelmetProvider>
        <Helmet>
          <title>{prompt.title} - Enterprise AI Hub</title>
          <meta name="description" content={prompt.description} />
          <meta
            property="og:title"
            content={`${prompt.title} - Enterprise AI Hub`}
          />
          <meta property="og:description" content={prompt.description} />
          <meta
            property="og:image"
            content="https://prompthub.maslow.ai/logos/maslow_color_logo.webp"
          />
          <meta
            name="twitter:title"
            content={`${prompt.title} - Enterprise AI Hub`}
          />
          <meta name="twitter:description" content={prompt.description} />
        </Helmet>
      </HelmetProvider>

      <div className="sticky top-0 z-50">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>

      <div className="relative min-h-screen">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[810px] w-[810px] rounded-full bg-[#ffffff] opacity-60 blur-[100px]"></div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              to="/prompt/$slug"
              params={{ slug: prompt.slug }}
              search={{}}
              className="text-black hover:text-gray-800 transition-colors"
            >
              {prompt.title}
            </Link>
          </nav>

          <div
            className={cn(
              bgColor,
              "border",
              borderColor,
              "p-3 sm:p-4 rounded-lg",
            )}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                {!prompt.isPublic && isSignedIn && (
                  <div className="bg-black px-1.5 py-1.5 rounded">
                    <Lock size={14} className="text-white" />
                  </div>
                )}

                <h2 className="font-sans text-[24px] leading-[32px] text-[#1A202C]">
                  {prompt.title}
                </h2>
              </div>
            </div>
            <p className={cn(mutedTextColor, "mb-3 text-xs sm:text-sm")}>
              {prompt.description}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-left">
              {prompt.categories.map((category, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className={cn(
                    buttonBgColor,
                    mutedTextColor,
                    "text-xs sm:text-sm font-normal",
                  )}
                >
                  {category}
                </Badge>
              ))}
              {prompt.department && (
                <DepartmentBadge department={prompt.department} />
              )}
            </div>

            <PromptDisplay
              prompt={prompt.prompt}
              slug={prompt.slug}
              title={prompt.title}
              isOwner={!!isOwner}
              isPublic={prompt.isPublic}
              onEdit={handleEditPrompt}
              onToggleVisibility={handleToggleVisibility}
              onShare={() => setIsShareModalOpen(true)}
              onRun={() => setIsChatOpen(true)}
              isAuthenticated={!!isSignedIn}
            />

            <div className="flex items-center gap-2 pt-[10px]">
              {isOwner && (
                <button
                  onClick={() => handleDeletePrompt(prompt._id)}
                  className={cn(
                    mutedTextColor,
                    "hover:text-black transition-colors flex items-center gap-1",
                  )}
                >
                  <Trash2 size={14} />
                  <span className="text-xs">Delete</span>
                </button>
              )}
              <span className="flex items-center gap-1">
                <Bug size={14} className={cn(mutedTextColor)} />
                <span className={cn(mutedTextColor, "text-xs")}>
                  {prompt.isPublic ? "Report bugs or spam" : "Report"}
                </span>
              </span>
            </div>
            <div className="comments mt-8">
              <h3 className={cn(textColor, "text-lg font-semibold mb-4")}>
                Discussion
              </h3>
              <CommentSection promptId={prompt._id} />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => !open && setIsDeleteModalOpen(false)}
      >
        <DialogContent className={cn(bgColor, "max-w-md")}>
          <DialogHeader>
            <DialogTitle className={cn(textColor)}>Delete Prompt</DialogTitle>
          </DialogHeader>
          <p className={cn(mutedTextColor, "text-sm")}>
            Are you sure you want to delete this prompt? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeletePrompt}
              className="bg-neutral-black hover:bg-dark-surface text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visibility Toggle Dialog */}
      <Dialog
        open={isVisibilityModalOpen}
        onOpenChange={(open) => !open && setIsVisibilityModalOpen(false)}
      >
        <DialogContent className={cn(bgColor, "max-w-md")}>
          <DialogHeader>
            <DialogTitle className={cn(textColor)}>
              {prompt.isPublic ? "Make Private" : "Make Public"}
            </DialogTitle>
          </DialogHeader>
          <p className={cn(mutedTextColor, "text-sm")}>
            {prompt.isPublic
              ? "Are you sure you want to make this prompt private? Only you will be able to see it."
              : "Are you sure you want to make this prompt public? Anyone will be able to see it."}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVisibilityModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmToggleVisibility}
              className="bg-neutral-black hover:bg-dark-surface text-white"
            >
              {prompt.isPublic ? "Make Private" : "Make Public"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      {isEditModalOpen && editingPrompt && (
        <PromptForm
          isModal={true}
          isEditing={true}
          promptId={editingPrompt._id}
          initialData={{
            title: editingPrompt.title,
            description: editingPrompt.description,
            prompt: editingPrompt.prompt,
            categories: editingPrompt.categories,
            department: editingPrompt.department || "",
            isPublic: editingPrompt.isPublic,
          }}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPrompt(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setEditingPrompt(null);
          }}
        />
      )}

      {/* Share Dialog */}
      <Dialog
        open={isShareModalOpen}
        onOpenChange={(open) => !open && setIsShareModalOpen(false)}
      >
        <DialogContent className={cn(bgColor, "max-w-md")}>
          <DialogHeader>
            <DialogTitle className={cn(textColor)}>Share Prompt</DialogTitle>
          </DialogHeader>
          <p className={cn(mutedTextColor, "text-sm")}>
            Copy the URL to share this prompt with others.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsShareModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                setIsShareModalOpen(false);
                setCopied("URL");
                setTimeout(() => setCopied(null), 2000);
              }}
              className="bg-neutral-black hover:bg-dark-surface text-white"
            >
              {copied ? "Copied!" : "Copy URL"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChatPanel
        promptId={prompt._id}
        promptTitle={prompt.title}
        promptText={prompt.prompt}
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        suggestedQueries={prompt.suggestedQueries}
      />
    </div>
  );
}

export default PromptDetail;
