import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { parseBody, dnaPassthroughSchema } from '@/lib/validation';

const HoningScenarioSchema = z.object({
  trait: z.string().max(100),
  difficulty: z.string().max(100).optional(),
  founderDNA: dnaPassthroughSchema,
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.error) return authResult.error;
    // const { uid } = authResult;  // available for per-user quota enforcement (M-level scope)

    const parsed = await parseBody(req, HoningScenarioSchema);
    if (parsed.error) return parsed.error;
    const { trait, difficulty, founderDNA } = parsed.data;

    const founderContext = founderDNA ? `
The founder values: ${(founderDNA.signatureTraits || []).slice(0, 5).map((t: any) => t.name).join(', ')}
Non-negotiables: ${(founderDNA.negativeConstraints || []).slice(0, 3).join(', ')}
` : '';

    // Use Gemini if available, otherwise fallback
    const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!GEMINI_KEY) {
      return NextResponse.json({
        scenario: `You're leading a project that's behind schedule. A team member suggests cutting corners on quality to meet the deadline. Another suggests asking for a deadline extension. The client is already frustrated with delays. What do you do?`,
        trait: trait || 'Decision Architecture',
        difficulty: difficulty || 'medium',
        options: [
          'Cut scope to deliver core value on time',
          'Ask for extension with a clear recovery plan',
          'Push the team harder to meet the original deadline',
          'Deliver partial work and iterate based on feedback',
        ],
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate a business scenario for an employee to practice the trait "${trait || 'Strategic Thinking'}" at ${difficulty || 'medium'} difficulty.

${founderContext}

The scenario should be realistic, specific to Indian business contexts, and test the employee's alignment with the founder's thinking patterns.

Respond ONLY with valid JSON:
{
  "scenario": "A detailed 3-4 sentence business scenario",
  "trait": "${trait || 'Strategic Thinking'}",
  "difficulty": "${difficulty || 'medium'}",
  "options": ["option1", "option2", "option3", "option4"]
}` }] }],
      }),
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        scenario: text || 'A client asks for a major scope change two days before delivery. How do you handle it?',
        trait: trait || 'Decision Architecture',
        difficulty: difficulty || 'medium',
        options: ['Negotiate scope', 'Accept and overwork', 'Push back firmly', 'Propose phased delivery'],
      });
    }
  } catch (err: any) {
    console.error('Honing scenario error:', err);
    return NextResponse.json({
      scenario: 'Your team discovers a significant quality issue in a product about to ship. The sales team has already promised delivery to the client tomorrow. What\'s your call?',
      trait: 'Execution DNA',
      difficulty: 'medium',
      options: ['Delay and fix', 'Ship with known issue', 'Partial ship + hotfix', 'Escalate to founder'],
    });
  }
}
