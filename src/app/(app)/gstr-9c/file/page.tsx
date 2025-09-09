
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, FileJson } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Gstr9cFilePage() {
  const [isFiling, setIsFiling] = useState(false);
  const [isFiled, setIsFiled] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const handleGenerateJson = () => {
    toast({
        title: "JSON Generated",
        description: "GSTR-9C JSON file has been downloaded successfully."
    });
  }

  const handleFileReturn = () => {
    setIsFiling(true);
    setTimeout(() => {
        setIsFiling(false);
        setIsFiled(true);
        toast({
            title: 'Return Filed Successfully!',
            description: 'Your GSTR-9C has been filed. ARN: AA1234567890123',
        });
    }, 2000);
  };
  
  const handleBackToDashboard = () => {
    router.push('/gstr-9c');
  }

  return (
    <div>
      <PageHeader
        title="Step 4: File GSTR-9C"
        description="Final step to file your reconciliation statement."
        backHref="/gstr-9c"
      >
          <Button variant="outline" onClick={handleGenerateJson}>
              <FileJson className="mr-2 h-4 w-4" />
              Generate JSON for Portal
          </Button>
      </PageHeader>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto">
            {!isFiled ? (
                <>
                    <CardHeader>
                        <CardTitle>Final Submission</CardTitle>
                        <CardDescription>Please verify the declaration below and proceed with filing.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 border rounded-md bg-muted/50">
                            <h3 className="font-semibold mb-2">Declaration</h3>
                            <p className="text-sm text-muted-foreground">
                                I solemnly affirm that the information given hereinabove is true and correct to the best of my knowledge and belief and nothing has been concealed therefrom.
                            </p>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="declaration" />
                            <Label htmlFor="declaration" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                I agree to the above declaration.
                            </Label>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleFileReturn} disabled={isFiling}>
                           {isFiling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           {isFiling ? 'Submitting...' : 'Proceed to File'}
                        </Button>
                    </CardFooter>
                </>
            ) : (
                <CardContent className="pt-6 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold">Filing Successful</h2>
                    <p className="text-muted-foreground mt-2">Your GSTR-9C has been successfully filed.</p>
                    <Button onClick={handleBackToDashboard} className="mt-6">
                       Back to GSTR-9C Dashboard
                    </Button>
                </CardContent>
            )}
        </Card>
      </main>
    </div>
  );
}
