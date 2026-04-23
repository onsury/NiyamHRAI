import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { parseBody, sanitizeResponse, FounderDNAResponseSchema } from '@/lib/validation';

const FounderDNASchema = z.object({
  rawAnswers: z.record(z.union([z.number(), z.string()])).optional(),
  voiceCaptures: z.record(z.string().max(1000)).optional(),
  orgName: z.string().max(200).optional(),
  industry: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.error) return authResult.error;
    // const { uid } = authResult;  // available for per-user quota enforcement (M-level scope)

    const parsed = await parseBody(req, FounderDNASchema);
    if (parsed.error) return parsed.error;
    const { rawAnswers, voiceCaptures, orgName, industry } = parsed.data;

    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    // Map MCQ scores to trait names
    const traitMap: Record<string, { name: string; cluster: string }> = {
      'decision_speed': { name: 'Decision Velocity', cluster: 'decision' },
      'decision_data': { name: 'Data vs Intuition Balance', cluster: 'decision' },
      'decision_reversibility': { name: 'Reversibility Comfort', cluster: 'decision' },
      'people_hiring': { name: 'Hiring DNA', cluster: 'people' },
      'people_conflict': { name: 'Conflict Resolution Style', cluster: 'people' },
      'people_accountability': { name: 'Accountability Model', cluster: 'people' },
      'risk_appetite': { name: 'Risk Appetite', cluster: 'risk' },
      'risk_innovation': { name: 'Innovation Source', cluster: 'risk' },
      'risk_failure': { name: 'Failure Tolerance', cluster: 'risk' },
      'execution_planning': { name: 'Planning Horizon', cluster: 'execution' },
      'execution_delegation': { name: 'Delegation Style', cluster: 'execution' },
      'execution_quality': { name: 'Quality Standard', cluster: 'execution' },
      'culture_communication': { name: 'Communication Philosophy', cluster: 'culture' },
      'culture_workethic': { name: 'Work Ethic Expectation', cluster: 'culture' },
      'culture_authority': { name: 'Authority vs Autonomy', cluster: 'culture' },
      'growth_scaling': { name: 'Scaling Philosophy', cluster: 'growth' },
      'growth_learning': { name: 'Learning Culture', cluster: 'growth' },
      'growth_customer': { name: 'Customer Centricity', cluster: 'growth' },
    };

    // Build signature traits from MCQ scores
    const signatureTraits = Object.entries(rawAnswers || {}).map(([key, score]) => {
      const trait = traitMap[key] || { name: key, cluster: 'other' };
      return { name: trait.name, cluster: trait.cluster, score: Number(score) || 50, description: '' };
    });

    // Build philosophy from voice captures
    const philosophyParts = Object.entries(voiceCaptures || {}).map(([cluster, text]) => `[${cluster}]: ${text}`);
    const philosophy = philosophyParts.join('\n\n');

    // Calculate aggregate scores
    const riskTraits = signatureTraits.filter(t => t.cluster === 'risk');
    const riskAppetite = riskTraits.length > 0 ? Math.round(riskTraits.reduce((s, t) => s + t.score, 0) / riskTraits.length) : 50;
    const innovTraits = signatureTraits.filter(t => t.cluster === 'growth');
    const innovationBias = innovTraits.length > 0 ? Math.round(innovTraits.reduce((s, t) => s + t.score, 0) / innovTraits.length) : 50;

    // If Claude available, enhance trait descriptions
    if (CLAUDE_KEY && signatureTraits.length > 0) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1500,
            system: `You are NiyamAI's Founder DNA Analyst. Given a founder's MCQ scores and voice captures, generate rich descriptions for each trait and extract non-negotiables.

Industry: ${industry || 'Technology'}
Organisation: ${orgName || 'Unknown'}

Respond ONLY with valid JSON:
{
  "traitDescriptions": { "TraitName": "2-sentence description of how this founder exhibits this trait" },
  "negativeConstraints": ["thing1 the founder absolutely won\'t tolerate", "thing2", "thing3"],
  "founderArchetype": "One-line archetype like 'The Calculated Innovator' or 'The People-First Builder'"
}`,
            messages: [{ role: 'user', content: `Founder MCQ Scores:
${signatureTraits.map(t => `${t.name} (${t.cluster}): ${t.score}/100`).join('\n')}

Founder Voice Captures:
${philosophy}

Analyse and respond with JSON only.` }],
          }),
        });

        const data = await res.json();
        const text = data.content?.[0]?.text || '';
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

        // Enrich traits with descriptions
        signatureTraits.forEach(t => {
          if (parsed.traitDescriptions?.[t.name]) {
            t.description = parsed.traitDescriptions[t.name];
          }
        });

        const out0 = {
          signatureTraits,
          philosophy,
          voiceCaptures,
          rawAnswers,
          negativeConstraints: parsed.negativeConstraints || [],
          founderArchetype: parsed.founderArchetype || '',
          riskAppetite,
          innovationBias,
          diagnosticComplete: true,
        };
        return NextResponse.json(sanitizeResponse<any>(out0, FounderDNAResponseSchema, out0));
      } catch (aiErr) {
        console.error('Claude enrichment failed, using raw scores:', aiErr);
      }
    }

    // Fallback without AI enrichment
    const out1 = {
      signatureTraits,
      philosophy,
      voiceCaptures,
      rawAnswers,
      negativeConstraints: [],
      founderArchetype: '',
      riskAppetite,
      innovationBias,
      diagnosticComplete: true,
    };
    return NextResponse.json(sanitizeResponse<any>(out1, FounderDNAResponseSchema, out1));

  } catch (err: any) {
    console.error('Founder DNA API error:', err);
    return NextResponse.json({ error: 'Failed to process founder DNA' }, { status: 500 });
  }
}
