'use server';

/**
 * @fileOverview Suggests standard terms and conditions for an invoice.
 *
 * - suggestTermsAndConditions - A function that generates T&Cs.
 * - SuggestTermsAndConditionsInput - The input type for the function.
 * - SuggestTermsAndConditionsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTermsAndConditionsInputSchema = z.object({
  companyName: z
    .string()
    .describe('The name of the company issuing the invoice.'),
});
export type SuggestTermsAndConditionsInput = z.infer<typeof SuggestTermsAndConditionsInputSchema>;

const SuggestTermsAndConditionsOutputSchema = z.object({
  terms: z
    .string()
    .describe('The suggested terms and conditions for the invoice.'),
});
export type SuggestTermsAndConditionsOutput = z.infer<typeof SuggestTermsAndConditionsOutputSchema>;

export async function suggestTermsAndConditions(
  input: SuggestTermsAndConditionsInput
): Promise<SuggestTermsAndConditionsOutput> {
  return suggestTermsAndConditionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTermsAndConditionsPrompt',
  input: {schema: SuggestTermsAndConditionsInputSchema},
  output: {schema: SuggestTermsAndConditionsOutputSchema},
  prompt: `You are an expert in business contracts and legal writing. Your task is to generate standard, professional terms and conditions for a business invoice in India.

The company name is {{{companyName}}}.

Generate a concise set of terms and conditions covering the following points:
1.  Payment Due Date: Net 30 days from the invoice date.
2.  Late Payment: Interest at 1.5% per month on overdue amounts.
3.  Jurisdiction: Subject to the jurisdiction of courts in the company's city.
4.  Goods & Services: All goods remain the property of {{{companyName}}} until paid in full.
5.  Taxes: All prices are exclusive of applicable taxes unless stated otherwise.

Return only the text of the terms and conditions.
`,
});

const suggestTermsAndConditionsFlow = ai.defineFlow(
  {
    name: 'suggestTermsAndConditionsFlow',
    inputSchema: SuggestTermsAndConditionsInputSchema,
    outputSchema: SuggestTermsAndConditionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
