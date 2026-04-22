import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.error) return authResult.error;
    // const { uid } = authResult;  // available for per-user quota enforcement (M-level scope)

    const { employeeData, founderDNA } = await req.json();

    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    // DIAGNOSTIC: log whether key is present (not the value)
    console.log('[employee-dna] CLAUDE_API_KEY present:', !!CLAUDE_KEY, 'length:', CLAUDE_KEY?.length || 0);
    console.log('[employee-dna] founderDNA present:', !!founderDNA);

    if (!CLAUDE_KEY || !founderDNA) {
      console.warn('[employee-dna] Missing key or founderDNA â€” returning baseline fallback');
      // Generate baseline DNA without AI
      const baseTraits = (founderDNA?.signatureTraits || []).map((ft: any) => ({
        name: ft.name,
        cluster: ft.cluster,
        score: Math.max(20, Math.min(80, ft.score + Math.floor(Math.random() * 30 - 15))),
        description: '',
      }));

      return NextResponse.json({
        traits: baseTraits,
        synergyScore: 50,
        driftAreas: ['Awaiting deeper assessment'],
        strengths: ['Willingness to learn'],
        lastUpdated: new Date().toISOString(),
      });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        system: `You are NiyamAI's Employee DNA Mapper. Given an employee\'s profile and the founder\'s DNA benchmark, generate an initial DNA profile predicting alignment.

FOUNDER DNA BENCHMARK:
${(founderDNA.signatureTraits || []).map((t: any) => `${t.name} (${t.cluster}): ${t.score}/100`).join('\n')}
Philosophy: ${founderDNA.philosophy || 'Not captured'}
Non-negotiables: ${(founderDNA.negativeConstraints || []).join(', ')}

Respond ONLY with valid JSON:
{
  "traits": [{"name": "TraitName", "cluster": "clusterid", "score": 0-100, "description": "brief"}],
  "synergyScore": 0-100,
  "driftAreas": ["area1", "area2", "area3"],
  "strengths": ["strength1", "strength2"]
}`,
        messages: [{ role: 'user', content: `Employee Profile:
Role: ${employeeData.role || 'Employee'}
Level: ${employeeData.level || 'MIDDLE'}
Skills: ${(employeeData.skills || []).join(', ')}
Experience: ${employeeData.experience || 'Not specified'}
Goals: ${employeeData.goals || 'Not specified'}

Map their initial DNA against founder benchmark. Respond with JSON only.` }],
      }),
    });

    // DIAGNOSTIC: check HTTP status BEFORE parsing
    console.log('[employee-dna] anthropic HTTP status:', res.status, res.statusText);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('[employee-dna] anthropic API error body:', errorBody);
      throw new Error(`Anthropic API returned ${res.status}: ${errorBody.slice(0, 500)}`);
    }

    const data = await res.json();

    // DIAGNOSTIC: log the response structure
    console.log('[employee-dna] anthropic response structure:', {
      hasContent: !!data.content,
      contentLength: data.content?.length || 0,
      firstBlockType: data.content?.[0]?.type,
      stopReason: data.stop_reason,
      usage: data.usage,
    });

    const text = data.content?.[0]?.text ?? '';

    // DIAGNOSTIC: log what we got from Claude
    console.log('[employee-dna] claude text length:', text.length, 'first 200 chars:', text.slice(0, 200));

    if (!text || text.trim().length === 0) {
      console.error('[employee-dna] Claude returned empty text. Full data:', JSON.stringify(data).slice(0, 1000));
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
      return NextResponse.json({
        ...parsed,
        lastUpdated: new Date().toISOString(),
      });
    } catch (parseErr) {
      console.error('[employee-dna] JSON parse failed. Slice was:', jsonSlice.slice(0, 500));
      // Meaningful fallback: derive scores from founder traits with random variation
      const derivedTraits = (founderDNA?.signatureTraits || []).map((ft: any) => ({
        name: ft.name,
        cluster: ft.cluster,
        score: Math.max(20, Math.min(80, ft.score + Math.floor(Math.random() * 30 - 15))),
        description: '',
      }));
      const avgScore = derivedTraits.length > 0
        ? Math.round(derivedTraits.reduce((s: number, t: any) => s + t.score, 0) / derivedTraits.length)
        : 50;
      return NextResponse.json({
        traits: derivedTraits,
        synergyScore: avgScore,
        driftAreas: ['Awaiting deeper check-in data'],
        strengths: ['Profile captured'],
        lastUpdated: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    console.error('[employee-dna] Top-level error:', err.message, err.stack?.slice(0, 500));
    return NextResponse.json({ error: 'Failed to map employee DNA' }, { status: 500 });
  }
}