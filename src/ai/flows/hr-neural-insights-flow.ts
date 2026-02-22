'use server';
/**
 * @fileOverview This flow generates AI-powered organizational insights, strategic recommendations,
 * and team health analyses for HR Admins. It aggregates employee and founder DNA data
 * to provide an overview of organizational alignment, top skills, and potential risks,
 * leveraging Gemini Pro for analysis and industry benchmarking.
 *
 * - hrNeuralInsightsFlow - The Genkit flow that processes organizational data.
 * - HrNeuralInsightsInput - The input type for the hrNeuralInsightsFlow.
 * - HrNeuralInsightsOutput - The output type for the hrNeuralInsightsFlow.
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
  diagnosticComplete: z.boolean(),
  updatedAt: z.string(), // Using string for timestamp from Firestore
});

const CompetencyFrameworkTraitSchema = z.object({
  name: z.string(),
  description: z.string(),
  founderBenchmark: z.number(),
  industryWeight: z.number(),
});

const CompetencyFrameworkClusterSchema = z.object({
  clusterId: z.string(),
  clusterName: z.string(), // Assuming a cluster name field
  traits: z.array(CompetencyFrameworkTraitSchema),
});

const EmployeeDNASchema = z.object({
  userId: z.string(),
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
  alignmentSummary: z.string(),
  driftAreas: z.array(z.string()),
  traitCount: z.number(),
  version: z.number(),
  updatedAt: z.string(), // Using string for timestamp from Firestore
});

const HrNeuralInsightsInputSchema = z.object({
  orgId: z.string().describe('The ID of the organization.'),
  founderDNA: FounderDNASchema.describe(
    "The founder's CorePersonaDNA for the organization."
  ),
  competencyFramework: z
    .array(CompetencyFrameworkClusterSchema)
    .describe(
      'The full competency framework with all clusters and traits for the organization.'
    ),
  allEmployeeDNA: z
    .array(EmployeeDNASchema)
    .describe(
      'An array containing the current employeeDNA for all employees in the organization.'
    ),
});

export type HrNeuralInsightsInput = z.infer<typeof HrNeuralInsightsInputSchema>;

const TeamHealthInsightSchema = z.object({
  teamName: z.string().describe('The name of the team or department.'),
  avgSynergyScore: z.number().describe('The average synergy score for this team (0-100).'),
  avgBurnoutRiskScore: z.number().describe('The average burnout risk score for this team (0-100).'),
  stagnationSignals: z
    .array(z.string())
    .describe('Key indicators or areas where the team might be stagnating.'),
  recommendations: z.array(z.string()).describe('Specific recommendations for this team.'),
});

const HrNeuralInsightsOutputSchema = z.object({
  avgOrgSynergyScore: z.number().describe('The average synergy score across the entire organization.'),
  overallBurnoutRisk: z.union([z.literal('Low'), z.literal('Medium'), z.literal('High')]).describe('The overall burnout risk level for the organization.'),
  topSkillsAcrossOrg: z.array(z.string()).describe('A list of the most prominent skills identified across the organization.'),
  strategicRecommendations: z.array(z.string()).describe('High-level strategic recommendations for the organization.'),
  teamHealthAnalysis: z.array(TeamHealthInsightSchema).describe('Detailed analysis of team health within the organization.'),
  industryBenchmarks: z.array(z.string()).describe('Key industry benchmarks and comparisons related to the insights.'),
  citations: z.array(z.string()).describe('Citations from Google Search grounding for industry benchmarks.'),
});

export type HrNeuralInsightsOutput = z.infer<typeof HrNeuralInsightsOutputSchema>;

// Wrapper function to call the Genkit flow from Cloud Functions or client
export async function getHrNeuralInsights(
  input: HrNeuralInsightsInput
): Promise<HrNeuralInsightsOutput> {
  return hrNeuralInsightsFlow(input);
}

const hrInsightsPrompt = ai.definePrompt({
  name: 'hrInsightsPrompt',
  input: { schema: HrNeuralInsightsInputSchema },
  output: { schema: HrNeuralInsightsOutputSchema },
  prompt: `You are NiyamAI, an advanced AI assistant specializing in organizational behavioral analysis and talent development for founders.\nYour goal is to provide comprehensive HR neural insights for the organization, including overall alignment, burnout risk, top skills, strategic recommendations, and team-specific health analyses.\nLeverage the provided organizational data and proactively use Google Search to find relevant industry benchmarks and best practices.\n\n### Founder's CorePersonaDNA:\nPhilosophy: {{{founderDNA.philosophy}}}\nSignature Traits: \n{{#each founderDNA.signatureTraits}}- {{this.name}} (Cluster: {{this.cluster}}, Score: {{this.score}}, Description: {{this.description}})\n{{/each}}\nNegative Constraints: {{founderDNA.negativeConstraints}}\nRisk Appetite: {{founderDNA.riskAppetite}}\nInnovation Bias: {{founderDNA.innovationBias}}\n\n### Organizational Competency Framework:\n{{#each competencyFramework}}\nCluster: {{this.clusterName}} (ID: {{this.clusterId}})\n  {{#each this.traits}}\n  - Trait: {{this.name}} (Description: {{this.description}}, Founder Benchmark: {{this.founderBenchmark}}, Industry Weight: {{this.industryWeight}})\n  {{/each}}\n\n{{/each}}\n\n### All Employee DNA Snapshots:\n{{#each allEmployeeDNA}}\nUser ID: {{this.userId}}\nSynergy Score: {{this.synergyScore}}\nAlignment Summary: {{this.alignmentSummary}}\nDrift Areas: {{this.driftAreas}}\nSelected Traits:\n  {{#each this.selectedTraits}}\n  - {{this.name}} (Cluster: {{this.cluster}}, Score: {{this.score}}, Founder Benchmark: {{this.founderBenchmark}})\n  {{/each}}\n\n{{/each}}\n\nBased on the above data for organization \'{{{orgId}}}\', provide the following insights. Act as an expert organizational psychologist and strategy consultant. Ensure your recommendations are actionable and grounded in industry best practices, which you should research using Google Search.\n\n1.  **Average Organizational Synergy Score**: Calculate the average synergy score across all employees.\n2.  **Overall Burnout Risk**: Assess the overall burnout risk (Low, Medium, High) for the organization based on drift areas and alignment summaries.\n3.  **Top Skills Across Organization**: Identify the most prevalent and highly scored skills across all employees, considering their relevance to the founder's DNA.\n4.  **Strategic Recommendations**: Provide 3-5 high-level strategic recommendations for the organization to improve neural alignment and talent development.\n5.  **Team Health Analysis**: Group employees by similar characteristics (e.g., department, level, or manager, if identifiable from userId or inferred from patterns) and provide a team-level health analysis including average synergy, burnout risk indicators, stagnation signals, and specific recommendations for each identified team.\n6.  **Industry Benchmarks**: Include 2-3 specific industry benchmarks or statistics relevant to the organizational insights, with citations from your research.\n\nEnsure the output strictly adheres to the JSON schema provided.\n`,
  model: 'googleai/gemini-1.5-pro-latest', // Using a model suitable for grounding and complex analysis
  config: {
    output: { format: 'json' },
    // Enable Google Search grounding if the model supports it implicitly
    // or via a defined tool. For gemini-1.5-pro-latest, implicit grounding is often effective with strong prompts.
    // safetySettings can be configured if needed.
  },
});

const hrNeuralInsightsFlow = ai.defineFlow(
  {
    name: 'hrNeuralInsightsFlow',
    inputSchema: HrNeuralInsightsInputSchema,
    outputSchema: HrNeuralInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await hrInsightsPrompt(input);

    if (!output) {
      throw new Error('Failed to generate HR neural insights.');
    }

    return output;
  }
);
