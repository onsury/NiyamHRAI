import Link from "next/link";
import { Chrome } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NiyamLogo from "@/components/niyam-logo";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <Card className="w-full max-w-sm rounded-2xl shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <NiyamLogo className="h-12 w-12" />
          </div>
          <CardTitle className="font-headline text-2xl font-bold uppercase tracking-tight text-primary">
            Welcome to NiyamAI
          </CardTitle>
          <CardDescription>
            Sign in to align your neural signature.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" />
          </div>
          <Button className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            Sign In
          </Button>
        </CardContent>
        <Separator className="my-4" />
        <CardFooter className="flex flex-col gap-4">
          <Button variant="outline" className="w-full rounded-full">
            <Chrome className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="#" className="underline text-accent">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
