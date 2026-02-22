import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const modules = [
  { number: "01", title: "Employee Onboarding" },
  { number: "02", title: "Persona DNA Engine" },
  { number: "03", title: "Interaction Engine" },
  { number: "04", title: "Performance Tracker" },
  { number: "05", title: "HR Neural Insights" },
  { number: "06", title: "Knowledge Stream" },
];

export default function EngineModules() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-primary sm:text-4xl">
            Six Engine Modules
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            A comprehensive suite of tools designed to build a neurally aligned
            organization.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Card
              key={module.number}
              className="group rounded-3xl transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              <CardHeader>
                <CardTitle className="flex items-baseline gap-4">
                  <span className="font-headline text-4xl text-accent transition-colors group-hover:text-amber-400">
                    {module.number}
                  </span>
                  <span className="font-headline text-xl font-semibold uppercase tracking-tight">
                    {module.title}
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
