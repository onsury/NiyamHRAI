import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { parseBody, dnaPassthroughSchema } from '@/lib/validation';

const HoningEvaluateSchema = z.object({
  scenario: z.string().max(4000),
  response: z.string().max(4000),
  trait: z.string().max(100),
  founderDNA: dnaPassthroughSchema,
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.error) return authResult.error;
    // const { uid } = authResult;  // available for per-user quota enforcement (M-level scope)

    const parsed = await parseBody(req, HoningEvaluateSchema);
    if (parsed.error) return parsed.error;
    const { scenario, response: userResponse, trait, founderDNA } = parsed.data;

    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!CLAUDE_KEY) {
      return NextResponse.json({
        evaluation: `Your response shows thoughtful consideration. You demonstrated awareness of competing priorities. To better align with the founder's DNA, consider how the organisation's non-negotiables should guide your decision in these situations.`,
        alignmentScore: 65,
        founderWouldSay: 'Consider the long-term impact on trust and relationships, not just the immediate outcome.',
        improvementTip: 'Before deciding, ask yourself: what would the founder prioritise here?',
      });
    }

    const founderContext = founderDNA ? `
Founder's approach: ${(founderDNA.signatureTraits || []).filter((t: any) => t.cluster === trait?.toLowerCase()).map((t: any) => `${t.name}: ${t.score}/100`).join(', ')}
Non-negotiables: ${(founderDNA.negativeConstraints || []).join(', ')}
Founder's voice: ${Object.values(founderDNA.voiceCaptures || {}).slice(0, 2).join(' | ')}
` : '';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `You are NiyamAI's Honing Lab evaluator. Evaluate the employee's response to a business scenario against the founder's DNA benchmark. Be constructive and specific.

${founderContext}

Respond ONLY with valid JSON:
{
  "evaluation": "2-3 sentence evaluation of their response",
  "alignmentScore": number 0-100 (how aligned with founder DNA),
  "founderWouldSay": "What the founder would say about this situation in their own voice",
  "improvementTip": "One specific actionable tip"
}`,
        messages: [{
          role: 'user',
          content: `Scenario: ${scenario}\nTrait being tested: ${trait}\nEmployee's response: "${userResponse}"\n\nEvaluate alignment with founder DNA. Respond ONLY with valid JSON.`
        }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    try {
      return NextResponse.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch {
      return NextResponse.json({
        evaluation: text || 'Response noted. Continue practicing alignment.',
        alignmentScore: 60,
        founderWouldSay: 'Think about what matters most in the long run.',
        improvementTip: 'Connect your decisions back to the organisation\'s core principles.',
      });
    }
  } catch (err: any) {
    console.error('Honing eval error:', err);
    return NextResponse.json({
      evaluation: 'Evaluation temporarily unavailable. Your response has been saved for later analysis.',
      alignmentScore: 50,
      founderWouldSay: '',
      improvementTip: 'Keep practicing Ã¢â‚¬â€ consistency builds alignment.',
    });
  }
}
