
'use server';
/**
 * @fileOverview An AI flow for comparing GSTR-1 and GSTR-3B reports to find deviations.
 *
 * - compareGstrReports - A function that handles the comparison process.
 * - GstrComparisonInput - The input type for the compareGstrReports function.
 * - GstrComparisonOutput - The return type for the compareGstrReports function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GstrComparisonInputSchema = z.object({
  gstr1DataJson: z.string().describe('A JSON string representing the summarized outward supplies data from GSTR-1.'),
  gstr3bDataJson: z.string().describe('A JSON string representing the summarized outward supplies data from GSTR-3B.'),
});
export type GstrComparisonInput = z.infer<typeof GstrComparisonInputSchema>;

const DeviationSchema = z.object({
    field: z.string().describe("The field with the discrepancy (e.g., 'Taxable Value', 'CGST')."),
    deviation: z.string().describe("A brief description of the deviation found."),
});

const GstrComparisonOutputSchema = z.object({
  deviations: z.array(DeviationSchema).describe('A list of deviations found between the two reports.'),
  suggestions: z.string().describe('AI-generated suggestions to rectify the deviations and ensure GST compliance.'),
});
export type GstrComparisonOutput = z.infer<typeof GstrComparisonOutputSchema>;

export async function compareGstrReports(
  input: GstrComparisonInput
): Promise<GstrComparisonOutput> {
  return compareGstrReportsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'compareGstrReportsPrompt',
  input: { schema: GstrComparisonInputSchema },
  output: { schema: GstrComparisonOutputSchema },
  model: 'googleai/gemini-1.5-pro',
  prompt: `You are an expert Indian GST compliance officer. Your task is to compare the summarized data from GSTR-1 and GSTR-3B for outward supplies and identify any discrepancies (deviations).

Analyze the provided JSON data for GSTR-1 and GSTR-3B.
1.  **Compare Fields**: Compare the 'taxableValue', 'cgst', 'sgst', and 'igst' fields between the two reports.
2.  **Identify Deviations**: For each field that does not match, create a deviation object explaining the difference. For example, "Taxable value in GSTR-1 is higher by INR 4,500".
3.  **Provide Suggestions**: Based on the deviations, provide clear, actionable suggestions to the user. Explain the potential consequences of these mismatches (like notices from the GST department) and advise on how to correct them (e.g., "Verify all invoices are included in GSTR-3B summary", "Ensure tax amounts are correctly calculated and summed up", "Consider filing a DRC-03 to pay any differential tax if GSTR-3B was under-reported").
4. **Output**: Your final response must be in valid JSON format.

**GSTR-1 Data (JSON):**
{{{gstr1DataJson}}}

**GSTR-3B Data (JSON):**
{{{gstr3bDataJson}}}
`,
});

const compareGstrReportsFlow = ai.defineFlow(
  {
    name: 'compareGstrReportsFlow',
    inputSchema: GstrComparisonInputSchema,
    outputSchema: GstrComparisonOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
