import { cn } from "@/lib/utils";

export default function NiyamLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg bg-primary",
        className
      )}
    >
      <span className="font-headline text-xl font-bold text-primary-foreground">
        N
      </span>
    </div>
  );
}
