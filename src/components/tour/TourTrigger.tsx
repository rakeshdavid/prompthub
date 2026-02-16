import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTour } from "@/contexts/TourContext";

export function TourTrigger() {
  const { startTour } = useTour();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => startTour()}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <HelpCircle size={16} />
      <span className="hidden lg:inline text-xs">Tour</span>
    </Button>
  );
}
