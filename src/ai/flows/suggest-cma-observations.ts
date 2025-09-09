
'use server';
/**
 * @fileOverview An AI flow for analyzing CMA data and generating banker-style observations.
 *
 * - suggestCmaObservations - A function that handles the analysis process.
 * - CmaAnalysisInput - The input type for the function.
 * - CmaAnalysisOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CmaAnalysisInputSchema = z.object({
  cmaDataJson: z.string().describe('A JSON string representing key financial ratios from a CMA report for historical and projected years.'),
});
export type CmaAnalysisInput = z.infer<typeof CmaAnalysisInputSchema>;

const CmaAnalysisOutputSchema = z.object({
  operatingPerformance: z.string().describe("Commentary on sales growth and profitability trends (Net Profit Ratio)."),
  liquidityPosition: z.string().describe("Analysis of the Current Ratio. Mention if it is above the typical benchmark (e.g., 1.33 for Current Ratio)."),
  solvencyAndLeverage: z.string().describe("Evaluation of the company's capital structure using the Debt-Equity Ratio."),
  repaymentCapacity: z.string().describe("Analysis of the Debt Service Coverage Ratio (DSCR). A DSCR above 1.25 is generally considered safe."),
  conclusion: z.string().describe("A concluding remark on the overall financial health and the viability of the loan based on the projections."),
  observations: z.string().describe('A combined, single-string formatted version of all the above points for display.'),
});
export type CmaAnalysisOutput = z.infer<typeof CmaAnalysisOutputSchema>;

export async function suggestCmaObservations(
  input: CmaAnalysisInput
): Promise<CmaAnalysisOutput> {
  return suggestCmaObservationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCmaObservationsPrompt',
  input: { schema: CmaAnalysisInputSchema },
  output: { schema: CmaAnalysisOutputSchema },
  model: 'googleai/gemini-1.5-pro',
  prompt: `You are an expert credit analyst for a major Indian bank. Your task is to review the provided key financial ratios from a Credit Monitoring Arrangement (CMA) data and write a detailed observation report for a loan proposal.

Your analysis must be objective and based *only* on the data provided. Fill out the following fields in the requested JSON format, referencing specific ratio values from the provided data to support your points.

1.  **operatingPerformance**: Comment on sales growth and profitability trends (using the Net Profit Ratio).
2.  **liquidityPosition**: Analyze the Current Ratio. Mention if it is above the typical benchmark (e.g., 1.33 for Current Ratio).
3.  **solvencyAndLeverage**: Evaluate the company's capital structure using the Debt-Equity Ratio. Comment on the level of leverage.
4.  **repaymentCapacity**: This is crucial. Analyze the Debt Service Coverage Ratio (DSCR). A DSCR above 1.25 is generally considered safe.
5.  **conclusion**: Provide a concluding remark on the overall financial health and the viability of the loan based on the projections.
6.  **observations**: Combine all the above points into a single, formatted string with line breaks for easy display.

**Key Financial Ratios (JSON):**
{{{cmaDataJson}}}
`,
});

const suggestCmaObservationsFlow = ai.defineFlow(
  {
    name: 'suggestCmaObservationsFlow',
    inputSchema: CmaAnalysisInputSchema,
    outputSchema: CmaAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
