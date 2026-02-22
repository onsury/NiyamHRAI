import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Book, ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const alignmentData = [
  { name: "W1", score: 65 },
  { name: "W2", score: 68 },
  { name: "W3", score: 75 },
  { name: "W4", score: 72 },
  { name: "W5", score: 80 },
  { name: "W6", score: 82 },
];

const driftAreas = [
  { name: "Innovation Orientation", progress: 60, change: "+5%" },
  { name: "Risk Assessment", progress: 45, change: "-2%" },
  { name: "Strategic Vision", progress: 85, change: "+8%" },
];

export default function EmployeeDashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="rounded-3xl bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Welcome back, User</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              We&apos;ve observed a significant neural shift in your Innovation
              Orientation. Performance velocity is currently outpacing organizational drift.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button className="rounded-full bg-amber-500 text-primary hover:bg-amber-400">
              <Zap className="mr-2 h-4 w-4" /> Enter Honing Lab
            </Button>
            <Button variant="secondary" className="rounded-full">
              <Book className="mr-2 h-4 w-4" /> Knowledge Stream
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="font-headline uppercase tracking-tight">Alignment Velocity</CardTitle>
                <CardDescription>Weekly synergy score</CardDescription>
              </div>
              <div className="text-right">
                 <p className="font-bold text-green-500 text-lg">+2.8% GAIN</p>
                 <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={alignmentData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                 <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[60, 90]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '1rem',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorUv)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="font-headline uppercase tracking-tight">Neural Drift Mapping</CardTitle>
            <CardDescription>Your current behavioral alignment focus areas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {driftAreas.map((area) => (
              <div key={area.name}>
                <div className="flex justify-between text-sm mb-1">
                  <p className="font-medium text-primary">{area.name}</p>
                  <p className="font-mono text-muted-foreground">{area.change}</p>
                </div>
                <Progress value={area.progress} className="h-2 [&>div]:bg-accent" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <Card className="rounded-3xl sticky top-24">
          <CardHeader>
            <CardTitle className="font-headline uppercase tracking-tight">Neural Pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <p className="text-sm font-medium">Strategic Alignment</p>
                <p className="font-bold text-green-500">88%</p>
              </div>
              <Progress value={88} className="h-2 [&>div]:bg-green-500" />
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <p className="text-sm font-medium">Decision Logic</p>
                <p className="font-bold text-green-500">92%</p>
              </div>
              <Progress value={92} className="h-2 [&>div]:bg-green-500" />
            </div>
             <div>
              <p className="text-sm font-medium">Synergy Delta</p>
              <p className="font-headline text-2xl font-bold text-primary">+1.2%</p>
            </div>
             <div className="bg-accent/10 rounded-xl p-4">
              <p className="text-sm font-medium text-accent">PROMOTION READINESS</p>
              <p className="font-headline text-lg font-bold text-primary">KEY &rarr; MIDDLE</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl bg-indigo-600 text-primary-foreground">
          <CardContent className="p-6">
             <p className="text-sm font-medium uppercase tracking-wider">Growth Vector</p>
            <p className="mt-2 text-lg font-semibold">&quot;The distance between your team’s execution and your vision is the arbitrage opportunity.&quot;</p>
            <p className="mt-4 text-xs text-indigo-200 font-semibold uppercase">Founder Insight</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
