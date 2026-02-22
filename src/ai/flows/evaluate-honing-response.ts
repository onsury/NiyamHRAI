'use server';
/**
 * @fileOverview This flow evaluates an employee's response to a Neural Honing Lab simulation
 * against the founder's first principles, using the Claude Sonnet API.
 *
 * - evaluateHoningResponse - A function that handles the evaluation process.
 * - EvaluateHoningResponseInput - The input type for the evaluateHoningResponse function.
 * - EvaluateHoningResponseOutput - The return type for the evaluateHoningResponse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FounderDNASchema = z.object({
  philosophy: z.string(),
  signatureTraits: z.array(
    z.object({
      name: z.string(),
      cluster: z.string(),
      score: z.number(),
      description: z.string(),
    })
  ),
  negativeConstraints: z.array(z.string()),
  riskAppetite: z.number(),
  innovationBias: z.number(),
});

const EmployeeDNASchema = z.object({
  selectedTraits: z.array(
    z.object({
      name: z.string(),
      cluster: z.string(),
      score: z.number(),
      founderBenchmark: z.number(),
      description: z.string(),
    })
  ),
  synergyScore: z.number(),
});

const EvaluateHoningResponseInputSchema = z.object({
  traitName: z.string().describe('The behavioral trait being honed.'),
  scenario: z.object({
    scenario: z.string(),
    challenge: z.string(),
    founderTip: z.string(),
  }).describe('The simulation scenario presented to the employee.'),
  userResponse: z.string().describe("The employee's response to the scenario."),
  founderDna: FounderDNASchema.describe("The founder's CorePersonaDNA."),
  employeeDna: EmployeeDNASchema.describe("The employee's current PersonaDNA."),
});

export type EvaluateHoningResponseInput = z.infer<typeof EvaluateHoningResponseInputSchema>;

const EvaluateHoningResponseOutputSchema = z.object({
  feedback: z.string().describe("Constructive feedback on the employee's response, aligned with founder principles."),
  synergyDelta: z.number().min(-5).max(10).describe('The change in overall synergy score resulting from the response.'),
  traitGain: z.number().min(0).max(15).describe('The gain in score for the specific trait being honed.'),
});

export type EvaluateHoningResponseOutput = z.infer<typeof EvaluateHoningResponseOutputSchema>;

export async function evaluateHoningResponse(
  input: EvaluateHoningResponseInput
): Promise<EvaluateHoningResponseOutput> {
  return evaluateHoningResponseFlow(input);
}

const evaluateHoningResponseFlow = ai.defineFlow(
  {
    name: 'evaluateHoningResponseFlow',
    inputSchema: EvaluateHoningResponseInputSchema,
    outputSchema: EvaluateHoningResponseOutputSchema,
  },
  async (input) => {
    const { traitName, scenario, userResponse, founderDna, employeeDna } = input;

    const systemPrompt = `You are NiyamAI, an expert AI evaluating an employee's response in a honing lab simulation. Your goal is to assess how well the employee's response aligns with the founder's CorePersonaDNA, specifically focusing on the trait: "${traitName}". Your evaluation must be based on the founder's first principles, not generic management best practices.

--- Founder's CorePersonaDNA ---
${JSON.stringify(founderDna, null, 2)}

--- Employee's Current PersonaDNA ---
${JSON.stringify(employeeDna, null, 2)}

--- Honing Lab Scenario ---
${JSON.stringify(scenario, null, 2)}

--- Evaluation Task ---
Analyze the employee's response provided below. Evaluate it strictly against the founder's philosophy and decision-making patterns.
- Provide detailed, constructive feedback.
- Quantify the change in overall synergy score ('synergyDelta') on a scale from -5 (demonstrates significant drift away from founder philosophy) to +10 (demonstrates exceptional alignment).
- Quantify the gain in the specific trait score ('traitGain') on a scale from 0 to 15.

Employee's response for trait "${traitName}":
"${userResponse}"

Your output MUST be a valid JSON object with the structure: { "feedback": "...", "synergyDelta": X, "traitGain": Y }`;

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
          messages: [{ role: "user", content: `Evaluate this response: "${userResponse}"` }],
          temperature: 0.3,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const claudeOutput = data.content[0].text;
      
      const parsedOutput = JSON.parse(claudeOutput);

      const validationResult = EvaluateHoningResponseOutputSchema.safeParse(parsedOutput);
      if (!validationResult.success) {
        console.error('Claude output parsing error:', validationResult.error);
        throw new Error('Claude response did not match expected schema.');
      }

      return validationResult.data;
    } catch (error) {
      console.error('Error calling Claude API in evaluateHoningResponseFlow:', error);
      throw new Error('Failed to evaluate honing response with Claude AI.');
    }
  }
);
