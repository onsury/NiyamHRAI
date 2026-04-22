import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { parseBody, dnaPassthroughSchema, stringArraySchema, sanitizeResponse, EmployeeDNAResponseSchema } from '@/lib/validation';

const EmployeeDNASchema = z.object({
  employeeData: z.object({
    role: z.string().max(200).optional(),
    level: z.string().max(100).optional(),
    skills: stringArraySchema.optional(),
    experience: z.string().max(2000).optional(),
    goals: z.string().max(2000).optional(),
  }),
  founderDNA: dnaPassthroughSchema,
});
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/employee-dna
 *
 * Generates an initial Employee DNA profile for the signed-in user by mapping
 * them against their organisation's Founder DNA, and persists the result.
 *
 * H-2 / H-3 hardening: previously the client received the DNA JSON and
 * wrote it to Firestore itself (employeeDNA/current + dnaHistory/{auto}).
 * Rules now deny those client writes (employeeDNA.write=false,
 * dnaHistory.create=false). This route owns the writes exclusively,
 * keyed on authResult.uid so the caller cannot target another user.
 */

interface EmployeeDNA {
  traits: any[];
  synergyScore: number;
  driftAreas: string[];
  strengths: string[];
  lastUpdated: string;
}

/**
 * Persist the newly-computed DNA both as the current snapshot and as the
 * first dnaHistory entry. Single batched write for atomicity.
 */
async function saveDNAServerSide(uid: string, dna: EmployeeDNA, trigger: string) {
  const batch = adminDb.batch();
  const currentRef = adminDb.doc(`users/${uid}/employeeDNA/current`);
  const historyRef = adminDb.collection(`users/${uid}/dnaHistory`).doc();

  batch.set(currentRef, {
    ...dna,
    lastUpdated: FieldValue.serverTimestamp(),
  });

  batch.set(historyRef, {
    traits: dna.traits || [],
    synergyScore: dna.synergyScore || 50,
    trigger,
    timestamp: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.error) return authResult.error;
    const { uid } = authResult;

    const parsed = await parseBody(req, EmployeeDNASchema);
    if (parsed.error) return parsed.error;
    const { employeeData, founderDNA } = parsed.data;

    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;
    console.log('[employee-dna] CLAUDE_API_KEY present:', !!CLAUDE_KEY, 'length:', CLAUDE_KEY?.length || 0);
    console.log('[employee-dna] founderDNA present:', !!founderDNA);

    // --- Branch 1: No key or no founderDNA -> return baseline, still persist ---
    if (!CLAUDE_KEY || !founderDNA) {
      console.warn('[employee-dna] Missing key or founderDNA -- returning baseline');
      const baseTraits = (founderDNA?.signatureTraits || []).map((ft: any) => ({
        name: ft.name,
        cluster: ft.cluster,
        score: Math.max(20, Math.min(80, ft.score + Math.floor(Math.random() * 30 - 15))),
        description: '',
      }));
      const dna: EmployeeDNA = {
        traits: baseTraits,
        synergyScore: 50,
        driftAreas: ['Awaiting deeper assessment'],
        strengths: ['Willingness to learn'],
        lastUpdated: new Date().toISOString(),
      };
      await saveDNAServerSide(uid, dna, 'onboarding');
      return NextResponse.json(sanitizeResponse<any>(dna, EmployeeDNAResponseSchema, dna));
    }

    // --- Branch 2: Call Claude ---
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
        system: `You are NiyamAI's Employee DNA Mapper. Given an employee's profile and the founder's DNA benchmark, generate an initial DNA profile predicting alignment.

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

    console.log('[employee-dna] anthropic HTTP status:', res.status, res.statusText);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('[employee-dna] anthropic API error body:', errorBody);
      throw new Error(`Anthropic API returned ${res.status}: ${errorBody.slice(0, 500)}`);
    }

    const data = await res.json();
    console.log('[employee-dna] anthropic response structure:', {
      hasContent: !!data.content,
      contentLength: data.content?.length || 0,
      firstBlockType: data.content?.[0]?.type,
      stopReason: data.stop_reason,
      usage: data.usage,
    });

    const text = data.content?.[0]?.text ?? '';
    console.log('[employee-dna] claude text length:', text.length);

    if (!text || text.trim().length === 0) {
      throw new Error('Claude returned empty response');
    }

    // Robust JSON extraction
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const jsonSlice = (firstBrace !== -1 && lastBrace > firstBrace)
      ? text.substring(firstBrace, lastBrace + 1)
      : text;

    try {
      const parsed = JSON.parse(jsonSlice);
      const dna: EmployeeDNA = {
        traits: parsed.traits || [],
        synergyScore: parsed.synergyScore ?? 50,
        driftAreas: parsed.driftAreas || [],
        strengths: parsed.strengths || [],
        lastUpdated: new Date().toISOString(),
      };
      await saveDNAServerSide(uid, dna, 'onboarding');
      return NextResponse.json(sanitizeResponse<any>(dna, EmployeeDNAResponseSchema, dna));
    } catch (parseErr) {
      console.error('[employee-dna] JSON parse failed');
      // --- Branch 3: Parse failed, derive from founder traits ---
      const derivedTraits = (founderDNA?.signatureTraits || []).map((ft: any) => ({
        name: ft.name,
        cluster: ft.cluster,
        score: Math.max(20, Math.min(80, ft.score + Math.floor(Math.random() * 30 - 15))),
        description: '',
      }));
      const avgScore = derivedTraits.length > 0
        ? Math.round(derivedTraits.reduce((s: number, t: any) => s + t.score, 0) / derivedTraits.length)
        : 50;
      const dna: EmployeeDNA = {
        traits: derivedTraits,
        synergyScore: avgScore,
        driftAreas: ['Awaiting deeper check-in data'],
        strengths: ['Profile captured'],
        lastUpdated: new Date().toISOString(),
      };
      await saveDNAServerSide(uid, dna, 'onboarding');
      return NextResponse.json(sanitizeResponse<any>(dna, EmployeeDNAResponseSchema, dna));
    }
  } catch (err: any) {
    console.error('[employee-dna] Top-level error:', err.message, err.stack?.slice(0, 500));
    return NextResponse.json({ error: 'Failed to map employee DNA' }, { status: 500 });
  }
}
