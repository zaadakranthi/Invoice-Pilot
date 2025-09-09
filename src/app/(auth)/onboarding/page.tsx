
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { User, BrandingSettings } from '@/lib/types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getUser, updateUser } from '@/lib/firestore';
import { useData } from '@/context/data-context';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

const onboardingSchema = z.object({
  userType: z.enum(['direct', 'professional']),
  legalName: z.string().min(1, 'Legal Name is required.'),
  businessName: z.string().min(1, 'Business Name is required.'),
  phone: z.string().min(10, 'Please enter a valid mobile number.'),
  pan: z.string().length(10, 'PAN must be 10 characters.'),
  gstin: z.string().optional().or(z.literal('')),
  
  // Professional fields
  professionalType: z.string().optional(),
  membershipNumber: z.string().optional(),
  officeAddress: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const [fbUser, authLoading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();
  const { authUser, updateUser: updateAuthUser, setBrandingSettings } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      userType: 'direct',
      legalName: '',
      businessName: '',
      phone: '',
      pan: '',
      gstin: '',
      professionalType: '',
      membershipNumber: '',
      officeAddress: '',
    },
  });
  
  const userType = form.watch('userType');

  useEffect(() => {
    if (authLoading) return;

    if (!fbUser) {
      router.replace('/login');
      return;
    }
    
    if (authUser) {
      if (authUser.onboarded) {
        router.replace('/dashboard');
      } else {
        form.setValue('businessName', authUser.name || fbUser.displayName || '');
        setIsVerifying(false);
      }
    } else {
      setIsVerifying(true);
    }
  }, [fbUser, authLoading, authUser, router, form]);

  const onSubmit = async (values: z.infer<typeof onboardingSchema>) => {
    if (!fbUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'No authenticated user found.' });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const userDataToUpdate: Partial<User> = {
        name: values.businessName,
        legalName: values.legalName,
        phone: values.phone,
        pan: values.pan.toUpperCase(),
        gstin: values.gstin?.toUpperCase(),
        onboarded: true,
        role: values.userType as 'direct' | 'professional',
      };
      
      if (values.userType === 'professional') {
        userDataToUpdate.professionalType = values.professionalType as any;
        userDataToUpdate.membershipNumber = values.membershipNumber;
        userDataToUpdate.officeAddress = values.officeAddress;
      }

      await updateAuthUser(fbUser.uid, userDataToUpdate);
      
      const newBrandingSettings: BrandingSettings = {
        legalName: values.legalName,
        businessName: values.businessName,
        address: values.userType === 'professional' ? (values.officeAddress || '') : '',
        gstin: values.gstin?.toUpperCase() || '',
        pan: values.pan.toUpperCase(),
        termsAndConditions: '1. Payment due within 30 days.\n2. Interest @ 1.5% per month on overdue amounts.',
        invoicePrefix: 'INV-',
        nextInvoiceNumber: 1,
        logoDataUri: null,
        natureOfBusiness: '',
        entityType: '',
        signatureName: 'For ' + values.businessName,
        signatureDataUrl: null,
        tan: '',
      };

      if (setBrandingSettings) {
        await setBrandingSettings(newBrandingSettings);
      }
      
      toast({ title: 'Onboarding Complete!', description: 'Welcome to InvoicePilot!' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
      setIsSubmitting(false);
    }
  };

  if (isVerifying || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to InvoicePilot!</CardTitle>
          <CardDescription>
            Let's get your account set up. Please provide a few details to get started.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="userType" render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>How will you be using this application?</FormLabel>
                         <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col md:flex-row gap-4">
                                <FormItem className="flex-1">
                                    <FormControl>
                                         <RadioGroupItem value="direct" id="direct" className="peer sr-only"/>
                                    </FormControl>
                                    <FormLabel htmlFor="direct" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        For my own business
                                    </FormLabel>
                                </FormItem>
                                 <FormItem className="flex-1">
                                     <FormControl>
                                        <RadioGroupItem value="professional" id="professional" className="peer sr-only"/>
                                    </FormControl>
                                     <FormLabel htmlFor="professional" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        As a Professional (CA, Advocate, etc.)
                                    </FormLabel>
                                 </FormItem>
                            </RadioGroup>
                         </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                
                 <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="legalName" render={({ field }) => (<FormItem><FormLabel>Legal Name</FormLabel><FormControl><Input placeholder="Your Company Pvt. Ltd." {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="businessName" render={({ field }) => (<FormItem><FormLabel>Business/Trade Name</FormLabel><FormControl><Input placeholder="Your Brand Name" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input placeholder="Your 10-digit mobile number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="pan" render={({ field }) => (<FormItem><FormLabel>PAN</FormLabel><FormControl><Input {...field} className="uppercase" /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="gstin" render={({ field }) => (<FormItem><FormLabel>GSTIN (Optional)</FormLabel><FormControl><Input {...field} className="uppercase" /></FormControl><FormMessage /></FormItem>)} />
              </div>
              
                {userType === 'professional' && (
                    <>
                        <Separator />
                        <h3 className="text-lg font-semibold">Professional Details</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="professionalType" render={({ field }) => (
                               <FormItem>
                                <FormLabel>Designation</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select your designation" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="CA">Chartered Accountant (CA)</SelectItem>
                                        <SelectItem value="CS">Company Secretary (CS)</SelectItem>
                                        <SelectItem value="CMA">Cost & Management Accountant (CMA)</SelectItem>
                                        <SelectItem value="Advocate">Advocate</SelectItem>
                                        <SelectItem value="Accountant">Accountant</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                               <FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="membershipNumber" render={({ field }) => (<FormItem><FormLabel>Membership No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="officeAddress" render={({ field }) => (<FormItem><FormLabel>Office Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </>
                )}
              
              <Alert variant="default" className="border-primary/50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    You can update full details anytime from the Company Settings page.
                  </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Setup
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
