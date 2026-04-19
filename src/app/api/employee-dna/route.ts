import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { employeeData, founderDNA } = await req.json();

    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!CLAUDE_KEY || !founderDNA) {
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

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

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
      console.error('Employee DNA JSON parse failed, using derived fallback:', parseErr);
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
    console.error('Employee DNA error:', err);
    return NextResponse.json({ error: 'Failed to map employee DNA' }, { status: 500 });
  }
}
