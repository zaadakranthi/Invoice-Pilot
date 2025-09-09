'use client';

import type { ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Download, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const wizardSteps = [
  { id: '5', title: 'Table 5 & 6: Gross Turnover' },
  { id: '7', title: 'Table 7 & 8: Taxable Turnover' },
  { id: '9', title: 'Table 9 & 10: Tax Paid' },
  { id: '11', title: 'Table 11 & 12: ITC Reconciliation' },
  { id: '13', title: 'Table 13 & 14: Additional Liability' },
];

export default function Gstr9cWizardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const step = params.step as string;
  const stepIndex = wizardSteps.findIndex((s) => s.id === step);
  const currentStepInfo = wizardSteps[stepIndex];

  const handleNavigate = (direction: 'next' | 'back' | 'jump', targetStep?: string) => {
    if (direction === 'jump' && targetStep) {
      router.push(`/gstr-9c/wizard/${targetStep}`);
      return;
    }

    const newIndex = direction === 'next' ? stepIndex + 1 : stepIndex - 1;
    if (newIndex >= 0 && newIndex < wizardSteps.length) {
      router.push(`/gstr-9c/wizard/${wizardSteps[newIndex].id}`);
    } else if (newIndex >= wizardSteps.length) {
      router.push('/gstr-9c/certify');
    } else {
      router.push('/gstr-9c/prepare');
    }
  };
  
  if (!currentStepInfo) {
    return <>{children}</>;
  }

  return (
    <div>
      <PageHeader
        title="Part A: Reconciliation Statement"
        description={`${currentStepInfo.title} (${stepIndex + 1} of ${wizardSteps.length})`}
        backHref="/gstr-9c"
      >
        <div className="flex items-center gap-2">
            <Select value={step} onValueChange={(value) => handleNavigate('jump', value)}>
                <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Go to step..." />
                </SelectTrigger>
                <SelectContent>
                    {wizardSteps.map(s => (
                        <SelectItem key={s.id} value={s.id}>Step for {s.title}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant="outline"><Save className="mr-2 h-4 w-4" /> Save as Draft</Button>
        </div>
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
        <div className="flex justify-between items-center mt-8">
            <Button variant="outline" onClick={() => handleNavigate('back')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => handleNavigate('next')}>
                {stepIndex === wizardSteps.length - 1 ? 'Proceed to Certification' : 'Save & Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </main>
    </div>
  );
}
