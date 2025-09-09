'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';


const wizardSteps = [
  { id: '5', title: 'Table 5 & 6: Reconciliation of Gross Turnover' },
  { id: '7', title: 'Table 7 & 8: Reconciliation of Taxable Turnover' },
  { id: '9', title: 'Table 9 & 10: Reconciliation of Tax Paid' },
  { id: '11', title: 'Table 11 & 12: Reconciliation of ITC' },
  { id: '13', title: 'Table 13 & 14: Additional Liability & Recommendations' },
];

function ReconciliationField({ label, isCalculated, isDifference, value = 0 }: { label: string; isCalculated?: boolean; isDifference?: boolean, value?: number }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Input 
                type="number" 
                defaultValue={value}
                disabled={isCalculated || isDifference} 
                className={cn(
                    isCalculated && 'bg-muted/50',
                    isDifference && value !== 0 && 'font-bold bg-red-100 text-red-900 border-red-200'
                )}
            />
        </div>
    );
}

function renderStepContent(step: string) {
    switch (step) {
        case '5':
            return (
                <div className="space-y-6">
                    <h4 className="font-semibold text-base">Table 5: Reconciliation of Gross Turnover</h4>
                    <div className="space-y-4">
                        <ReconciliationField label="A. Turnover as per audited Annual Financial Statement" value={15000000} />
                        <ReconciliationField label="B. Unbilled revenue at beginning of year" />
                        <ReconciliationField label="C. Unadjusted advances at year end" />
                        <ReconciliationField label="D. Deemed supply" />
                        <ReconciliationField label="E. Credit notes issued after year-end but related to current FY" />
                        <ReconciliationField label="F. Trade discounts not in books" />
                        <ReconciliationField label="I. Turnover as per GSTR-9" value={14950000} isCalculated />
                        <ReconciliationField label="Q. Un-reconciled turnover" value={50000} isDifference />
                    </div>
                    <Separator />
                    <h4 className="font-semibold text-base">Table 6: Reasons for Un-Reconciled Difference in Gross Turnover</h4>
                    <Textarea rows={6} placeholder="Enter reasons for un-reconciled difference in gross turnover..." defaultValue={"Difference of Rs. 50,000 due to exclusion of certain trade discounts from audited financials which were accounted for in GST returns."} />
                </div>
            );
        case '7':
             return (
                <div className="space-y-6">
                    <h4 className="font-semibold text-base">Table 7: Reconciliation of Taxable Turnover</h4>
                    <div className="space-y-4">
                        <ReconciliationField label="A. Turnover as per audited financials" value={15000000} />
                        <ReconciliationField label="B. Exempted, Nil rated, Non-GST supplies" />
                        <ReconciliationField label="C. Zero-rated supplies (no tax payment)" />
                        <ReconciliationField label="D. Supplies with reverse charge" />
                        <ReconciliationField label="F. Taxable Turnover as per GSTR-9" value={15000000} isCalculated />
                    </div>
                     <Separator />
                    <h4 className="font-semibold text-base">Table 8: Reasons for Un-Reconciled Difference in Taxable Turnover</h4>
                    <Textarea rows={6} placeholder="Enter reasons for un-reconciled difference in taxable turnover..." />
                </div>
            );
        case '9':
             return (
                <div className="space-y-6">
                    <h4 className="font-semibold text-base">Table 9: Reconciliation of Rate Wise Liability and Amount Payable Thereon</h4>
                     <div className="space-y-4">
                        <h4 className="font-semibold">IGST</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <ReconciliationField label="Payable as per GSTR-9" />
                            <ReconciliationField label="Paid as per books" />
                            <ReconciliationField label="Difference (+/-)" isDifference />
                        </div>
                        <h4 className="font-semibold">CGST</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <ReconciliationField label="Payable as per GSTR-9" value={1345500} />
                            <ReconciliationField label="Paid as per books" value={1350000} />
                            <ReconciliationField label="Difference (+/-)" value={-4500} isDifference />
                        </div>
                        <h4 className="font-semibold">SGST</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <ReconciliationField label="Payable as per GSTR-9" value={1345500} />
                            <ReconciliationField label="Paid as per books" value={1350000} />
                            <ReconciliationField label="Difference (+/-)" value={-4500} isDifference />
                        </div>
                    </div>
                     <Separator />
                    <h4 className="font-semibold text-base">Table 10: Reasons for Un-Reconciled Payment of Tax</h4>
                    <Textarea rows={6} placeholder="Enter reasons for un-reconciled payment of tax..." />
                </div>
             );
        case '11':
             return (
                 <div className="space-y-6">
                    <h4 className="font-semibold text-base">Table 11: Reconciliation of Input Tax Credit (ITC)</h4>
                    <div className="space-y-4">
                        <ReconciliationField label="A. ITC availed as per audited Financial Statement" value={850000} />
                        <ReconciliationField label="C. ITC availed as per GSTR-9" value={850000} />
                        <ReconciliationField label="Q. Net ITC Difference (A - C)" isDifference />
                    </div>
                     <Separator />
                    <h4 className="font-semibold text-base">Table 12: Reasons for Un-reconciled difference in ITC</h4>
                    <Textarea rows={6} placeholder="Enter reasons for un-reconciled ITC..." />
                </div>
             );
        case '13':
            return (
                 <div className="space-y-6">
                    <h4 className="font-semibold text-base">Table 13: Additional Liability & Table 14: Auditor's Recommendation</h4>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h5 className="font-medium">Additional Amount Payable</h5>
                             <ReconciliationField label="IGST" />
                             <ReconciliationField label="CGST" />
                             <ReconciliationField label="SGST" />
                             <ReconciliationField label="Cess" />
                             <ReconciliationField label="Interest" />
                        </div>
                        <div className="space-y-4">
                             <h5 className="font-medium">Auditor's Recommendation</h5>
                            <Textarea rows={12} placeholder="Enter auditor's recommendation on additional liability..." />
                        </div>
                    </div>
                </div>
            );
        default:
            return null; // Should be handled by the layout
    }
}

export default function Gstr9cWizardStepPage() {
  const params = useParams();
  const step = params.step as string;
  const stepIndex = wizardSteps.findIndex((s) => s.id === step);
  const currentStepInfo = wizardSteps[stepIndex];

  if (!currentStepInfo) {
    return (
        <div>
            <PageHeader
                title="Error: Step Not Found"
                description={`The requested step "${step}" does not exist in the wizard.`}
                backHref="/gstr-9c"
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Invalid Step</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Please return to the GSTR-9C dashboard and start the process again.</p>
                        <Button asChild className="mt-4">
                            <a href="/gstr-9c">Back to Dashboard</a>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentStepInfo.title}</CardTitle>
      </CardHeader>
      <CardContent>{renderStepContent(step)}</CardContent>
    </Card>
  );
}
