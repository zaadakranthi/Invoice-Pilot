
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileArchive, FileUp, ListChecks, TestTube2, CheckCircle, ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

const steps = [
  {
    title: 'Start Filing',
    description: 'Choose to auto-fill data or upload your own files.',
    href: '/gstr-annual/upload',
    icon: FileUp,
    status: 'Pending'
  },
  {
    title: 'Fill Details',
    description: 'Complete all sections of the GSTR-9 form using our guided wizard.',
    href: '/gstr-annual/wizard/1',
    icon: ListChecks,
    status: 'Pending'
  },
  {
    title: 'Review & Compare',
    description: 'Review the full return and compare with GSTR-1, GSTR-3B and books.',
    href: '/gstr-annual/review',
    icon: TestTube2,
    status: 'Pending'
  },
  {
    title: 'File Return',
    description: 'Finalize your return and proceed with the filing and payment process.',
    href: '/gstr-annual/file',
    icon: CheckCircle,
    status: 'Pending'
  },
];

export default function GstrAnnualPage() {
    const [selectedYear, setSelectedYear] = useState('2023-24');

  return (
    <div>
      <PageHeader
        title="GSTR-9 & 9C Annual Returns"
        description="Dashboard for managing and filing your annual GST returns."
      >
        <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Financial Year" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="2023-24">FY 2023-24</SelectItem>
                    <SelectItem value="2022-23">FY 2022-23</SelectItem>
                </SelectContent>
            </Select>
            <Button asChild>
                <Link href="/gstr-annual/upload">
                    Start New Filing <ArrowRight className="ml-2 h-4 w-4"/>
                </Link>
            </Button>
        </div>
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <FileArchive className="mr-2" />
                    Filing Workflow for FY {selectedYear}
                </CardTitle>
                <CardDescription>
                    Follow these steps to complete and file your GSTR-9 and GSTR-9C returns.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map((step, index) => (
                    <Card key={step.title} className="flex flex-col">
                        <CardHeader className="flex-row gap-4 items-center">
                           <step.icon className="h-8 w-8 text-primary" />
                           <div>
                                <CardTitle className="text-lg">Step {index + 1}: {step.title}</CardTitle>
                           </div>
                        </CardHeader>
                         <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full" variant={index === 0 ? "default" : "outline"}>
                                <Link href={step.href}>
                                    {step.status === 'Complete' ? 'Revisit Step' : 'Proceed'}
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
