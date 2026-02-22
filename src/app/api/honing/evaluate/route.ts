import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  try {
    const input = await req.json();
    const { evaluateHoningResponse } = await import('@/ai/flows/evaluate-honing-response');
    const result = await evaluateHoningResponse(input);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Evaluate API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
