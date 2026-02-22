'use server';
/**
 * @fileOverview A Genkit flow that provides personalized AI mentorship based on employee check-ins.
 *
 * - personalizedAiMentorship - A function that orchestrates the AI mentorship process.
 * - PersonalizedAiMentorshipInput - The input type for the personalizedAiMentorship function.
 * - PersonalizedAiMentorshipOutput - The return type for the personalizedAiMentorship function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schemas for nested objects in input
const FounderDNATraitSchema = z.object({
  name: z.string(),
  cluster: z.string(),
  score: z.number(),
  description: z.string(),
});

const FounderDNASchema = z.object({
  philosophy: z.string(),
  signatureTraits: z.array(FounderDNATraitSchema),
  negativeConstraints: z.array(z.string()),
  riskAppetite: z.number().int().min(0).max(100),
  innovationBias: z.number().int().min(0).max(100),
  diagnosticComplete: z.boolean(),
  updatedAt: z.any(), // Firestore Timestamp
});

const EmployeeDNATraitSchema = z.object({
  name: z.string(),
  cluster: z.string(),
  score: z.number().int().min(0).max(100),
  founderBenchmark: z.number().int().min(0).max(100),
  description: z.string(),
});

const EmployeeDNASchema = z.object({
  selectedTraits: z.array(EmployeeDNATraitSchema),
  synergyScore: z.number().int().min(0).max(100),
  alignmentSummary: z.string(),
  driftAreas: z.array(z.string()),
  traitCount: z.number().int(),
  version: z.number().int(),
  updatedAt: z.any(), // Firestore Timestamp
});

const CheckInHistoryItemSchema = z.object({
  reflection: z.string(),
  aiMentorship: z.string(),
  alignmentScore: z.number().int().min(0).max(100),
  burnoutFlag: z.boolean(),
  sentiment: z.string(),
  cadenceType: z.string(),
  createdAt: z.any(), // Firestore Timestamp
});

const PersonalizedAiMentorshipInputSchema = z.object({
  reflection: z.string().describe("The employee's reflection text for the current check-in."),
  founderDNA: FounderDNASchema.describe("The founder's CorePersonaDNA."),
  employeeDNA: EmployeeDNASchema.describe("The employee's current behavioral DNA."),
  checkInHistory: z.array(CheckInHistoryItemSchema).describe("A history of the employee's previous check-ins (up to 6)."),
});
export type PersonalizedAiMentorshipInput = z.infer<typeof PersonalizedAiMentorshipInputSchema>;

const PersonalizedAiMentorshipOutputSchema = z.object({
  mentorship: z.string().describe("Personalized AI mentorship text for the employee."),
  alignmentScore: z.number().int().min(0).max(100).describe("The alignment score (0-100) indicating how well the employee's reflection aligns with the founder's vision."),
  burnoutFlag: z.boolean().describe("True if the employee shows signs of burnout, false otherwise."),
  sentiment: z.string().describe("The overall sentiment of the employee's reflection (e.g., 'Positive', 'Neutral', 'Negative')."),
  driftUpdate: z.string().describe("Summary of any observed behavioral drift or alignment shifts."),
  nextFocusArea: z.string().describe("A suggested area for the employee to focus on for improvement or development."),
});
export type PersonalizedAiMentorshipOutput = z.infer<typeof PersonalizedAiMentorshipOutputSchema>;


async function callClaudeAPI(
  input: PersonalizedAiMentorshipInput,
  systemPrompt: string,
  userMessage: string
): Promise<PersonalizedAiMentorshipOutput> {
  // This function simulates the direct API call to Claude as described in the Cloud Function notes.
  // This approach is taken to adhere to the instruction to use Claude API via 'fetch' within Cloud Functions,
  // while still encapsulating the logic within a Genkit flow.
  // Note: The Genkit 'ai' object is not configured for Anthropic models in genkit.ts.

  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
  if (!CLAUDE_API_KEY) {
    console.warn("CLAUDE_API_KEY is not set. Using mock response for Claude API call.");
    // Return a mock response for development if API key is not available
    return {
      mentorship: `Mock mentorship: Hello! Based on your reflection, we see strong alignment. Keep focusing on your "${input.employeeDNA.driftAreas?.[0] || 'core strengths'}" to further enhance your neural synergy. Your current alignment score is 88%.`,
      alignmentScore: 88,
      burnoutFlag: false,
      sentiment: "Positive",
      driftUpdate: "No significant drift observed this period.",
      nextFocusArea: input.employeeDNA.driftAreas?.[0] || "Innovation Orientation",
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", // Using the specific model name from the proposal.
      max_tokens: 2048,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      // Claude's messages API does not have a direct output_format parameter for JSON schema.
      // Instead, we instruct it in the system prompt and parse the text response.
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${response.statusText}. Body: ${errorBody}`);
  }

  const data = await response.json();
  const jsonOutputString = data.content[0]?.text;
  if (!jsonOutputString) {
    throw new Error("Did not receive expected JSON content from Claude API.");
  }

  try {
    const parsedOutput = JSON.parse(jsonOutputString);
    return PersonalizedAiMentorshipOutputSchema.parse(parsedOutput);
  } catch (parseError) {
    console.error("Failed to parse Claude API response as JSON or validate against schema:", jsonOutputString, parseError);
    throw new Error("Failed to parse or validate Claude API response.");
  }
}

export async function personalizedAiMentorship(input: PersonalizedAiMentorshipInput): Promise<PersonalizedAiMentorshipOutput> {
  return personalizedAiMentorshipFlow(input);
}

const personalizedAiMentorshipFlow = ai.defineFlow(
  {
    name: 'personalizedAiMentorshipFlow',
    inputSchema: PersonalizedAiMentorshipInputSchema,
    outputSchema: PersonalizedAiMentorshipOutputSchema,
  },
  async (input) => {
    const founderDNAText = JSON.stringify(input.founderDNA, null, 2);
    const employeeDNAText = JSON.stringify(input.employeeDNA, null, 2);
    const checkInHistoryText = JSON.stringify(input.checkInHistory, null, 2);

    const systemPrompt = `You are NiyamAI, a founder-centric AI employee growth mentor. Your role is to analyze an employee's check-in reflection against the founder's CorePersonaDNA and the employee's behavioral DNA.
    Provide personalized mentorship, identify alignment gaps, and suggest focus areas for improvement.
    
    The founder's core vision and values (CorePersonaDNA):
    ${founderDNAText}

    The employee's current behavioral DNA and alignment:
    ${employeeDNAText}

    Employee's recent check-in history (up to 6 previous entries):
    ${checkInHistoryText}

    Based on the employee's reflection, provide:
    1. A personalized mentorship message.
    2. An alignment score (0-100) with the founder's vision.
    3. A burnout flag (true/false).
    4. The overall sentiment of the reflection.
    5. A summary of any observed behavioral drift or alignment shifts.
    6. A suggested next focus area for the employee.

    Your response MUST be a JSON object conforming to the following schema. Ensure all fields are present and correctly typed:
    ${JSON.stringify(PersonalizedAiMentorshipOutputSchema.shape, null, 2)}
    `;

    const userMessage = input.reflection;

    const output = await callClaudeAPI(input, systemPrompt, userMessage);
    return output;
  }
);
