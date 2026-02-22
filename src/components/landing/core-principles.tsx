import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Target, Zap } from "lucide-react";

const principles = [
  {
    icon: Target,
    title: "Alignment Over Compliance",
    description:
      "We focus on synchronizing mindset and behavior, not just enforcing rules. True synergy comes from shared understanding, not forced adherence.",
  },
  {
    icon: Gem,
    title: "First Principles Design",
    description:
      "Our framework is built from the ground up, deconstructing complex behaviors into 67 fundamental traits for precise measurement and growth.",
  },
  {
    icon: Zap,
    title: "Growth Velocity",
    description:
      "By reducing cognitive friction, we accelerate decision-making and execution, directly impacting your organization's speed and adaptability.",
  },
];

export default function CorePrinciples() {
  return (
    <section id="core-principles" className="bg-secondary py-16 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-primary sm:text-4xl">
            Core Principles
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            The foundational beliefs that drive the NiyamAI engine.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {principles.map((principle, index) => (
            <Card
              key={index}
              className="rounded-3xl text-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              <CardHeader className="items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <principle.icon className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="font-headline text-xl font-bold uppercase text-primary">
                  {principle.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{principle.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
