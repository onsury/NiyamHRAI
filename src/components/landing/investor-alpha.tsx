import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function InvestorAlpha() {
  return (
    <section className="bg-gradient-to-r from-indigo-700 to-purple-800 py-16 text-primary-foreground md:py-24">
      <div className="container text-center">
        <h2 className="font-headline text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          The Investor Alpha Edge
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-indigo-200">
          Unlock predictive insights into execution capability and reduce human
          capital risk. NiyamAI offers a quantifiable measure of a team&apos;s
          ability to deliver on a founder&apos;s vision, providing a critical
          due diligence and value creation tool.
        </p>
        <div className="mt-8">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full border-amber-400 bg-transparent text-amber-400 hover:bg-amber-400 hover:text-primary"
            asChild
          >
            <Link href="/login">Explore Investor Dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
