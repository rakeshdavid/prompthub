import { useState, useEffect, useMemo } from "react";
import { Lock, Expand, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Header } from "./components/Header";
import { FilterBar } from "./components/FilterBar";

import { PromptForm } from "./components/PromptForm";
import { PromptCard } from "@/components/PromptCard";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { Id } from "../convex/_generated/dataModel";
import { CATEGORIES } from "./constants/categories";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DepartmentBadge } from "@/components/DepartmentBadge";

interface Prompt {
  _id: string;
  _creationTime?: number;
  title: string;
  description: string;
  prompt: string;
  categories: string[];
  stars: number;
  likes?: number;
  department?: string;
  isPublic: boolean;
  slug?: string;
  userId?: string;
}

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [categories, setCategories] = useState<
    Array<{ name: string; count: number }>
  >(CATEGORIES.map((category) => ({ name: category, count: 0 })));
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isMyPromptsOpen, setIsMyPromptsOpen] = useState(false);
  const [showPrivatePrompts, setShowPrivatePrompts] = useState(false);
  const [likedPrompts, setLikedPrompts] = useState<Set<string>>(new Set());
  const likePromptMutation = useMutation(api.prompts.likePrompt);
  const unlikePromptMutation = useMutation(api.prompts.unlikePrompt);
  const toggleVisibilityMutation = useMutation(
    api.prompts.togglePromptVisibility,
  );
  const deleteCustomCategoryMutation = useMutation(
    api.prompts.deleteCustomCategory,
  );
  const { isSignedIn } = useUser();
  const [sortByLikes, setSortByLikes] = useState(false);
  const [sortByDate, setSortByDate] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [promptToToggle, setPromptToToggle] = useState<Prompt | null>(null);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] =
    useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isListView, setIsListView] = useState(false);

  const customCategories = useQuery(api.prompts.getUserCustomCategories) || [];
  const searchResults = useQuery(api.prompts.searchPrompts, {
    searchQuery: searchQuery || undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    department: selectedDepartment || undefined,
  });

  useEffect(() => {
    if (!searchResults) return;

    // Combine default categories with custom categories
    const allCategories = [
      ...CATEGORIES,
      ...customCategories.map((cat) => cat.name),
    ];

    setCategories(
      allCategories.map((category) => ({
        name: category,
        count:
          searchResults?.filter((prompt) =>
            prompt.categories.includes(category),
          ).length || 0,
      })),
    );
  }, [searchResults, customCategories]);

  const privatePrompts = useQuery(api.prompts.getPrivatePrompts) || [];
  const privatePromptsCount = privatePrompts?.length || 0;

  const prompts = searchResults || [];

  const sortedPrompts = useMemo(() => {
    let sorted = [...prompts];

    if (sortByDate) {
      sorted = sorted.sort(
        (a, b) => (b._creationTime || 0) - (a._creationTime || 0),
      );
    } else if (sortByLikes) {
      sorted = sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    return sorted;
  }, [prompts, sortByLikes, sortByDate]);

  const sortedPrivatePrompts = useMemo(() => {
    let sorted = [...privatePrompts];

    if (sortByDate) {
      sorted = sorted.sort(
        (a, b) => (b._creationTime || 0) - (a._creationTime || 0),
      );
    } else if (sortByLikes) {
      sorted = sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    return sorted;
  }, [privatePrompts, sortByLikes, sortByDate]);

  const toggleFilterCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const handleLike = async (promptId: string) => {
    const typedId = promptId as Id<"prompts">;
    if (likedPrompts.has(promptId)) {
      await unlikePromptMutation({
        promptId: typedId,
      });
      setLikedPrompts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(promptId);
        return newSet;
      });
      return;
    }

    try {
      setLikedPrompts((prev) => new Set([...prev, promptId]));

      await likePromptMutation({
        promptId: typedId,
      });
    } catch (error) {
      setLikedPrompts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(promptId);
        return newSet;
      });
      console.error("Error liking prompt:", error);
    }
  };

  const confirmToggleVisibility = async () => {
    if (!promptToToggle) return;

    try {
      await toggleVisibilityMutation({
        id: promptToToggle._id as Id<"prompts">,
        isPublic: !promptToToggle.isPublic,
      });
      setIsVisibilityModalOpen(false);
      setPromptToToggle(null);
    } catch (error) {
      console.error("Error toggling visibility:", error);
      alert("Failed to update prompt visibility. Please try again.");
    }
  };

  const handleDeleteCustomCategory = (
    categoryId: Id<"customCategories">,
    categoryName: string,
  ) => {
    setCategoryToDelete({ id: categoryId, name: categoryName });
    setIsDeleteCategoryModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCustomCategoryMutation({
        id: categoryToDelete.id as Id<"customCategories">,
      });
      setIsDeleteCategoryModalOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Error deleting custom category:", error);
      alert("Failed to delete custom category. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setIsModalOpen={setIsModalOpen}
          setIsSignInOpen={setIsSignInOpen}
        />
      </div>
      <FilterBar
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        selectedCategories={selectedCategories}
        toggleFilterCategory={toggleFilterCategory}
        categories={categories}
        sortByDate={sortByDate}
        setSortByDate={(v) => {
          setSortByDate(v);
          if (v) setSortByLikes(false);
        }}
        sortByLikes={sortByLikes}
        setSortByLikes={(v) => {
          setSortByLikes(v);
          if (v) setSortByDate(false);
        }}
        isListView={isListView}
        setIsListView={setIsListView}
        showPrivatePrompts={showPrivatePrompts}
        setShowPrivatePrompts={(v) => {
          setShowPrivatePrompts(v);
          setIsMyPromptsOpen(false);
        }}
        isSignedIn={isSignedIn}
        setIsSignInOpen={setIsSignInOpen}
        setIsModalOpen={setIsModalOpen}
        privatePromptsCount={privatePromptsCount}
        resultCount={
          (showPrivatePrompts ? sortedPrivatePrompts : sortedPrompts).length
        }
        customCategories={customCategories}
        onDeleteCustomCategory={handleDeleteCustomCategory}
      />

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8">
        {isListView ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showPrivatePrompts ? sortedPrivatePrompts : sortedPrompts).map(
              (prompt, index) => (
                <div
                  key={index}
                  className="bg-card border border-border p-3 hover:bg-muted transition-colors duration-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-sm font-mono w-6 text-right">
                      {index + 1}.
                    </span>

                    {!prompt.isPublic && isSignedIn && (
                      <div className="bg-neutral-black px-1.5 py-1.5 rounded">
                        <Lock size={14} className="text-white" />
                      </div>
                    )}

                    <div className="flex-1">
                      <Link
                        to="/prompt/$slug"
                        params={{
                          slug: prompt.slug || generateSlug(prompt.title),
                        }}
                        className="text-foreground text-sm font-medium hover:underline"
                      >
                        {prompt.title}
                      </Link>

                      {prompt.department && (
                        <DepartmentBadge
                          department={prompt.department}
                          className="ml-2"
                        />
                      )}

                      <div className="flex items-center gap-2 mt-1">
                        {prompt.categories.slice(0, 3).map((category, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {category}
                          </Badge>
                        ))}
                        {prompt.categories.length > 3 && (
                          <span className="text-muted-foreground text-xs">
                            +{prompt.categories.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLike(prompt._id)}
                        className={cn(
                          "flex items-center gap-1 transition-colors duration-200",
                          likedPrompts.has(prompt._id)
                            ? "text-maslow-teal"
                            : "text-muted-foreground hover:text-maslow-teal",
                        )}
                      >
                        <TrendingUp size={14} />
                        <span className="text-xs">{prompt.likes || 0}</span>
                      </button>

                      <Link
                        to="/prompt/$slug"
                        params={{
                          slug: prompt.slug || generateSlug(prompt.title),
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        <Expand size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-7">
            {(showPrivatePrompts ? sortedPrivatePrompts : sortedPrompts).map(
              (prompt, index) => (
                <PromptCard
                  key={index}
                  prompt={prompt}
                  onLike={handleLike}
                  isLiked={likedPrompts.has(prompt._id)}
                  isSignedIn={isSignedIn ?? false}
                />
              ),
            )}
          </div>
        )}
      </main>

      {isModalOpen && (
        <PromptForm
          isModal={true}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
        />
      )}

      {/* Sign In Dialog */}
      <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              Log in to create private prompts.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* My Prompts Dialog */}
      <Dialog open={isMyPromptsOpen} onOpenChange={setIsMyPromptsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isSignedIn ? "My Private Prompts" : "Sign In Required"}
            </DialogTitle>
          </DialogHeader>

          {!isSignedIn ? (
            <div className="mt-2">
              <SignInButton mode="modal">
                <Button className="w-full bg-neutral-black hover:bg-dark-surface text-white">
                  Sign in to view private prompts
                </Button>
              </SignInButton>
            </div>
          ) : privatePrompts && privatePrompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {privatePrompts.map((prompt) => (
                <PromptCard
                  key={prompt._id}
                  prompt={prompt}
                  onLike={handleLike}
                  isLiked={likedPrompts.has(prompt._id)}
                  isSignedIn={isSignedIn ?? false}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              You don't have any private prompts yet. Create one by setting
              visibility to private when adding a new prompt.
            </p>
          )}
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

      {/* Visibility Toggle Dialog */}
      <Dialog
        open={isVisibilityModalOpen && !!promptToToggle}
        onOpenChange={(open) => {
          if (!open) {
            setIsVisibilityModalOpen(false);
            setPromptToToggle(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {promptToToggle?.isPublic ? "Make Private" : "Make Public"}
            </DialogTitle>
            <DialogDescription>
              {promptToToggle?.isPublic
                ? "Are you sure you want to make this prompt private? Only you will be able to see it."
                : "Are you sure you want to make this prompt public? Anyone will be able to see it."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsVisibilityModalOpen(false);
                setPromptToToggle(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmToggleVisibility}
              className="bg-neutral-black hover:bg-dark-surface text-white"
            >
              {promptToToggle?.isPublic ? "Make Private" : "Make Public"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog
        open={isDeleteCategoryModalOpen && !!categoryToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteCategoryModalOpen(false);
            setCategoryToDelete(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Custom Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the &ldquo;
              {categoryToDelete?.name}&rdquo; category? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteCategoryModalOpen(false);
                setCategoryToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteCategory}
              className="bg-neutral-black hover:bg-dark-surface text-white"
            >
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
