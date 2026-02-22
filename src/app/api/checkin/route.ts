import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  try {
    const input = await req.json();
    const { submitCheckIn } = await import('@/ai/flows/personalized-ai-mentorship');
    const result = await submitCheckIn(input);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Check-in API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
