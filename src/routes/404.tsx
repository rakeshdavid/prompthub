import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/404")({
  component: NotFoundPage,
});

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className={cn("min-h-screen flex flex-col bg-background")}>
      <Header />
      <div className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <span className="text-4xl font-bold text-foreground">
              Maslow AI
            </span>
          </div>

          <h1 className="text-7xl font-bold text-neutral-black dark:text-foreground mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Looks like you've found a page that doesn't exist
          </h2>
          <p className="text-muted-foreground mb-8">
            Don't worry, even the best explorers sometimes wander into uncharted
            territory.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate({ to: "/" })}
              size="lg"
              className="bg-neutral-black text-white hover:bg-neutral-black/90"
            >
              Home
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default NotFoundPage;
