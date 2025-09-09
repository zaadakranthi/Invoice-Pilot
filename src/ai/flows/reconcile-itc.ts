
'use server';
/**
 * @fileOverview An AI flow for reconciling Input Tax Credit (ITC) from purchase records against GSTR-2B data.
 *
 * - reconcileItc - A function that handles the ITC reconciliation process.
 * - ReconciliationInput - The input type for the reconcileItc function.
 * - ReconciliationOutput - The return type for the reconcileItc function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReconciliationInputSchema = z.object({
  purchaseDataJson: z
    .string()
    .describe('A JSON string representing an array of purchase bills recorded in the application.'),
  gstr2bCsvData: z
    .string()
    .describe('A CSV string representing the GSTR-2B data downloaded from the GST portal.'),
});
export type ReconciliationInput = z.infer<typeof ReconciliationInputSchema>;

const InvoiceRecordSchema = z.object({
    invoiceNumber: z.string().describe('Invoice number.'),
    vendorGstin: z.string().describe('Vendor GSTIN.'),
    invoiceDate: z.string().describe('Invoice date.'),
    taxableValue: z.number().describe('Total value of goods/services before tax.'),
    cgst: z.number().describe('Central GST amount.'),
    sgst: z.number().describe('State GST amount.'),
    igst: z.number().describe('Integrated GST amount (0 if not applicable).'),
    totalValue: z.number().describe('Total invoice value including tax.'),
});

const ReconciliationOutputSchema = z.object({
  summary: z.object({
      matchedTaxableValue: z.number().describe('Total taxable value of perfectly matched invoices.'),
      matchedCgst: z.number().describe('Total CGST from perfectly matched invoices.'),
      matchedSgst: z.number().describe('Total SGST from perfectly matched invoices.'),
      totalItcInGstr2b: z.number().describe('Total ITC (CGST+SGST+IGST) available as per GSTR-2B.'),
      totalItcInBooks: z.number().describe('Total ITC (CGST+SGST+IGST) as per purchase records.'),
  }),
  perfectMatches: z.array(InvoiceRecordSchema).describe('Invoices that match perfectly between books and GSTR-2B.'),
  mismatched: z.array(InvoiceRecordSchema.extend({ reason: z.string().describe('Reason for the mismatch.') })).describe('Invoices found in both but with different values (e.g., tax amount).'),
  missingInBooks: z.array(InvoiceRecordSchema).describe('Invoices present in GSTR-2B but not found in the application purchase records.'),
  missingInGstr2b: z.array(InvoiceRecordSchema).describe('Invoices present in application purchase records but not found in GSTR-2B.'),
});
export type ReconciliationOutput = z.infer<typeof ReconciliationOutputSchema>;

export async function reconcileItc(
  input: ReconciliationInput
): Promise<ReconciliationOutput> {
  return reconcileItcFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reconcileItcPrompt',
  input: {schema: ReconciliationInputSchema},
  output: {schema: ReconciliationOutputSchema},
  prompt: `You are an expert GST compliance AI. Your task is to reconcile a user's purchase records with their GSTR-2B data.

Follow these steps for reconciliation:
1.  **Parse Inputs**: You will receive purchase records as a JSON string and GSTR-2B data as a CSV string.
2.  **Primary Matching**: Match invoices between the two datasets using the vendor's GSTIN and the Invoice Number as the primary composite key.
3.  **Categorize**:
    *   **Perfect Matches**: Invoices where GSTIN, Invoice Number, and tax amounts (CGST, SGST) match exactly.
    *   **Mismatched**: Invoices where GSTIN and Invoice Number match, but there is a discrepancy in the taxable value or tax amounts. Specify the reason for the mismatch.
    *   **Missing in Books**: Invoices that exist in the GSTR-2B CSV but are not in the user's purchase records JSON.
    *   **Missing in GSTR-2B**: Invoices that exist in the user's purchase records JSON but are not in the GSTR-2B CSV.
4.  **Summarize**: Calculate the summary fields. 'matchedTaxableValue', 'matchedCgst', and 'matchedSgst' should only be calculated from the 'Perfect Matches' category. Calculate total ITC from both sources.
5.  **Output**: Provide the result in the specified JSON format.

**User's Purchase Records (JSON):**
{{{purchaseDataJson}}}

**GSTR-2B Data (CSV):**
{{{gstr2bCsvData}}}
`,
});

const reconcileItcFlow = ai.defineFlow(
  {
    name: 'reconcileItcFlow',
    inputSchema: ReconciliationInputSchema,
    outputSchema: ReconciliationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
