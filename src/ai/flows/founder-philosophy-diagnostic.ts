'use server';

/**
 * @fileOverview A Genkit flow for the Founder-Centric AI Employee Growth Platform (NiyamAI).
 * This flow implements the AI-powered diagnostic for founders to deeply understand their core philosophy and map it to the behavioral framework.
 *
 * - founderPhilosophyDiagnostic - A function that handles the founder's diagnostic process by synthesizing their manifesto into structured founder DNA.
 * - FounderPhilosophyDiagnosticInput - The input type for the founderPhilosophyDiagnostic function.
 * - FounderPhilosophyDiagnosticOutput - The return type for the founderPhilosophyDiagnostic function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TraitSchema = z.object({
  name: z.string().describe('The name of the trait.'),
  cluster: z.string().describe('The behavioral cluster the trait belongs to.'),
  score: z.number().int().min(0).max(100).describe('The score for this trait (0-100) reflecting the founder\'s emphasis.'),
  description: z.string().describe('A brief description of how this trait manifests in the founder\'s philosophy.'),
});

const FounderPhilosophyDiagnosticInputSchema = z.object({
  founderManifesto: z.string().describe('The founder\'s vision statement or manifesto, detailing their core beliefs, values, and strategic direction.'),
});
export type FounderPhilosophyDiagnosticInput = z.infer<typeof FounderPhilosophyDiagnosticInputSchema>;

const FounderPhilosophyDiagnosticOutputSchema = z.object({
  philosophy: z.string().describe('A refined summary of the founder\'s core philosophy and strategic vision derived from the manifesto and diagnostic.'),
  signatureTraits: z.array(TraitSchema).describe('A selection of 10 to 15 key behavioral traits from the NiyamAI framework that best define the founder\'s leadership and operational style. Each trait includes its cluster, a score (0-100) indicating prominence, and a brief description of its manifestation.'),
  negativeConstraints: z.array(z.string()).describe('A list of 3 to 5 critical principles or actions the founder believes the organization should explicitly avoid.'),
  riskAppetite: z.number().int().min(0).max(100).describe('The founder\'s propensity for taking risks, scaled from 0 (very risk-averse) to 100 (highly risk-tolerant).'),
  innovationBias: z.number().int().min(0).max(100).describe('The founder\'s inclination towards innovation and disruption, scaled from 0 (traditional) to 100 (highly innovative).'),
});
export type FounderPhilosophyDiagnosticOutput = z.infer<typeof FounderPhilosophyDiagnosticOutputSchema>;

// The 67-trait behavioral framework as described in the prompt
const behavioralFramework = `
Cluster A - Strategic Thinking: Strategic Vision, Business Acumen, Analytical Thinking, Innovation Orientation, Market Awareness, Risk Assessment, Long-term Orientation, Systems Thinking, Opportunity Recognition
Cluster B - Execution & Results: Results Orientation, Planning & Organisation, Decision Quality, Action Orientation, Follow-through, Process Discipline, Resource Optimization, Problem Solving, Accountability
Cluster C - People Leadership: Team Building, Talent Development, Delegation, Motivation, Performance Management, Empowerment, Conflict Management, Coaching, Inclusive Leadership, Succession Thinking
Cluster D - Interpersonal Effectiveness: Communication Clarity, Active Listening, Relationship Building, Collaboration, Influence, Negotiation, Political Savvy, Stakeholder Management, Customer Orientation, Network Building
Cluster E - Personal Effectiveness: Self-Awareness, Emotional Intelligence, Integrity, Resilience, Learning Agility, Composure, Humility, Confidence, Energy & Drive, Work-Life Integration
Cluster F - Change & Adaptability: Change Leadership, Adaptability, Ambiguity Tolerance, Continuous Improvement, Future Orientation, Transformation Mindset, Experimentation, Letting Go
Cluster G - Organisational Contribution: Organisational Commitment, Culture Carrier, Knowledge Sharing, Cross-functional Thinking, Institutional Memory, Mentorship, Ambassadorship
Cluster H - Specialised Capabilities: Technical/Functional Expertise, Industry Knowledge, Digital Fluency, Global/Regional Perspective
`;

export async function founderPhilosophyDiagnostic(
  input: FounderPhilosophyDiagnosticInput
): Promise<FounderPhilosophyDiagnosticOutput> {
  return founderPhilosophyDiagnosticFlow(input);
}

const founderPhilosophyDiagnosticFlow = ai.defineFlow(
  {
    name: 'founderPhilosophyDiagnosticFlow',
    inputSchema: FounderPhilosophyDiagnosticInputSchema,
    outputSchema: FounderPhilosophyDiagnosticOutputSchema,
  },
  async (input) => {
    const { founderManifesto } = input;

    const systemPrompt = `You are NiyamAI, an expert in organizational psychology, behavioral science, and founder philosophy.
Your primary task is to conduct an AI diagnostic probe to deeply understand a founder's core philosophy and map it to a structured behavioral framework.
The founder has provided their manifesto. Based on this manifesto, you will synthesize the findings as if you have already conducted a series of 10-15 probing questions about decision-making, risk, conflict handling, innovation, integrity, and cultural expectations.

Here is the NiyamAI 67-trait behavioral framework, categorized into clusters. Ensure that 'signatureTraits' are selected from this exact list, and their 'cluster' field accurately reflects their category:
${behavioralFramework}

Analyze the founder's manifesto provided below, and from this analysis and your simulated diagnostic process, identify the following elements of the founder's DNA:
1.  **Philosophy**: Provide a concise, refined summary of their core philosophy and strategic vision.
2.  **Signature Traits**: Select 10 to 15 signature traits from the provided 67-trait framework that best represent the founder's behavioral DNA. For each selected trait, assign an integer score between 0 and 100, indicating its prominence in the founder's philosophy (0 = not present, 100 = highly central). Also, provide a brief, insightful description of how this specific trait manifests in their thinking and operational style based on the manifesto.
3.  **Negative Constraints**: List 3 to 5 critical principles, boundaries, or actions the founder believes the organization should absolutely avoid.
4.  **Risk Appetite**: Assign a single integer score between 0 and 100, where 0 represents extreme risk-aversion and 100 represents a highly risk-tolerant approach.
5.  **Innovation Bias**: Assign a single integer score between 0 and 100, where 0 indicates a highly traditional mindset and 100 indicates an extremely innovative and disruptive inclination.

Output your findings as a JSON object, strictly adhering to the output schema. Your response must be only the JSON object. The schema is as follows:
${JSON.stringify(FounderPhilosophyDiagnosticOutputSchema.shape, null, 2)}`;

    const userMessage = `Founder's Manifesto:\n${founderManifesto}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.CLAUDE_API_KEY!,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
          temperature: 0.2,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const claudeOutput = data.content[0].text;

      const parsedOutput: FounderPhilosophyDiagnosticOutput = JSON.parse(claudeOutput);

      const validationResult = FounderPhilosophyDiagnosticOutputSchema.safeParse(parsedOutput);
      if (!validationResult.success) {
        console.error('Claude output parsing error:', validationResult.error);
        throw new Error('Claude response did not match expected schema.');
      }

      return validationResult.data;

    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw new Error('Failed to run founder philosophy diagnostic with Claude AI.');
    }
  }
);
