import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { parseBody, dnaPassthroughSchema } from '@/lib/validation';

const CheckinSchema = z.object({
  reflection: z.string().max(4000),
  userName: z.string().max(200).optional(),
  founderDNA: dnaPassthroughSchema,
  employeeDNA: dnaPassthroughSchema,
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.error) return authResult.error;
    // const { uid } = authResult;  // available for per-user quota enforcement (M-level scope)

    const parsed = await parseBody(req, CheckinSchema);
    if (parsed.error) return parsed.error;
    const { reflection, founderDNA, employeeDNA, userName } = parsed.data;

    if (!reflection) {
      return NextResponse.json({ error: 'Reflection required' }, { status: 400 });
    }

    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    // DIAGNOSTIC: log whether key is present (not the value)
    console.log('[checkin] CLAUDE_API_KEY present:', !!CLAUDE_KEY, 'length:', CLAUDE_KEY?.length || 0);

    // If no Claude key, return structured fallback
    if (!CLAUDE_KEY) {
      console.warn('[checkin] No CLAUDE_API_KEY Ã¢â‚¬â€ returning no-key fallback');
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
        max_tokens: 2000,
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

    // DIAGNOSTIC: check HTTP status BEFORE parsing
    console.log('[checkin] anthropic HTTP status:', response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[checkin] anthropic API error body:', errorBody);
      throw new Error(`Anthropic API returned ${response.status}: ${errorBody.slice(0, 500)}`);
    }

    const data = await response.json();

    // DIAGNOSTIC: log the response structure
    console.log('[checkin] anthropic response structure:', {
      hasContent: !!data.content,
      contentLength: data.content?.length || 0,
      firstBlockType: data.content?.[0]?.type,
      stopReason: data.stop_reason,
      usage: data.usage,
    });

    const text = data.content?.[0]?.text ?? '';

    // DIAGNOSTIC: log what we got from Claude
    console.log('[checkin] claude text length:', text.length, 'first 200 chars:', text.slice(0, 200));

    if (!text || text.trim().length === 0) {
      console.error('[checkin] Claude returned empty text. Full data:', JSON.stringify(data).slice(0, 1000));
      throw new Error('Claude returned empty response');
    }

    // Robust JSON extraction: find first { and matching last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const jsonSlice = (firstBrace !== -1 && lastBrace > firstBrace)
      ? text.substring(firstBrace, lastBrace + 1)
      : text;

    try {
      const parsed = JSON.parse(jsonSlice);
      return NextResponse.json(parsed);
    } catch (parseErr) {
      console.error('[checkin] JSON parse failed. Slice was:', jsonSlice.slice(0, 500));
      return NextResponse.json({
        mentorship: text && text.length > 40
          ? text.replace(/```json|```/g, '').trim()
          : 'Your reflection has been noted. Keep connecting your decisions to the founder\'s vision.',
        synergyDelta: 1,
        driftAreas: ['Alignment Pending'],
        strengths: ['Consistency'],
      });
    }
  } catch (err: any) {
    console.error('[checkin] Top-level error:', err.message, err.stack?.slice(0, 500));
    return NextResponse.json({
      mentorship: 'Your reflection has been recorded. AI mentorship is temporarily unavailable Ã¢â‚¬â€ your growth matters and we\'ll analyse this soon.',
      synergyDelta: 0,
      driftAreas: [],
      strengths: [],
    });
  }
}