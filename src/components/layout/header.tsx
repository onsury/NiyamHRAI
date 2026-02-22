import Link from "next/link";
import { ArrowDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import NiyamLogo from "@/components/niyam-logo";
import { cn } from "@/lib/utils";

const Header = ({ className }: { className?: string }) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <NiyamLogo />
          <span className="font-headline font-bold">NiyamAI</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-6 text-sm md:flex">
          {/* Add nav links here if needed */}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/login">
              Core Thinking <ArrowDown className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link href="/login">Initialize Diagnostic</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
