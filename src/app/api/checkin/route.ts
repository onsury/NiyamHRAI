import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { reflection, founderDNA, employeeDNA, userName } = await req.json();

    if (!reflection) {
      return NextResponse.json({ error: 'Reflection required' }, { status: 400 });
    }

    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    // If no Claude key, return structured fallback
    if (!CLAUDE_KEY) {
      return NextResponse.json({
        mentorship: `Thank you for your reflection, ${userName || 'team member'}. Your awareness of this week's challenges shows growth. Focus on connecting your daily decisions to the founder's core principles. Next week, try to identify one specific moment where you applied the organisation's values in a tough situation.`,
        synergyDelta: 2,
        driftAreas: ['Strategic Alignment', 'Decision Patterns'],
        strengths: ['Self-Awareness', 'Commitment to Growth'],
      });
    }

    // Build founder context
    const founderContext = founderDNA ? `
FOUNDER DNA BENCHMARK:
Philosophy: ${founderDNA.philosophy || 'Not yet mapped'}
Key Traits: ${(founderDNA.signatureTraits || []).slice(0, 10).map((t: any) => `${t.name}: ${t.score}/100`).join(', ')}
Non-Negotiables: ${(founderDNA.negativeConstraints || []).join(', ')}
Voice Captures: ${Object.entries(founderDNA.voiceCaptures || {}).map(([k, v]) => `[${k}]: "${v}"`).join(' | ')}
` : '';

    const employeeContext = employeeDNA ? `
EMPLOYEE CURRENT DNA:
Synergy Score: ${employeeDNA.synergyScore || 50}%
Drift Areas: ${(employeeDNA.driftAreas || []).join(', ')}
Strengths: ${(employeeDNA.strengths || []).join(', ')}
` : '';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: `You are NiyamAI, a founder-aligned AI mentor. Your job is to help employees grow closer to the founder's thinking patterns. Be warm but direct. Use the founder's own language and principles when giving advice. Always provide actionable, specific guidance.

${founderContext}
${employeeContext}

Respond in this JSON format:
{
  "mentorship": "Your personalised mentorship message (2-3 paragraphs, warm but direct)",
  "synergyDelta": number between -5 and +5 (change in synergy score based on this reflection),
  "driftAreas": ["area1", "area2"] (max 3 areas where employee is drifting from founder DNA),
  "strengths": ["strength1", "strength2"] (max 3 strengths shown in this reflection)
}`,
        messages: [{
          role: 'user',
          content: `Employee ${userName || 'team member'} submitted this weekly reflection:\n\n"${reflection}"\n\nProvide founder-aligned mentorship. Respond ONLY with valid JSON.`
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        mentorship: text || 'Your reflection has been noted. Keep connecting your decisions to the founder\'s vision.',
        synergyDelta: 1,
        driftAreas: ['Alignment Pending'],
        strengths: ['Consistency'],
      });
    }
  } catch (err: any) {
    console.error('Check-in API error:', err);
    return NextResponse.json({
      mentorship: 'Your reflection has been recorded. AI mentorship is temporarily unavailable — your growth matters and we\'ll analyse this soon.',
      synergyDelta: 0,
      driftAreas: [],
      strengths: [],
    });
  }
}
