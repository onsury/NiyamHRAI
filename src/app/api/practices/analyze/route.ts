import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { practices, industry, orgSize, founderDNA } = await req.json();

    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!CLAUDE_KEY) {
      return NextResponse.json({
        benchmarkScore: 65,
        gaps: ['Structured onboarding process', 'Documented exit interview process', 'Formal L&D calendar'],
        strengths: ['Existing leave policy', 'Performance review cycle'],
        recommendations: ['Formalise your onboarding into a 30-60-90 plan', 'Add quarterly pulse surveys'],
        complianceFlags: ['Ensure POSH committee is constituted', 'Verify PF/ESI compliance'],
        founderAlignment: 'Your practices show moderate alignment with the founder DNA. Key gap: the founder values rapid decision-making but current approval chains are 4 levels deep.',
      });
    }

    const founderContext = founderDNA ? `
FOUNDER DNA CONTEXT:
Philosophy: ${founderDNA.philosophy || 'Not mapped'}
Key Traits: ${(founderDNA.signatureTraits || []).slice(0, 8).map((t: any) => `${t.name}: ${t.score}/100`).join(', ')}
Non-Negotiables: ${(founderDNA.negativeConstraints || []).join(', ')}
Culture traits: ${(founderDNA.signatureTraits || []).filter((t: any) => t.cluster === 'culture' || t.cluster === 'people').map((t: any) => `${t.name}: ${t.score}`).join(', ')}
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
        max_tokens: 2000,
        system: `You are NiyamAI's People & Culture Intelligence engine. You analyse existing HR practices of Indian organisations and benchmark them against best practices, legal compliance (Indian labour law), and the founder's DNA.

You know Indian HR compliance deeply:
- Shops & Establishments Act (state-specific)
- Payment of Wages Act, Minimum Wages Act
- PF (EPF & MP Act 1952), ESI Act
- Payment of Gratuity Act
- Maternity Benefit Act 2017
- POSH Act 2013 (Sexual Harassment)
- Industrial Disputes Act
- Equal Remuneration Act
- Contract Labour Act
- Standing Orders (for 100+ employees)
- Karnataka/TN/MH specific rules as applicable

Industry: ${industry || 'Technology'}
Org Size: ${orgSize || '10-50'}

${founderContext}

Respond ONLY with valid JSON:
{
  "benchmarkScore": 0-100,
  "categoryScores": {
    "hiring_onboarding": { "score": 0-100, "status": "strong|adequate|needs_work|missing" },
    "compensation_benefits": { "score": 0-100, "status": "..." },
    "leave_attendance": { "score": 0-100, "status": "..." },
    "performance_management": { "score": 0-100, "status": "..." },
    "learning_development": { "score": 0-100, "status": "..." },
    "compliance_legal": { "score": 0-100, "status": "..." },
    "exit_offboarding": { "score": 0-100, "status": "..." },
    "culture_engagement": { "score": 0-100, "status": "..." },
    "diversity_inclusion": { "score": 0-100, "status": "..." },
    "grievance_discipline": { "score": 0-100, "status": "..." }
  },
  "gaps": ["gap1", "gap2", "gap3", "gap4", "gap5"],
  "strengths": ["strength1", "strength2", "strength3"],
  "complianceFlags": ["critical compliance issue 1", "issue 2"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "founderAlignment": "How existing practices align or conflict with founder DNA (2-3 sentences)",
  "quickWins": ["immediate action 1", "immediate action 2", "immediate action 3"]
}`,
        messages: [{
          role: 'user',
          content: `Analyse these existing HR practices and benchmark them:\n\n${JSON.stringify(practices, null, 2)}\n\nProvide comprehensive analysis. Respond with JSON only.`
        }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    try {
      return NextResponse.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch {
      return NextResponse.json({
        benchmarkScore: 50,
        gaps: ['Analysis in progress'],
        strengths: ['Practices documented'],
        recommendations: ['Complete the full practice intake for detailed analysis'],
        complianceFlags: [],
        founderAlignment: text || 'Analysis pending.',
      });
    }
  } catch (err: any) {
    console.error('Practice analysis error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
