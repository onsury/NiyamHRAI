// This module handles saving founder DNA after assessment completion
// Called from the founder setup page on final submission

export async function processFounderAssessment(params: {
  uid: string;
  orgName: string;
  industry: string;
  rawAnswers: Record<string, number>;
  voiceCaptures: Record<string, string>;
  nonNegotiables: string[];
}) {
  const { uid, orgName, industry, rawAnswers, voiceCaptures, nonNegotiables } = params;

  // Call AI to extract and enrich traits
  const res = await fetch('/api/founder-dna', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
