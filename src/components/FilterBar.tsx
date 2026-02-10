import {
  Plus,
  ChevronDown,
  LayoutGrid,
  List,
  TrendingUp,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DEPARTMENTS, getDepartmentColor } from "@/constants/departments";
import { Id } from "../../convex/_generated/dataModel";

interface FilterBarProps {
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
  selectedCategories: string[];
  toggleFilterCategory: (category: string) => void;
  categories: Array<{ name: string; count: number }>;
  sortByDate: boolean;
  setSortByDate: (v: boolean) => void;
  sortByLikes: boolean;
  setSortByLikes: (v: boolean) => void;
  isListView: boolean;
  setIsListView: (v: boolean) => void;
  showPrivatePrompts: boolean;
  setShowPrivatePrompts: (v: boolean) => void;
  isSignedIn: boolean | undefined;
  setIsSignInOpen: (v: boolean) => void;
  setIsModalOpen: (v: boolean) => void;
  privatePromptsCount: number;
  resultCount: number;
  customCategories: Array<{ _id: Id<"customCategories">; name: string }>;
  onDeleteCustomCategory: (id: Id<"customCategories">, name: string) => void;
}

export function FilterBar({
  selectedDepartment,
  setSelectedDepartment,
  selectedCategories,
  toggleFilterCategory,
  categories,
  sortByDate,
  setSortByDate,
  sortByLikes,
  setSortByLikes,
  isListView,
  setIsListView,
  showPrivatePrompts,
  setShowPrivatePrompts,
  isSignedIn,
  setIsSignInOpen,
  setIsModalOpen,
  privatePromptsCount,
  resultCount,
}: FilterBarProps) {
  const hasActiveFilters =
    selectedDepartment || selectedCategories.length > 0 || showPrivatePrompts;

  const sortLabel = sortByDate ? "Recent" : sortByLikes ? "Impact" : "Default";
  const sortValue = sortByDate ? "date" : sortByLikes ? "likes" : "default";

  const clearAllFilters = () => {
    setSelectedDepartment("");
    selectedCategories.forEach((cat) => toggleFilterCategory(cat));
    if (showPrivatePrompts) setShowPrivatePrompts(false);
  };

  const visibleCategories = categories.filter((c) => c.count > 0);

  return (
    <div className="sticky top-[73px] z-40 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
        {/* Row 1: Department pills */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedDepartment("")}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150",
              !selectedDepartment
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
            )}
          >
            All
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
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150",
                selectedDepartment === dept.name
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
              )}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: getDepartmentColor(dept.name) }}
              />
              {dept.name}
            </button>
          ))}
        </div>

        {/* Row 2: Controls toolbar */}
        <div className="flex items-center justify-between gap-3 pb-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                >
                  Category
                  {selectedCategories.length > 0 && (
                    <span className="bg-foreground text-background rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                      {selectedCategories.length}
                    </span>
                  )}
                  <ChevronDown size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Filter by category
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {visibleCategories.map((cat) => (
                  <DropdownMenuCheckboxItem
                    key={cat.name}
                    checked={selectedCategories.includes(cat.name)}
                    onCheckedChange={() => toggleFilterCategory(cat.name)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span className="flex-1 truncate">{cat.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {cat.count}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                >
                  Sort: {sortLabel}
                  <ChevronDown size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuRadioGroup
                  value={sortValue}
                  onValueChange={(val) => {
                    if (!isSignedIn) {
                      setIsSignInOpen(true);
                      return;
                    }
                    setSortByDate(val === "date");
                    setSortByLikes(val === "likes");
                  }}
                >
                  <DropdownMenuRadioItem value="default">
                    Default
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="date">
                    <Clock size={12} className="mr-1" />
                    Recent
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="likes">
                    <TrendingUp size={12} className="mr-1" />
                    Impact
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Grid/List toggle */}
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setIsListView(false)}
                className={cn(
                  "p-1.5 transition-colors",
                  !isListView
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setIsListView(true)}
                className={cn(
                  "p-1.5 transition-colors",
                  isListView
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List size={14} />
              </button>
            </div>

            {/* Result count + clear */}
            <span className="text-xs text-muted-foreground">
              {resultCount} prompt{resultCount !== 1 ? "s" : ""}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>

          {/* Right side: My Prompts + Share */}
          <div className="flex items-center gap-2">
            <Button
              variant={showPrivatePrompts ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 text-xs gap-1",
                showPrivatePrompts && "bg-foreground text-background",
              )}
              onClick={() => {
                if (isSignedIn) {
                  setShowPrivatePrompts(!showPrivatePrompts);
                } else {
                  setIsSignInOpen(true);
                }
              }}
            >
              My Prompts
              {privatePromptsCount > 0 && (
                <span
                  className={cn(
                    "rounded-full w-4 h-4 text-[10px] flex items-center justify-center",
                    showPrivatePrompts
                      ? "bg-background text-foreground"
                      : "bg-foreground text-background",
                  )}
                >
                  {privatePromptsCount}
                </span>
              )}
            </Button>

            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="h-8 text-xs bg-[var(--maslow-teal)] hover:bg-[var(--maslow-teal)]/90 text-white"
            >
              <Plus size={12} />
              Share Prompt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
