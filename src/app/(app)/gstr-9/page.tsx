'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Gstr9Page() {
  return (
    <div>
      <PageHeader
        title="GSTR-9 Annual Return"
        description="Prepare and review your consolidated annual GST return."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Under Development</CardTitle>
            <CardDescription>
              The GSTR-9 annual return module is currently under construction.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              This section will allow you to compile, review, and export the data required for your GSTR-9 filing based on all the transactions recorded throughout the financial year.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
