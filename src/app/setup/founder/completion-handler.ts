// This module handles saving founder DNA after assessment completion
// Called from the founder setup page on final submission
// NOTE: no current callers in the codebase as of the C-3 patch (2026-04-22).
// If you revive this helper, ensure the caller site is a "use client" context
// so that auth.currentUser is populated.

import { auth } from '@/lib/firebase';

export async function processFounderAssessment(params: {
  uid: string;
  orgName: string;
  industry: string;
  rawAnswers: Record<string, number>;
  voiceCaptures: Record<string, string>;
  nonNegotiables: string[];
}) {
  const { uid, orgName, industry, rawAnswers, voiceCaptures, nonNegotiables } = params;

  // Get ID token from the currently signed-in Firebase user.
  // Required because /api/founder-dna now enforces authentication (C-3).
  const idToken = await auth.currentUser?.getIdToken();

  // Call AI to extract and enrich traits
  const res = await fetch('/api/founder-dna', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ rawAnswers, voiceCaptures, orgName, industry }),
  });

  const dna = await res.json();

  // Merge non-negotiables from form with AI-extracted ones
  const allConstraints = [...new Set([...(dna.negativeConstraints || []), ...nonNegotiables.filter(Boolean)])];

  return {
    ...dna,
    negativeConstraints: allConstraints,
    diagnosticComplete: true,
  };
}
