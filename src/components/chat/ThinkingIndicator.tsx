import { Brain } from "lucide-react";

export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground animate-pulse">
      <Brain size={16} className="text-maslow-teal" />
      <span>Thinking...</span>
    </div>
  );
}
