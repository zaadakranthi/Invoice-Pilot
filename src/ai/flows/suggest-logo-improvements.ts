'use server';

/**
 * @fileOverview Suggests improvements for company logos to enhance branding.
 *
 * - suggestLogoImprovements - A function that analyzes a logo and suggests improvements.
 * - SuggestLogoImprovementsInput - The input type for the suggestLogoImprovements function.
 * - SuggestLogoImprovementsOutput - The return type for the suggestLogoImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const SuggestLogoImprovementsInputSchema = z.object({
  logoDataUri: z
    .string()
    .describe(
      "A company logo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestLogoImprovementsInput = z.infer<typeof SuggestLogoImprovementsInputSchema>;

const SuggestLogoImprovementsOutputSchema = z.object({
  improvements: z
    .string()
    .describe('Suggestions for improving the company logo for better branding.'),
});
export type SuggestLogoImprovementsOutput = z.infer<typeof SuggestLogoImprovementsOutputSchema>;

export async function suggestLogoImprovements(
  input: SuggestLogoImprovementsInput
): Promise<SuggestLogoImprovementsOutput> {
  return suggestLogoImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLogoImprovementsPrompt',
  input: {schema: SuggestLogoImprovementsInputSchema},
  output: {schema: SuggestLogoImprovementsOutputSchema},
  prompt: `You are an expert branding consultant specializing in logo design.

You will analyze the provided company logo and suggest specific improvements to make it more professional and impactful. Focus on aspects like color palette, typography, overall design, and potential issues that make the logo appear amateurish.

Logo: {{media url=logoDataUri}}
`,
});

const suggestLogoImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestLogoImprovementsFlow',
    inputSchema: SuggestLogoImprovementsInputSchema,
    outputSchema: SuggestLogoImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
