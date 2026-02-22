import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NeuralLogic() {
  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div className="space-y-4 text-center md:text-left">
          <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-gradient bg-gradient-to-b from-primary to-primary/60 sm:text-4xl">
            From Static KPIs to Neural Synergy
          </h2>
          <p className="text-lg text-muted-foreground">
            We move beyond traditional metrics to map the very fabric of your
            organization&apos;s thought process, ensuring every action is an
            echo of the core strategy.
          </p>
        </div>
        <div className="flex justify-center">
          <Card className="w-full max-w-sm rounded-3xl border-2 border-primary/10 bg-background/50 p-4 shadow-2xl backdrop-blur-sm">
            <CardHeader className="items-center pb-2">
              <CardTitle className="font-headline text-6xl font-bold text-green-500">
                92%
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="font-headline text-xl font-semibold uppercase tracking-tight text-primary">
                Optimal Alignment
              </p>
              <div className="mt-4 flex justify-around text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p className="font-bold text-green-500">SYNCED</p>
                  <p>Strategy Sync</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-green-500">ONLINE</p>
                  <p>Execution Node</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
