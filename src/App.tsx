import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Lock,
  ChevronDown,
  ChevronUp,
  Expand,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { PromptForm } from "./components/PromptForm";
import { PromptCard } from "@/components/PromptCard";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { Switch } from "./components/ui/switch";
import { Id } from "../convex/_generated/dataModel";
import { CATEGORIES } from "./constants/categories";
import { DEPARTMENTS } from "./constants/departments";
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
      <div className="relative flex flex-col lg:flex-row gap-6 max-w-[full] mx-auto px-4 sm:px-6 py-8">
        <div className="w-full lg:w-64 lg:flex-none">
          <div className="lg:sticky lg:top-24">
            <div className="space-y-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: "smooth",
                    })
                  }
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ChevronDown size={16} />
                  Scroll to bottom
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showPrivatePrompts}
                  onCheckedChange={(checked) => {
                    if (isSignedIn) {
                      setShowPrivatePrompts(checked);
                      setIsMyPromptsOpen(false);
                    } else {
                      setIsSignInOpen(true);
                    }
                  }}
                  disabled={!isSignedIn}
                  className="data-[state=checked]:bg-neutral-black"
                />
                <button
                  onClick={() => {
                    if (isSignedIn) {
                      setShowPrivatePrompts(!showPrivatePrompts);
                      setIsMyPromptsOpen(false);
                    } else {
                      setIsSignInOpen(true);
                    }
                  }}
                  className="text-muted-foreground text-sm flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <span>
                    {showPrivatePrompts ? "My Prompts" : "All Prompts"}
                  </span>
                  {privatePromptsCount > 0 && (
                    <span className="text-xs bg-neutral-black text-white px-1.5 py-0.5 rounded">
                      {privatePromptsCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={sortByDate}
                  onCheckedChange={(checked) => {
                    if (isSignedIn) {
                      setSortByDate(checked);
                      if (checked) setSortByLikes(false);
                    } else {
                      setIsSignInOpen(true);
                    }
                  }}
                  disabled={!isSignedIn}
                  className="data-[state=checked]:bg-neutral-black"
                />
                <button
                  onClick={() => {
                    if (isSignedIn) {
                      setSortByDate(!sortByDate);
                      if (!sortByDate) setSortByLikes(false);
                    } else {
                      setIsSignInOpen(true);
                    }
                  }}
                  className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                  sort by date
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={sortByLikes}
                  onCheckedChange={(checked) => {
                    if (isSignedIn) {
                      setSortByLikes(checked);
                      if (checked) setSortByDate(false);
                    } else {
                      setIsSignInOpen(true);
                    }
                  }}
                  disabled={!isSignedIn}
                  className="data-[state=checked]:bg-neutral-black"
                />
                <button
                  onClick={() => {
                    if (isSignedIn) {
                      setSortByLikes(!sortByLikes);
                      if (!sortByLikes) setSortByDate(false);
                    } else {
                      setIsSignInOpen(true);
                    }
                  }}
                  className="text-muted-foreground text-sm hover:text-foreground transition-colors flex items-center gap-1"
                >
                  sort by impact
                  <TrendingUp size={14} />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={isListView}
                  onCheckedChange={setIsListView}
                  className="data-[state=checked]:bg-neutral-black"
                />
                <label className="text-muted-foreground text-sm">
                  list view
                </label>
              </div>

              {/* Department Filter */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-foreground text-sm font-medium">
                    Departments
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
                  <button
                    onClick={() => setSelectedDepartment("")}
                    className={cn(
                      !selectedDepartment
                        ? "bg-neutral-black text-white"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      "px-2.5 py-1.5 text-left transition-colors duration-200 rounded-md text-[0.875em]",
                    )}
                  >
                    All Departments
                  </button>
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept.name}
                      onClick={() =>
                        setSelectedDepartment(
                          selectedDepartment === dept.name ? "" : dept.name,
                        )
                      }
                      className={cn(
                        selectedDepartment === dept.name
                          ? "bg-neutral-black text-white"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        "flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors duration-200 rounded-md text-[0.875em]",
                      )}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: dept.color }}
                      />
                      <span className="truncate">{dept.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-foreground text-sm font-medium">
                    Categories
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
                  {categories
                    .filter(
                      (category) =>
                        category.count > 0 ||
                        (isSignedIn &&
                          customCategories.some(
                            (cc) => cc.name === category.name,
                          )),
                    )
                    .map((category) => {
                      const isCustomCategory = customCategories.some(
                        (cc) => cc.name === category.name,
                      );
                      const customCategoryData = customCategories.find(
                        (cc) => cc.name === category.name,
                      );

                      return (
                        <div
                          key={category.name}
                          className="flex items-center gap-1"
                        >
                          <button
                            onClick={() => toggleFilterCategory(category.name)}
                            className={cn(
                              selectedCategories.includes(category.name)
                                ? "bg-neutral-black text-white"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              "flex items-center justify-between px-2.5 py-1.5 text-left transition-colors duration-200 rounded-md text-[0.875em] flex-1",
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <span className="truncate">{category.name}</span>
                            </span>
                            <span
                              className={cn(
                                selectedCategories.includes(category.name)
                                  ? "text-gray-400"
                                  : "text-muted-foreground",
                                "text-sm ml-2",
                              )}
                            >
                              {category.count}
                            </span>
                          </button>
                          {isSignedIn &&
                            isCustomCategory &&
                            customCategoryData && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustomCategory(
                                    customCategoryData._id,
                                    customCategoryData.name,
                                  );
                                }}
                                className="text-muted-foreground hover:text-red-500 transition-colors duration-200 p-1"
                                title="Delete custom category"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                        </div>
                      );
                    })}
                </div>
              </div>

              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-neutral-black hover:bg-dark-surface text-white"
              >
                <Plus size={16} />
                <span>Share Prompt</span>
              </Button>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ChevronUp size={16} />
                Scroll to top
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1">
          {isListView ? (
            // List View
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(showPrivatePrompts ? sortedPrivatePrompts : sortedPrompts).map(
                (prompt, index) => (
                  <div
                    key={index}
                    className="bg-card border border-border p-3 hover:bg-muted transition-colors duration-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {/* Index number */}
                      <span className="text-muted-foreground text-sm font-mono w-6 text-right">
                        {index + 1}.
                      </span>

                      {/* Privacy indicator */}
                      {!prompt.isPublic && isSignedIn && (
                        <div className="bg-neutral-black px-1.5 py-1.5 rounded">
                          <Lock size={14} className="text-white" />
                        </div>
                      )}

                      {/* Title and link */}
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

                        {/* Department badge */}
                        {prompt.department && (
                          <DepartmentBadge
                            department={prompt.department}
                            className="ml-2"
                          />
                        )}

                        {/* Categories */}
                        <div className="flex items-center gap-2 mt-1">
                          {prompt.categories
                            .slice(0, 3)
                            .map((category, idx) => (
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

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        {/* Like button */}
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

                        {/* Open link */}
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
            // Grid View - uses the new PromptCard component
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
        </div>
      </div>

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

      <Footer />
    </div>
  );
}

export default App;
