import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { placeholderImages } from "@/lib/placeholder-images";

const promoters = [
  {
    name: "Suryanarayanan",
    title: "Business Transformation Consultant",
    experience: "32 years",
    imageId: "promoter1",
  },
  {
    name: "Raghupathy",
    title: "HR Transformation Specialist",
    experience: "32 years",
    imageId: "promoter2",
  },
];

export default function Promoters() {
  return (
    <section className="bg-secondary py-16 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-primary sm:text-4xl">
            Meet The Promoters
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Decades of experience in business and human resources transformation,
            now focused on neural alignment.
          </p>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          {promoters.map((promoter) => {
            const imageData = placeholderImages.find(
              (img) => img.id === promoter.imageId
            );
            return (
              <Card
                key={promoter.name}
                className="overflow-hidden rounded-3xl"
              >
                <div className="relative h-64 w-full">
                  {imageData && (
                    <Image
                      src={imageData.imageUrl}
                      alt={promoter.name}
                      fill
                      className="object-cover"
                      data-ai-hint={imageData.imageHint}
                    />
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="font-headline text-2xl font-semibold text-primary">
                    {promoter.name}
                  </CardTitle>
                  <CardDescription className="text-accent">
                    {promoter.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-bold text-primary">
                    {promoter.experience} of proven expertise.
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
