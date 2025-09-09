
'use server';

import { suggestLogoImprovements } from '@/ai/flows/suggest-logo-improvements';
import { suggestTermsAndConditions } from '@/ai/flows/suggest-terms-and-conditions';
import { reconcileItc as reconcileItcFlow, type ReconciliationInput, type ReconciliationOutput } from '@/ai/flows/reconcile-itc';
import { compareGstrReports as compareGstrReportsFlow, type GstrComparisonInput, type GstrComparisonOutput } from '@/ai/flows/compare-gstr-reports';
import { suggestCmaObservations, type CmaAnalysisInput, type CmaAnalysisOutput } from '@/ai/flows/suggest-cma-observations';
import { suggestHsnCode as suggestHsnCodeFlow, type SuggestHsnCodeInput } from '@/ai/flows/suggest-hsn-code';

export async function getLogoSuggestions({ logoDataUri }: { logoDataUri: string }) {
  try {
    const result = await suggestLogoImprovements({ logoDataUri });
    return result.improvements;
  } catch (error) {
    console.error('Error in getLogoSuggestions:', error);
    throw new Error('Failed to get suggestions from AI model.');
  }
}

export async function getHsnCodeSuggestion(input: SuggestHsnCodeInput) {
    try {
        const result = await suggestHsnCodeFlow(input);
        return result.hsnCode;
    } catch (error) {
        console.error('Error getting HSN Code suggestion', error);
        throw new Error('Failed to get HSN Code suggestion from the AI Model.');
    }
}


export async function getTermsAndConditionsSuggestion({ companyName }: { companyName: string }) {
  try {
    const result = await suggestTermsAndConditions({ companyName });
    return result.terms;
  } catch (error) {
    console.error('Error in getTermsAndConditionsSuggestion:', error);
    throw new Error('Failed to get terms and conditions suggestion from AI model.');
  }
}

export async function reconcileItc(input: ReconciliationInput): Promise<ReconciliationOutput> {
    try {
        const result = await reconcileItcFlow(input);
        return result;
    } catch (error) {
        console.error('Error in reconcileItc:', error);
        throw new Error('Failed to reconcile ITC with AI model.');
    }
}

export async function compareGstrReports(input: GstrComparisonInput): Promise<GstrComparisonOutput> {
    try {
        const result = await compareGstrReportsFlow(input);
        return result;
    } catch (error) {
        console.error('Error in compareGstrReports:', error);
        throw new Error('Failed to compare GSTR reports with AI model.');
    }
}

export async function getCmaObservations(input: CmaAnalysisInput): Promise<CmaAnalysisOutput> {
    try {
        const result = await suggestCmaObservations(input);
        return result;
    } catch (error) {
        console.error('Error in getCmaObservations:', error);
        throw new Error('Failed to get CMA observations from AI model.');
    }
}
