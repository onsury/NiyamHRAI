import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { assertPaidAccess } from '@/lib/subscription-check';
import { parseBody, dnaPassthroughSchema, sanitizeResponse, PracticesGenerateResponseSchema } from '@/lib/validation';
import type { TraitScore } from '@/types';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PracticesGenerateSchema = z.object({
  policyType: z.string().max(100),
  existingPractices: z.any().optional(),
  founderDNA: dnaPassthroughSchema,
  orgName: z.string().max(200).optional(),
  industry: z.string().max(200).optional(),
  orgSize: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.error) return authResult.error;
    const { uid } = authResult;

    // Paid-tier guardrail: blocks Claude API consumption for free / expired users
    const paymentBlock = await assertPaidAccess(uid);

    // ============================================================
    // POLICY_CACHE_BLOCK_v1 — Server-side cache check
    // Reads orgId from user doc, looks up cached policy, returns if hit
    // ============================================================
    const __adminDb = getFirestore();
    let __orgId: string | null = null;
    try {
      const __userSnap = await __adminDb.collection('users').doc(uid).get();
      __orgId = __userSnap.exists ? (__userSnap.data()?.organizationId || null) : null;
      if (!__orgId) __orgId = uid; // fallback: solo founder uses uid as orgId
    } catch (e) {
      console.error('[policy-cache] user lookup failed:', e);
    }

    // We need the policyType from the request body to look up cache.
    // Parse body early (idempotent — code below re-uses it).
    let __body: any = {};
    try {
      __body = await req.clone().json();
    } catch (_) {}
    const __policyType = __body?.policyType;

    if (__orgId && __policyType) {
      try {
        const __cacheSnap = await __adminDb
          .collection('organizations').doc(__orgId)
          .collection('policies').doc(__policyType)
          .get();
        if (__cacheSnap.exists) {
          const __cached = __cacheSnap.data();
          if (__cached && __cached.data) {
            console.log('[policy-cache] HIT for', __orgId, __policyType);
            return NextResponse.json({ ...__cached.data, __cached: true });
          }
        }
        console.log('[policy-cache] MISS for', __orgId, __policyType);
      } catch (e) {
        console.error('[policy-cache] cache lookup failed:', e);
        // fall through to fresh generation
      }
    }
    // ============================================================
    // END POLICY_CACHE_BLOCK_v1
    // ============================================================
    if (paymentBlock) return paymentBlock;

    const parsed = await parseBody(req, PracticesGenerateSchema);
    if (parsed.error) return parsed.error;
    const { policyType, existingPractices, founderDNA, orgName, industry, orgSize } = parsed.data;

    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    const policyPrompts: Record<string, string> = {
      employee_handbook: 'Generate a comprehensive Employee Handbook covering company overview, code of conduct, work policies, leave policies, benefits, grievance procedure, and separation policy.',
      onboarding_checklist: 'Generate a detailed 30-60-90 day onboarding checklist with specific milestones, training modules, and evaluation criteria.',
      performance_framework: 'Generate a performance management framework including KRA setting, review cycles, rating methodology, PIP process, and promotion criteria.',
      leave_policy: 'Generate a complete leave policy covering CL, SL, EL, maternity/paternity, bereavement, comp-off, LOP, and leave encashment -- compliant with Indian labour law.',
      posh_policy: 'Generate a POSH (Prevention of Sexual Harassment) policy compliant with the 2013 Act including ICC constitution, complaint procedure, timelines, and awareness requirements.',
      exit_process: 'Generate a complete exit/offboarding process including resignation acceptance, notice period, knowledge transfer, exit interview, full & final settlement, and experience letter.',
      code_of_conduct: 'Generate a Code of Conduct covering ethical behavior, conflict of interest, confidentiality, social media policy, dress code, and disciplinary procedures.',
      compensation_structure: 'Generate a compensation philosophy document covering salary bands, variable pay, increment policy, market benchmarking approach, and benefits structure.',
      learning_development: 'Generate an L&D framework covering training needs analysis, annual calendar, budget allocation, internal/external training, certifications, and ROI measurement.',
      diversity_inclusion: 'Generate a D&I policy covering equal opportunity, anti-discrimination, accessibility, cultural sensitivity, and representation goals.',
    };

    if (!CLAUDE_KEY) {
      return NextResponse.json({
        policyType,
        title: policyType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        content: 'Policy generation requires Claude API key. Configure CLAUDE_API_KEY in environment.',
        sections: [],
      });
    }

    const founderContext = founderDNA ? `
FOUNDER DNA ALIGNMENT:
The founder\'s culture preferences: ${(founderDNA.signatureTraits || []).filter((t: TraitScore) => t.cluster === 'culture' || t.cluster === 'people').map((t: TraitScore) => `${t.name}: ${t.score}/100`).join(', ')}
Non-negotiables: ${(founderDNA.negativeConstraints || []).join(', ')}
Voice on culture: ${founderDNA.voiceCaptures?.culture || founderDNA.voiceCaptures?.people || 'Not captured'}
` : '';

    const existingContext = existingPractices ? `
EXISTING PRACTICES TO INCORPORATE:
${JSON.stringify(existingPractices, null, 2)}

IMPORTANT: Build upon and improve existing practices. Do not discard what works. Strengthen weak areas while preserving the organisation\'s identity.
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
        max_tokens: 16000,
        system: `You are NiyamAI\'s HR Policy Generator for Indian organisations. Generate professional, legally compliant HR policies that align with the founder\'s DNA and build upon existing practices.

Organisation: ${orgName || 'Company'}
Industry: ${industry || 'Technology'}
Size: ${orgSize || '10-50 employees'}
Location: India (comply with Indian labour laws)

${founderContext}
${existingContext}

Respond ONLY with valid JSON:
{
  "title": "Policy Title",
  "version": "1.0",
  "effectiveDate": "Immediate",
  "sections": [
    {
      "heading": "Section Title",
      "content": "Detailed policy content (multiple paragraphs if needed)",
      "subSections": [
        { "heading": "Sub-section", "content": "Detail" }
      ]
    }
  ],
  "complianceNotes": ["Indian law compliance note 1", "note 2"],
  "founderAlignmentNote": "How this policy reflects the founder\'s values",
  "reviewCycle": "Annual / Bi-annual"
}`,
        messages: [{
          role: 'user',
          content: `${policyPrompts[policyType] || 'Generate a comprehensive HR policy.'}\n\nRespond with JSON only.`
        }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    // Tolerant parse: handles markdown fences, preambles, trailing commas
    const tolerantParse = (t: string): any | null => {
      let cleaned = t.replace(/```json|```/g, '').trim();
      try { return JSON.parse(cleaned); } catch (_) {}
      const fb = cleaned.indexOf('{');
      const lb = cleaned.lastIndexOf('}');
      if (fb >= 0 && lb > fb) {
        const ex = cleaned.substring(fb, lb + 1);
        try { return JSON.parse(ex); } catch (_) {}
        const noTrailing = ex.replace(/,(\s*[}\]])/g, '$1');
        try { return JSON.parse(noTrailing); } catch (_) {}
      }
      return null;
    };

    const parsedJson = tolerantParse(text);
    if (parsedJson) {
      const out = { policyType, ...parsedJson };
            // POLICY_CACHE_SAVE_v1 — persist for future free reads
      if (__orgId && __policyType) {
        try {
          await __adminDb
            .collection('organizations').doc(__orgId)
            .collection('policies').doc(__policyType)
            .set({
              policyType: __policyType,
              data: out,
              generatedAt: FieldValue.serverTimestamp(),
              generatedByUid: uid,
            });
          console.log('[policy-cache] SAVED', __orgId, __policyType);
        } catch (e) {
          console.error('[policy-cache] save failed (returning data anyway):', e);
        }
      }
      return NextResponse.json(sanitizeResponse<any>(out, PracticesGenerateResponseSchema, out));
    }
    return NextResponse.json({ policyType, title: policyType, content: text, sections: [] });
  } catch (err: any) {
    console.error('Policy generation error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
