export default function FeaturesList() {
  const features = [
    "People Stream to Strategy Stream Mapping",
    "Behavioral Drift Detection in Real-time",
    "Neural Convergence vs Performance Output",
    "Explainable AI Mentorship Cycles",
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-primary sm:text-4xl">
              A New Dimension of Organizational Intelligence
            </h2>
            <p className="text-lg text-muted-foreground">
              Our proprietary engine provides unprecedented visibility into the
              neural pathways of your organization.
            </p>
          </div>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={feature}
                className="flex items-center gap-4 rounded-xl border p-4 transition-all hover:bg-secondary hover:shadow-md"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <span className="font-bold">{index + 1}</span>
                </div>
                <p className="font-medium text-primary">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
