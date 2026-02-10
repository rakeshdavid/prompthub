import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Search, Plus, Menu } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  setIsModalOpen?: (isOpen: boolean) => void;
  setIsSignInOpen?: (isOpen: boolean) => void;
}

export function Header({
  searchQuery,
  setSearchQuery,
  setIsModalOpen,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn } = useUser();
  const router = useRouter();
  const currentPath = router.state.location.pathname;
  const showSearch = currentPath === "/";
  const useModal = currentPath === "/";

  return (
    <header className="relative h-auto w-full bg-background border-b border-border">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              <div className="hidden sm:block">
                <h1 className="font-display font-extrabold text-[18px] leading-tight text-foreground tracking-tight">
                  Prompt Hub
                </h1>
                <span className="text-muted-foreground text-[13px] font-normal">
                  Demo
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {setSearchQuery && showSearch && (
              <div className="relative flex-1 max-w-md">
                <Search
                  className="text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2"
                  size={16}
                />
                <Input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm"
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <div className="w-fit">
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-neutral-black hover:bg-dark-surface text-white border-none"
                    >
                      Log in
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-neutral-black hover:bg-dark-surface text-white border-none"
                    >
                      Sign up
                    </Button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: brand text + Sheet trigger */}
          <span className="md:hidden font-display font-extrabold text-[18px] text-foreground">
            <a href="/">Demo</a>
          </span>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-background">
              <SheetHeader>
                <SheetTitle className="text-foreground">Menu</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                {setSearchQuery && showSearch && (
                  <div className="relative">
                    <Search
                      className="text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2"
                      size={16}
                    />
                    <Input
                      type="text"
                      placeholder="Search prompts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-2 text-sm"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <Link
                    to="/about"
                    className="text-foreground hover:text-muted-foreground transition-colors duration-200 text-sm font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                  {useModal ? (
                    <Button
                      onClick={() => {
                        setIsModalOpen?.(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="bg-neutral-black hover:bg-dark-surface text-white"
                      size="default"
                    >
                      <Plus size={12} />
                      <span>Share Prompt</span>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="bg-neutral-black hover:bg-dark-surface text-white"
                      size="default"
                    >
                      <Link
                        to="/addnew"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Plus size={12} />
                        <span>Share Prompt</span>
                      </Link>
                    </Button>
                  )}
                  {isSignedIn ? (
                    <div className="w-fit">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <SignInButton mode="modal">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-neutral-black hover:bg-dark-surface text-white border-none"
                        >
                          Log in
                        </Button>
                      </SignInButton>
                      <SignUpButton mode="modal">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-neutral-black hover:bg-dark-surface text-white border-none"
                        >
                          Sign up
                        </Button>
                      </SignUpButton>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
