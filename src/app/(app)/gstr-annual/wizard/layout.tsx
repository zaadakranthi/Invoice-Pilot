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
  { id: '1', title: 'Part I: Basic Information' },
  { id: '2', title: 'Part II: Details of Outward Supplies' },
  { id: '3', title: 'Part III: Details of ITC' },
  { id: '4', title: 'Part IV: Details of Tax Paid' },
  { id: '5', title: 'Part V: Previous FY Transactions' },
  { id: '6', title: 'Part VI: Other Information' },
];

export default function Gstr9WizardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const currentStep = parseInt(params.step as string, 10);
  const currentStepInfo = wizardSteps.find(s => s.id === params.step);

  const handleNavigate = (direction: 'next' | 'back' | 'jump', targetStep?: string) => {
    if (direction === 'jump' && targetStep) {
      router.push(`/gstr-annual/wizard/${targetStep}`);
      return;
    }

    const newIndex = direction === 'next' ? currentStep : currentStep - 2;
    if (direction === 'next' && currentStep < wizardSteps.length) {
      router.push(`/gstr-annual/wizard/${currentStep + 1}`);
    } else if (direction === 'back' && currentStep > 1) {
      router.push(`/gstr-annual/wizard/${currentStep - 1}`);
    } else if (direction === 'next' && currentStep >= wizardSteps.length) {
      router.push('/gstr-annual/review');
    } else if (direction === 'back' && currentStep <= 1) {
      router.push('/gstr-annual/upload');
    }
  };

  return (
    <div>
      <PageHeader
        title={`GSTR-9 Filing Wizard: FY 2023-24`}
        description={`Step ${currentStep} of ${wizardSteps.length}: ${currentStepInfo?.title}`}
        backHref="/gstr-annual"
      >
        <div className="flex items-center gap-2">
            <Select value={String(currentStep)} onValueChange={(value) => handleNavigate('jump', value)}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Go to step..." />
                </SelectTrigger>
                <SelectContent>
                    {wizardSteps.map(step => (
                        <SelectItem key={step.id} value={step.id}>Step {step.id}: {step.title}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download Draft</Button>
            <Button variant="outline"><Save className="mr-2 h-4 w-4" /> Save as Draft</Button>
        </div>
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
        <div className="flex justify-between items-center mt-8">
            <Button variant="outline" onClick={() => handleNavigate('back')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            <div className="text-sm text-muted-foreground">Step {currentStep} of {wizardSteps.length}</div>
            <Button onClick={() => handleNavigate('next')}>
                {currentStep === wizardSteps.length ? 'Proceed to Review' : 'Save & Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </main>
    </div>
  );
}
