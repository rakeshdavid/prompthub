import React, { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { Globe, Lock, Sparkles } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { CATEGORIES } from "../constants/categories";
import { DEPARTMENTS } from "../constants/departments";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PromptFormProps {
  isModal?: boolean;
  onClose?: () => void;
  onSuccess?: (promptId: string, slug: string) => void;
  initialData?: {
    title: string;
    description: string;
    prompt: string;
    categories: string[];
    department?: string;
    isPublic: boolean;
  };
  isEditing?: boolean;
  promptId?: string;
}

export const PromptForm: React.FC<PromptFormProps> = ({
  isModal = false,
  onClose,
  onSuccess,
  initialData,
  isEditing = false,
  promptId,
}) => {
  const { theme } = useTheme();
  const { isSignedIn } = useUser();
  const createPrompt = useMutation(api.prompts.createPrompt);
  const updatePromptMutation = useMutation(api.prompts.updatePrompt);
  const createCustomCategory = useMutation(api.prompts.createCustomCategory);
  const customCategories = useQuery(api.prompts.getUserCustomCategories) || [];

  const [newPrompt, setNewPrompt] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    prompt: initialData?.prompt || "",
    categories: initialData?.categories || [],
    department: initialData?.department || "",
    isPublic: initialData?.isPublic ?? true,
  });
  const [newCustomCategory, setNewCustomCategory] = useState("");
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close modal
      if (e.key === "Escape" && isModal && onClose) {
        onClose();
        return;
      }

      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        const form = document.querySelector("form") as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
        return;
      }
    };

    if (isModal) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isModal, onClose]);

  const bgColor = theme === "dark" ? "bg-[#0A0A0A]" : "bg-white";
  const textColor = theme === "dark" ? "text-white" : "text-black";
  const mutedTextColor =
    theme === "dark" ? "text-muted-foreground" : "text-gray-500";
  const borderColor = theme === "dark" ? "border-border" : "border-gray-200";

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const toggleCategory = (category: string) => {
    setNewPrompt((prev) => {
      if (prev.categories.includes(category)) {
        return {
          ...prev,
          categories: prev.categories.filter((c) => c !== category),
        };
      }
      if (prev.categories.length >= 4) return prev;
      return { ...prev, categories: [...prev.categories, category] };
    });
  };

  const handleCreateCustomCategory = async () => {
    if (!newCustomCategory.trim()) return;

    try {
      await createCustomCategory({ name: newCustomCategory.trim() });
      setNewCustomCategory("");
      setIsAddingCustomCategory(false);
    } catch (error) {
      console.error("Error creating custom category:", error);
      alert("Failed to create custom category. It may already exist.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPrompt.title.trim() || !newPrompt.prompt.trim()) {
      alert("Please fill in all required fields (Title and Prompt)");
      return;
    }

    if (newPrompt.categories.length === 0) {
      alert("Please select at least one category");
      return;
    }

    const slug = generateSlug(newPrompt.title);

    try {
      if (isEditing && promptId) {
        await updatePromptMutation({
          id: promptId as any,
          title: newPrompt.title,
          description: newPrompt.description,
          prompt: newPrompt.prompt,
          categories: newPrompt.categories,
          department: newPrompt.department,
        });
        onSuccess?.(promptId, slug);
      } else {
        const createdPromptId = await createPrompt({
          title: newPrompt.title,
          description: newPrompt.description,
          prompt: newPrompt.prompt,
          categories: newPrompt.categories,
          department: newPrompt.department,
          isPublic: newPrompt.isPublic,
          slug,
        });
        onSuccess?.(createdPromptId, slug);
      }

      if (!isEditing) {
        setNewPrompt({
          title: "",
          description: "",
          prompt: "",
          categories: [],
          department: "",
          isPublic: true,
        });
      }

      if (isModal && onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving prompt:", error);
      alert("Failed to save prompt. Please try again.");
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className={cn(mutedTextColor, "block text-sm font-medium mb-1")}>
          Title<span className="text-[#EF442D]">* (required)</span>
        </label>
        <Input
          type="text"
          value={newPrompt.title}
          onChange={(e) =>
            setNewPrompt({
              ...newPrompt,
              title: e.target.value.slice(0, 54),
            })
          }
          maxLength={54}
          className={cn(bgColor, textColor)}
          placeholder="Enter prompt title"
          tabIndex={1}
          required
        />
      </div>

      <div>
        <label className={cn(mutedTextColor, "block text-sm font-medium mb-1")}>
          Description (optional)
        </label>
        <Input
          type="text"
          value={newPrompt.description}
          onChange={(e) => {
            const text = e.target.value;
            if (text.length <= 138)
              setNewPrompt({ ...newPrompt, description: text });
          }}
          maxLength={120}
          className={cn(bgColor, textColor)}
          placeholder="Describe what this prompt does"
          tabIndex={2}
        />
      </div>

      <div>
        <label className={cn(mutedTextColor, "block text-sm font-medium mb-1")}>
          Department (optional)
        </label>
        <Select
          value={newPrompt.department}
          onValueChange={(value) =>
            setNewPrompt({ ...newPrompt, department: value })
          }
        >
          <SelectTrigger className={cn(bgColor, textColor)} tabIndex={3}>
            <SelectValue placeholder="Select a department" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept.name} value={dept.name}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={cn(mutedTextColor, "block text-sm font-medium")}>
            Categories<span className="text-[#EF442D]">* (required)</span> (A
            max of 4. Select all that apply)
          </label>
          {isSignedIn && (
            <button
              type="button"
              onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
              className={cn(
                "text-xs px-2 py-1 rounded transition-colors",
                isAddingCustomCategory
                  ? "bg-neutral-black text-white"
                  : cn(mutedTextColor, "hover:bg-gray-100 hover:text-black"),
              )}
            >
              {isAddingCustomCategory ? "Cancel" : "+ Add"}
            </button>
          )}
        </div>

        {isAddingCustomCategory && (
          <div className="mb-2 space-y-1.5">
            <Input
              type="text"
              value={newCustomCategory}
              onChange={(e) => setNewCustomCategory(e.target.value)}
              placeholder="Enter category name"
              className="text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateCustomCategory();
                }
              }}
            />
            <Button
              type="button"
              onClick={handleCreateCustomCategory}
              className="w-full bg-neutral-black text-white hover:bg-dark-surface text-xs"
              size="sm"
            >
              Create Category
            </Button>
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {[...CATEGORIES, ...customCategories.map((cc) => cc.name)].map(
            (category) => (
              <button
                type="button"
                key={category}
                onClick={() => toggleCategory(category)}
                tabIndex={4}
                className={cn(
                  newPrompt.categories.includes(category)
                    ? "bg-maslow-teal text-white border-maslow-teal"
                    : cn(
                        "border",
                        borderColor,
                        mutedTextColor,
                        "hover:border-maslow-teal hover:text-maslow-teal",
                      ),
                  "p-1.5 border rounded-md transition-colors duration-200 text-xs focus:outline-none focus:ring-1 focus:ring-maslow-teal",
                )}
              >
                {category}
              </button>
            ),
          )}
        </div>
      </div>

      <div>
        <label className={cn(mutedTextColor, "block text-sm font-medium mb-1")}>
          Prompt<span className="text-[#EF442D]">* (required)</span>
        </label>
        <Textarea
          value={newPrompt.prompt}
          onChange={(e) =>
            setNewPrompt({ ...newPrompt, prompt: e.target.value })
          }
          className={cn(bgColor, textColor, "h-28 resize-none")}
          placeholder="Enter your prompt template"
          tabIndex={5}
          required
        />
      </div>

      {!isEditing && (
        <div className="space-y-2">
          <label className={cn(mutedTextColor, "block text-sm font-medium")}>
            Visibility
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!isSignedIn}
              onClick={() =>
                setNewPrompt((prev) => ({ ...prev, isPublic: true }))
              }
              tabIndex={6}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md border transition-colors text-sm",
                newPrompt.isPublic
                  ? "bg-neutral-black text-white border-neutral-black"
                  : cn("border", borderColor, mutedTextColor),
                !isSignedIn && "opacity-50 cursor-not-allowed",
              )}
            >
              <Globe size={14} />
              <span>Public</span>
            </button>
            <button
              type="button"
              disabled={!isSignedIn}
              onClick={() =>
                setNewPrompt((prev) => ({ ...prev, isPublic: false }))
              }
              tabIndex={7}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md border transition-colors text-sm",
                !newPrompt.isPublic
                  ? "bg-neutral-black text-white border-neutral-black"
                  : cn("border", borderColor, mutedTextColor),
                !isSignedIn && "opacity-50 cursor-not-allowed",
              )}
            >
              <Lock size={14} className={cn(mutedTextColor)} />
              <span>Private</span>
            </button>
          </div>
          {!isSignedIn ? (
            <p className={cn(mutedTextColor, "text-xs")}>
              Sign in to set prompt visibility or delete your prompts.
            </p>
          ) : (
            <p className={cn(mutedTextColor, "text-xs")}>
              {newPrompt.isPublic
                ? "Anyone can view this prompt"
                : "Only you can view this prompt"}
            </p>
          )}
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          tabIndex={8}
          className="w-full bg-neutral-black hover:bg-dark-surface text-white"
        >
          <Sparkles size={16} />
          {isEditing ? "Save Changes" : "Share Prompt"}
        </Button>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent
          className={cn(bgColor, "max-w-2xl max-h-[90vh] overflow-y-auto")}
        >
          <DialogHeader>
            <DialogTitle className="font-sans text-xl font-semibold text-[#1A202C]">
              {isEditing ? "Edit Prompt" : "Share Prompt"}
            </DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={cn("p-4 sm:p-5 w-full rounded-lg")}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-sans text-xl font-semibold text-[#1A202C]">
          {isEditing ? "Edit Prompt" : "Share Prompt"}
        </h2>
      </div>
      {formContent}
    </div>
  );
};
