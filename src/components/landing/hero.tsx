import Link from "next/link";
import { ArrowDown } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 lg:py-40">
      <div className="container relative z-10 text-center">
        <h1 className="font-headline text-4xl font-bold uppercase tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl">
          Mapping the <span className="text-accent">Neural</span> DNA.
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-lg text-primary/80 md:text-xl">
          Niyam is the first Neural Alignment Engine for enterprises. We
          synchronize employee behavioral signatures with the founder&apos;s
          strategic vision.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link href="/login">Initialize Diagnostic</Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full" asChild>
            <Link href="#core-principles">
              Core Thinking <ArrowDown className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
