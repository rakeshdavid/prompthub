import { Link } from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <>
      <div className="accent-line-teal" />
      <footer className="bg-background py-6 sm:py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-foreground mb-4">
                  Enterprise AI Hub
                </h4>
                <div className="text-[0.8rem] font-normal space-y-1">
                  <p className="text-muted-foreground">
                    Maslow AI | Enterprise AI Hub
                  </p>
                  <p className="text-muted-foreground">
                    A platform for sharing and discovering enterprise AI prompts
                    across departments.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-4">
                  Navigation
                </h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/about"
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-[0.8rem] font-normal"
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/docs"
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-[0.8rem] font-normal"
                    >
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <a
                      href="mailto:contact@maslow.ai"
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-[0.8rem] font-normal"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-4">
                  Maslow AI
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://maslow.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-[0.8rem] font-normal"
                    >
                      maslow.ai
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex text-[0.8rem] flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <span className="text-muted-foreground">
                  Powered by Maslow AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
