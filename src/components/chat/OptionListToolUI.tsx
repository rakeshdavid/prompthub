import { useState } from "react";
import { makeAssistantToolUI, useThreadRuntime } from "@assistant-ui/react";
import { ListFilter, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  label: string;
  description?: string;
}

interface OptionListArgs {
  title: string;
  options: Option[];
  selectionMode?: "single" | "multi";
}

type OptionListResult = string;

function OptionListContent({ args }: { args: OptionListArgs }) {
  const { title, options, selectionMode = "single" } = args;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const threadRuntime = useThreadRuntime();

  const handleSelect = (id: string) => {
    if (submitted) return;

    if (selectionMode === "single") {
      setSelected(new Set([id]));
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }
  };

  const handleConfirm = () => {
    if (selected.size === 0 || submitted) return;

    const selectedOptions = options.filter((o) => selected.has(o.id));
    const selectionText = selectedOptions.map((o) => o.label).join(", ");

    setSubmitted(true);

    threadRuntime.append({
      role: "user",
      content: [{ type: "text", text: `Selected: ${selectionText}` }],
    });
  };

  // Auto-confirm for single selection
  const handleSingleSelect = (id: string) => {
    if (submitted) return;

    const option = options.find((o) => o.id === id);
    if (!option) return;

    setSelected(new Set([id]));
    setSubmitted(true);

    threadRuntime.append({
      role: "user",
      content: [{ type: "text", text: `Selected: ${option.label}` }],
    });
  };

  const isDisabled = submitted;

  return (
    <div className="tool-card">
      <div className="tool-card-header">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {submitted && (
          <p className="text-xs text-emerald-500 mt-0.5 flex items-center gap-1">
            <Check size={12} /> Selection submitted
          </p>
        )}
      </div>
      <div className="p-2 space-y-1">
        {options.map((option) => {
          const isSelected = selected.has(option.id);
          return (
            <button
              key={option.id}
              onClick={() =>
                selectionMode === "single"
                  ? handleSingleSelect(option.id)
                  : handleSelect(option.id)
              }
              disabled={isDisabled}
              className={cn(
                "w-full text-left rounded-md px-3 py-2.5 transition-all",
                "border border-border/40 rounded-lg",
                isSelected
                  ? "bg-[#EBF7F4] dark:bg-[#EBF7F4]/15 border-maslow-teal/60 shadow-sm text-foreground"
                  : "hover:bg-[#EBF7F4]/50 dark:hover:bg-[#EBF7F4]/10 text-foreground",
                isDisabled && "opacity-60 cursor-not-allowed",
                !isDisabled && "cursor-pointer",
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center",
                    isSelected
                      ? "border-maslow-teal bg-maslow-teal"
                      : "border-muted-foreground/60",
                  )}
                >
                  {isSelected && (
                    <Check size={10} className="text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{option.label}</p>
                  {option.description && (
                    <p className="text-xs text-foreground/60 mt-0.5">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {selectionMode === "multi" && !isDisabled && (
        <div className="px-4 pb-3">
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className={cn(
              "w-full rounded-md px-3 py-2 text-sm font-medium transition-colors",
              selected.size > 0
                ? "bg-maslow-teal text-white shadow-sm hover:bg-maslow-teal/90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            Confirm Selection ({selected.size})
          </button>
        </div>
      )}
    </div>
  );
}

export const OptionListToolUI = makeAssistantToolUI<
  OptionListArgs,
  OptionListResult
>({
  toolName: "show_options",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card shadow-sm px-3 py-2 text-sm text-muted-foreground">
          <ListFilter size={14} className="animate-pulse text-maslow-teal" />
          <span>Loading options...</span>
        </div>
      );
    }

    if (!result) return null;

    try {
      const args: OptionListArgs =
        typeof result === "string" ? JSON.parse(result) : result;
      return <OptionListContent args={args} />;
    } catch {
      return null;
    }
  },
});
