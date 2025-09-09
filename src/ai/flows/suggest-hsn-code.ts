'use server';

/**
 * @fileOverview Suggests an HSN code for a given product description.
 *
 * - suggestHsnCode - A function that analyzes a product description and suggests an HSN code.
 * - SuggestHsnCodeInput - The input type for the suggestHsnCode function.
 * - SuggestHsnCodeOutput - The return type for the suggestHsnCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestHsnCodeInputSchema = z.object({
  productDescription: z
    .string()
    .describe('A description of the product or service.'),
});
export type SuggestHsnCodeInput = z.infer<typeof SuggestHsnCodeInputSchema>;

const SuggestHsnCodeOutputSchema = z.object({
  hsnCode: z
    .string()
    .describe('The suggested 8-digit HSN code for the product.'),
});
export type SuggestHsnCodeOutput = z.infer<typeof SuggestHsnCodeOutputSchema>;

export async function suggestHsnCode(
  input: SuggestHsnCodeInput
): Promise<SuggestHsnCodeOutput> {
  return suggestHsnCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestHsnCodePrompt',
  input: {schema: SuggestHsnCodeInputSchema},
  output: {schema: SuggestHsnCodeOutputSchema},
  prompt: `You are an expert in Indian GST and taxation. Your task is to provide an appropriate 8-digit HSN (Harmonized System of Nomenclature) code for a given product description.

Analyze the following product description and return only the most accurate 8-digit HSN code.

Product Description: {{{productDescription}}}
`,
});

const suggestHsnCodeFlow = ai.defineFlow(
  {
    name: 'suggestHsnCodeFlow',
    inputSchema: SuggestHsnCodeInputSchema,
    outputSchema: SuggestHsnCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
