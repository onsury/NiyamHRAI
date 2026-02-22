'use server';
/**
 * @fileOverview A Genkit flow for evaluating an employee's response to a honing lab simulation.
 * It uses the Claude Sonnet API to provide detailed feedback, synergy delta, and trait gain.
 *
 * - evaluateHoningResponse - A function that handles the evaluation process.
 * - EvaluateHoningResponseInput - The input type for the evaluateHoningResponse function.
 * - EvaluateHoningResponseOutput - The return type for the evaluateHoningResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define schemas for FounderDNA and EmployeeDNA as they would be passed to the AI
const FounderDNAPayloadSchema = z.object({
  philosophy: z.string().describe('The founder\'s core philosophy or manifesto.'),
  signatureTraits: z.array(z.object({
    name: z.string().describe('Name of the trait.'),
    cluster: z.string().describe('Behavioral cluster the trait belongs to.'),
    score: z.number().int().min(0).max(100).describe('Founder benchmark score for this trait.'),
    description: z.string().describe('Description of the trait.')
  })).describe('Key behavioral traits of the founder with their benchmark scores.'),
  negativeConstraints: z.array(z.string()).describe('List of behaviors or principles the organization should strictly avoid.'),
  riskAppetite: z.number().int().min(0).max(100).describe('Founder\'s risk appetite (0-100).'),
  innovationBias: z.number().int().min(0).max(100).describe('Founder\'s innovation bias (0-100).')
});
export type FounderDNAPayload = z.infer<typeof FounderDNAPayloadSchema>;

const EmployeeDNAPayloadSchema = z.object({
  selectedTraits: z.array(z.object({
    name: z.string().describe('Name of the trait.'),
    cluster: z.string().describe('Behavioral cluster the trait belongs to.'),
    score: z.number().int().min(0).max(100).describe('Employee\'s current score for this trait.'),
    founderBenchmark: z.number().int().min(0).max(100).describe('Founder\'s benchmark score for this trait.'),
    description: z.string().describe('Description of the trait.')
  })).describe('The employee\'s current behavioral traits and their scores.'),
  synergyScore: z.number().int().min(0).max(100).describe('Overall synergy score with founder DNA.'),
  alignmentSummary: z.string().describe('Summary of the employee\'s alignment with founder DNA.'),
  driftAreas: z.array(z.string()).describe('Areas where employee behavior might be drifting from founder principles.'),
  traitCount: z.number().int().describe('Number of traits mapped for this employee.')
});
export type EmployeeDNAPayload = z.infer<typeof EmployeeDNAPayloadSchema>;

const HoningScenarioPayloadSchema = z.object({
  scenario: z.string().describe('The business scenario presented in the honing lab.'),
  challenge: z.string().describe('The specific challenge within the scenario the employee had to address.'),
  founderTip: z.string().describe('A tip from the founder’s perspective relevant to the scenario.')
});
export type HoningScenarioPayload = z.infer<typeof HoningScenarioPayloadSchema>;

const EvaluateHoningResponseInputSchema = z.object({
  sessionId: z.string().describe('The ID of the honing session.'),
  traitName: z.string().describe('The name of the trait being honed in this session.'),
  userResponse: z.string().describe('The employee\'s response to the honing lab scenario and challenge.'),
  founderDNA: FounderDNAPayloadSchema.describe('The founder\'s CorePersonaDNA.'),
  employeeDNA: EmployeeDNAPayloadSchema.describe('The employee\'s current PersonaDNA.'),
  honingScenario: HoningScenarioPayloadSchema.describe('The scenario, challenge, and founder tip presented to the employee.')
});
export type EvaluateHoningResponseInput = z.infer<typeof EvaluateHoningResponseInputSchema>;

const EvaluateHoningResponseOutputSchema = z.object({
  feedback: z.string().describe('Detailed feedback on the employee\'s response, evaluated against founder principles.'),
  synergyDelta: z.number().int().min(-5).max(10).describe('Change in synergy score (-5 to +10) based on the response. Negative implies divergence, positive implies convergence.'),
  traitGain: z.number().int().min(0).max(15).describe('Improvement in the specific trait score (0 to 15) based on the response.')
});
export type EvaluateHoningResponseOutput = z.infer<typeof EvaluateHoningResponseOutputSchema>;

export async function evaluateHoningResponse(input: EvaluateHoningResponseInput): Promise<EvaluateHoningResponseOutput> {
  return evaluateHoningResponseFlow(input);
}

const evaluateHoningResponseFlow = ai.defineFlow(
  {
    name: 'evaluateHoningResponseFlow',
    inputSchema: EvaluateHoningResponseInputSchema,
    outputSchema: EvaluateHoningResponseOutputSchema
  },
  async (input) => {
    const { founderDNA, employeeDNA, honingScenario, traitName, userResponse } = input;

    // Construct the system prompt for Claude
    const systemPrompt = `You are NiyamAI, an expert AI evaluating an employee's response in a honing lab simulation.\nYour goal is to assess how well the employee's response aligns with the founder's CorePersonaDNA, specifically focusing on the trait: "${traitName}".\n\n--- Founder's CorePersonaDNA ---\nPhilosophy: ${founderDNA.philosophy}\nKey Signature Traits: ${JSON.stringify(founderDNA.signatureTraits, null, 2)}\nNegative Constraints: ${founderDNA.negativeConstraints.join(', ')}\nRisk Appetite: ${founderDNA.riskAppetite}%\nInnovation Bias: ${founderDNA.innovationBias}%\n\n--- Employee's Current PersonaDNA ---\nSelected Traits: ${JSON.stringify(employeeDNA.selectedTraits, null, 2)}\nCurrent Synergy Score: ${employeeDNA.synergyScore}%\nAlignment Summary: ${employeeDNA.alignmentSummary}\nPotential Drift Areas: ${employeeDNA.driftAreas.join(', ')}\n\n--- Honing Lab Scenario ---\nScenario: ${honingScenario.scenario}\nChallenge: ${honingScenario.challenge}\nFounder's Tip for this scenario: ${honingScenario.founderTip}\n\n--- Evaluation Task ---\nEvaluate the employee's response to the scenario and challenge, specifically against the founder's first principles and the target trait "${traitName}".\nProvide detailed, constructive feedback.\nQuantify the change in synergy score (synergyDelta) due to this response. synergyDelta must be an integer between -5 (significant divergence) and +10 (strong convergence).\nQuantify the gain in the specific trait score (traitGain) being honed. traitGain must be an integer between 0 (no gain) and 15 (significant improvement).\n\nYour output MUST be a JSON object with the following structure:\n${JSON.stringify(EvaluateHoningResponseOutputSchema.shape, null, 2)}\n`;

    // Construct the user message for Claude
    const userMessage = `Employee's response for trait "${traitName}":\n"${userResponse}"`;

    // Make the direct API call to Anthropic Claude
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
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const claudeOutput = data.content[0].text; // Claude's response text, which should be JSON

      // Attempt to parse the JSON output from Claude
      const parsedOutput: EvaluateHoningResponseOutput = JSON.parse(claudeOutput);

      // Validate the parsed output against the schema
      const validationResult = EvaluateHoningResponseOutputSchema.safeParse(parsedOutput);
      if (!validationResult.success) {
        console.error('Claude output parsing error:', validationResult.error);
        // If Claude returns malformed JSON or inconsistent data, re-throw to indicate a problem.
        throw new Error('Claude response did not match expected schema.');
      }

      return validationResult.data;

    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw new Error('Failed to evaluate honing response with Claude AI.');
    }
  }
);
