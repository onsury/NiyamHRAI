'use server';
/**
 * @fileOverview A Genkit flow for generating a realistic business scenario,
 * challenge, and founder tip tailored to a specific behavioral trait for honing.
 *
 * - generateHoningScenario - A function that handles the scenario generation process.
 * - GenerateHoningScenarioInput - The input type for the generateHoningScenario function.
 * - GenerateHoningScenarioOutput - The return type for the generateHoningScenario function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHoningScenarioInputSchema = z.object({
  traitName: z.string().describe('The name of the behavioral trait for which to generate a scenario.'),
  // Optional: Add employeeLevel and founderPhilosophy for better calibration if available in the calling context
  employeeLevel: z.string().optional().describe('The employee level (e.g., TOP, SENIOR) to calibrate the scenario difficulty.'),
  founderPhilosophy: z.string().optional().describe('The founder\u0027s philosophy/manifesto to align the scenario context.'),
});
export type GenerateHoningScenarioInput = z.infer<typeof GenerateHoningScenarioInputSchema>;

const GenerateHoningScenarioOutputSchema = z.object({
  scenario: z.string().describe('A realistic business scenario relevant to the trait.'),
  challenge: z.string().describe('A specific challenge presented within the scenario.'),
  founderTip: z.string().describe('A tip or insight from a founder\u0027s perspective on handling the challenge or exhibiting the trait.'),
});
export type GenerateHoningScenarioOutput = z.infer<typeof GenerateHoningScenarioOutputSchema>;

export async function generateHoningScenario(input: GenerateHoningScenarioInput): Promise<GenerateHoningScenarioOutput> {
  return generateHoningScenarioFlow(input);
}

const generateHoningScenarioPrompt = ai.definePrompt({
  name: 'generateHoningScenarioPrompt',
  input: {schema: GenerateHoningScenarioInputSchema},
  output: {schema: GenerateHoningScenarioOutputSchema},
  prompt: `You are an expert business scenario generator for a founder-centric AI employee growth platform.
Your task is to create a realistic business scenario, a specific challenge within that scenario, and a relevant founder's tip, all designed to test and develop the behavioral trait: "{{{traitName}}}".

Consider the following context for calibration (if provided):
{{#if employeeLevel}}Employee Level: {{{employeeLevel}}}{{/if}}
{{#if founderPhilosophy}}Founder's Philosophy: """{{{founderPhilosophy}}}"""{{/if}}

Make sure the scenario is engaging and directly relates to the development of the "{{{traitName}}}" trait.
The challenge should require the employee to actively demonstrate or apply the trait.
The founder's tip should offer actionable wisdom or perspective related to the trait or the challenge.

Output your response in a JSON object with the following structure:
{
  "scenario": "[Your scenario text]",
  "challenge": "[The challenge text]",
  "founderTip": "[The founder's tip text]"
}`,
});

const generateHoningScenarioFlow = ai.defineFlow(
  {
    name: 'generateHoningScenarioFlow',
    inputSchema: GenerateHoningScenarioInputSchema,
    outputSchema: GenerateHoningScenarioOutputSchema,
  },
  async (input) => {
    const {output} = await generateHoningScenarioPrompt(input, {
      model: 'googleai/gemini-1.5-flash',
    });
    if (!output) {
      throw new Error('Failed to generate honing scenario output.');
    }
    return output;
  }
);
