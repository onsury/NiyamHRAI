import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  try {
    const input = await req.json();
    const { generateHoningScenario } = await import('@/ai/flows/generate-honing-scenario');
    const result = await generateHoningScenario(input);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Scenario API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
