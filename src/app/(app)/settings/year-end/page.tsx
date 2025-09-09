
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { useData } from '@/context/data-context';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function YearEndPage() {
  const { authUser, performYearEndClose } = useData();
  const [isClosing, setIsClosing] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const { toast } = useToast();

  const currentFinancialYear = authUser?.activeFinancialYear || 'N/A';
  const nextFinancialYear = currentFinancialYear !== 'N/A'
    ? `${parseInt(currentFinancialYear.split('-')[0]) + 1}-${String(parseInt(currentFinancialYear.split('-')[1]) + 1).padStart(2, '0')}`
    : 'N/A';

  const handleCloseBooks = async () => {
    setIsClosing(true);
    try {
      await performYearEndClose();
      toast({
        title: 'Year-End Process Successful!',
        description: `Books have been closed for ${currentFinancialYear}. You are now in financial year ${nextFinancialYear}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Year-End Process Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsClosing(false);
      setConfirmationChecked(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Year End Process"
        description="Close your books for the current financial year and start fresh for the next."
        backHref="/dashboard"
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Close Books for Financial Year {currentFinancialYear}</CardTitle>
            <CardDescription>
              This is an irreversible process that finalizes your accounts for the current year
              and carries forward the balances to start the next financial year ({nextFinancialYear}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-destructive">
              <h4 className="font-bold">Warning: Important Considerations</h4>
              <ul className="list-disc pl-5 mt-2 text-sm">
                <li>All transactions for the financial year {currentFinancialYear} will be locked and can no longer be edited.</li>
                <li>Closing balances of all assets and liabilities will become the opening balances for {nextFinancialYear}.</li>
                <li>Net profit or loss will be transferred to your capital account.</li>
                <li>Ensure all your transactions for the year are entered and finalized before proceeding.</li>
              </ul>
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="confirmation"
                checked={confirmationChecked}
                onCheckedChange={(checked) => setConfirmationChecked(checked as boolean)}
              />
              <Label htmlFor="confirmation" className="text-sm font-medium leading-none">
                I understand the consequences and wish to close the books for {currentFinancialYear}.
              </Label>
            </div>
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!confirmationChecked || isClosing}>
                  {isClosing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Close Books & Start New Year
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will finalize all your records for the financial year {currentFinancialYear}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCloseBooks}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
