'use server';
/**
 * @fileOverview This flow processes an employee's weekly check-in, providing personalized AI
 * mentorship by analyzing the reflection against founder and employee DNA using the Claude Sonnet API.
 * This file replaces the previous placeholder and implements the `submitCheckIn` logic.
 *
 * - submitCheckIn - A function that handles the check-in and mentorship process.
 * - SubmitCheckInInput - The input type for the submitCheckIn function.
 * - SubmitCheckInOutput - The return type for the submitCheckIn function.
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
});

const EmployeeDNASchema = z.object({
  selectedTraits: z.array(
    z.object({
      name: z.string(),
      score: z.number(),
      founderBenchmark: z.number(),
    })
  ),
  synergyScore: z.number(),
  driftAreas: z.array(z.string()),
});

const CheckInHistorySchema = z.object({
    reflection: z.string(),
    aiMentorship: z.string(),
    alignmentScore: z.number(),
    createdAt: z.any(), // Can be a string or Firestore timestamp
});

const SubmitCheckInInputSchema = z.object({
  reflection: z.string().describe("The employee's weekly reflection text."),
  cadenceType: z.enum(['weekly', 'fortnightly', 'monthly']).describe('The check-in frequency.'),
  founderDna: FounderDNASchema.describe("The founder's CorePersonaDNA."),
  employeeDna: EmployeeDNASchema.describe("The employee's current PersonaDNA."),
  recentCheckIns: z.array(CheckInHistorySchema).describe('A list of the last 6 check-ins for context.'),
});

export type SubmitCheckInInput = z.infer<typeof SubmitCheckInInputSchema>;

const SubmitCheckInOutputSchema = z.object({
  mentorship: z.string().describe('Personalized mentorship feedback from the AI.'),
  alignmentScore: z.number().int().min(0).max(100).describe('A score (0-100) for this check-in, based on alignment with founder DNA.'),
  burnoutFlag: z.boolean().describe('A flag indicating if potential burnout is detected.'),
  sentiment: z.string().describe('The overall sentiment of the reflection (e.g., "Positive", "Neutral", "Negative").'),
  driftUpdate: z.string().describe('An analysis of behavioral drift observed in the reflection.'),
  nextFocusArea: z.string().describe('A suggested focus area for the upcoming week.'),
});

export type SubmitCheckInOutput = z.infer<typeof SubmitCheckInOutputSchema>;

export async function submitCheckIn(
  input: SubmitCheckInInput
): Promise<SubmitCheckInOutput> {
  return submitCheckInFlow(input);
}

const submitCheckInFlow = ai.defineFlow(
  {
    name: 'submitCheckInFlow',
    inputSchema: SubmitCheckInInputSchema,
    outputSchema: SubmitCheckInOutputSchema,
  },
  async (input) => {
    const { reflection, founderDna, employeeDna, recentCheckIns } = input;

    const systemPrompt = `You are NiyamAI, a founder-centric AI employee growth mentor. Your role is to analyze an employee's check-in reflection against the founder's CorePersonaDNA and the employee's own behavioral DNA profile to provide personalized, actionable mentorship.

--- Founder's CorePersonaDNA ---
${JSON.stringify(founderDna, null, 2)}

--- Employee's Current PersonaDNA ---
${JSON.stringify(employeeDna, null, 2)}

--- Employee's Recent Check-in History (for trajectory context) ---
${JSON.stringify(recentCheckIns, null, 2)}

--- Analysis Task ---
Based on the employee's new reflection, you must analyze it in the context of all the data provided above. Your response must be a JSON object containing the following fields:

1.  **mentorship**: A personalized mentorship message that directly references the employee's reflection, their specific drift areas, and how their actions/thoughts align or misalign with the founder's principles. Be constructive and encouraging.
2.  **alignmentScore**: An integer score from 0-100 representing how well this specific reflection aligns with the founder's DNA.
3.  **burnoutFlag**: A boolean (true/false) indicating if the reflection shows signs of potential burnout (e.g., sustained negativity, exhaustion, cynicism).
4.  **sentiment**: A single word describing the overall sentiment of the reflection ('Positive', 'Neutral', 'Negative').
5.  **driftUpdate**: A concise analysis of any new or ongoing behavioral drift observed in this reflection.
6.  **nextFocusArea**: A specific, actionable focus area for the employee for the next work period, tied to a trait from their drift areas.

Your entire output must be ONLY the JSON object, conforming strictly to this schema.`;

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
          messages: [{ role: "user", content: `My reflection is: "${reflection}"` }],
          temperature: 0.4,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const claudeOutput = data.content[0].text;
      
      const parsedOutput = JSON.parse(claudeOutput);

      const validationResult = SubmitCheckInOutputSchema.safeParse(parsedOutput);
      if (!validationResult.success) {
        console.error('Claude output parsing error:', validationResult.error);
        throw new Error('Claude response did not match expected schema.');
      }

      return validationResult.data;
    } catch (error) {
      console.error('Error calling Claude API in submitCheckInFlow:', error);
      throw new Error('Failed to get mentorship from Claude AI.');
    }
  }
);
