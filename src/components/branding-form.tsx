
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Terminal, Wand2, Loader2, Save, RefreshCcw, UserPlus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { getLogoSuggestions, getTermsAndConditionsSuggestion } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from './ui/textarea';
import { SignaturePad } from './signature-pad';
import { Separator } from './ui/separator';
import type { BrandingSettings, TeamMember, User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useData } from '@/context/data-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { inviteTeamMember, updateUser } from '@/lib/firestore';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const brandingSchema = z.object({
    logoDataUri: z.string().nullable(),
    legalName: z.string().min(1, 'Legal name is required.'),
    businessName: z.string().min(1, 'Business name is required.'),
    address: z.string().min(1, 'Address is required.'),
    gstin: z.string().optional(),
    pan: z.string().min(1, 'PAN is required.').length(10, 'PAN must be 10 characters.'),
    tan: z.string().optional(),
    natureOfBusiness: z.string().min(1, 'Nature of business is required.'),
    entityType: z.string().min(1, 'Entity type is required.'),
    termsAndConditions: z.string().optional(),
    signatureName: z.string().optional(),
    signatureDataUrl: z.string().nullable(),
    invoicePrefix: z.string().optional(),
    nextInvoiceNumber: z.number().optional(),
});

const professionalSchema = z.object({
    professionalType: z.enum(['CA', 'CS', 'CMA', 'Advocate', 'Accountant', 'Other']),
    membershipNumber: z.string().min(1, 'Membership number is required.'),
    officeAddress: z.string().min(1, 'Office address is required.'),
    enrollmentDate: z.date(),
});


const teamMemberSchema = z.object({
  email: z.string().email('Please enter a valid email.'),
  role: z.enum(['Admin', 'Employee', 'Viewer'], { required_error: 'Please select a role.'}),
});


export function BrandingForm() {
  const [logoSuggestions, setLogoSuggestions] = useState<string | null>(null);
  const [isLogoLoading, setIsLogoLoading] = useState(false);
  const [isGeneratingTerms, setIsGeneratingTerms] = useState(false);
  
  const { authUser, setAuthUser, brandingSettings, setBrandingSettings } = useData();
  const signaturePadRef = useRef<{ clear: () => void }>(null);
  const { toast } = useToast();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: 'user1', email: 'owner@example.com', role: 'Owner', status: 'Active' },
  ]);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof brandingSchema>>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
        logoDataUri: null, legalName: '', businessName: '', address: '', gstin: '',
        pan: '', tan: '', natureOfBusiness: '', entityType: '',
        termsAndConditions: '', signatureName: '', signatureDataUrl: null,
        invoicePrefix: 'INV-', nextInvoiceNumber: 1,
    },
  });

  const profForm = useForm<z.infer<typeof professionalSchema>>({
    resolver: zodResolver(professionalSchema),
    defaultValues: { professionalType: 'CA', membershipNumber: '', officeAddress: '', enrollmentDate: new Date() },
  });

  const inviteForm = useForm<z.infer<typeof teamMemberSchema>>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: { email: '', role: 'Employee' },
  });

  useEffect(() => {
    if (brandingSettings) form.reset({ ...brandingSettings });
    if (authUser?.role === 'professional') {
        profForm.reset({
            professionalType: authUser.professionalType,
            membershipNumber: authUser.membershipNumber,
            officeAddress: authUser.officeAddress,
            enrollmentDate: authUser.enrollmentDate ? parseISO(authUser.enrollmentDate) : new Date(),
        });
    }
  }, [brandingSettings, authUser, form, profForm]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLogoLoading(true); setLogoSuggestions(null);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        form.setValue('logoDataUri', dataUri);
        try {
          const result = await getLogoSuggestions({ logoDataUri: dataUri });
          setLogoSuggestions(result);
        } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'An error occurred', description: 'Failed to get logo suggestions.' });
        } finally {
          setIsLogoLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateTerms = async () => {
    setIsGeneratingTerms(true);
    try {
      const companyName = form.getValues('businessName') || form.getValues('legalName') || 'our company';
      const result = await getTermsAndConditionsSuggestion({ companyName });
      form.setValue('termsAndConditions', result);
      toast({ title: 'Terms and Conditions generated successfully!' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred', description: 'Failed to generate terms and conditions.' });
    } finally {
      setIsGeneratingTerms(false);
    }
  };
  
  const onSaveBusinessSettings = (values: z.infer<typeof brandingSchema>) => {
    if (setBrandingSettings) {
        setBrandingSettings(values);
        toast({ title: 'Business settings saved!' });
    }
  };
  
  const onSaveProfessionalSettings = async (values: z.infer<typeof professionalSchema>) => {
    if (!authUser?.id) return;
    const dataToUpdate: Partial<User> = {
        ...values,
        enrollmentDate: format(values.enrollmentDate, 'yyyy-MM-dd')
    };
    await updateUser(authUser.id, dataToUpdate);
    setAuthUser({ ...authUser, ...dataToUpdate });
    toast({ title: 'Professional details updated!' });
  };
  
  const onInviteSubmit = async (values: z.infer<typeof teamMemberSchema>) => {
    if (!authUser) { toast({ variant: 'destructive', title: 'Error', description: 'Could not identify the current user.' }); return; }
    try {
        await inviteTeamMember(authUser.id, values.email, values.role);
        setTeamMembers(prev => [...prev, { id: `user-${Date.now()}`, email: values.email, role: values.role, status: 'Invited' }]);
        toast({ title: 'Invitation Sent', description: `${values.email} has been invited to join your workspace.` });
        setIsInviteDialogOpen(false);
        inviteForm.reset();
    } catch(error) {
        toast({ variant: 'destructive', title: 'Invitation Failed', description: 'Could not send the invitation.' });
    }
  }

  const clearSignature = () => {
    signaturePadRef.current?.clear();
    form.setValue('signatureDataUrl', null);
  };
  
  const logoDataUri = form.watch('logoDataUri');
  const signatureDataUrl = form.watch('signatureDataUrl');

  const isWorkspaceOwner = !authUser?.ownerId;
  const isProfessional = authUser?.role === 'professional';

  return (
    <div className="space-y-8">
    {isProfessional && (
        <Card>
            <CardHeader>
                <CardTitle>Professional Profile</CardTitle>
                <CardDescription>Manage your professional designation and details.</CardDescription>
            </CardHeader>
            <Form {...profForm}>
                <form onSubmit={profForm.handleSubmit(onSaveProfessionalSettings)}>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <FormField control={profForm.control} name="professionalType" render={({ field }) => (
                                <FormItem><FormLabel>Designation</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="CA">CA</SelectItem><SelectItem value="CS">CS</SelectItem><SelectItem value="CMA">CMA</SelectItem>
                                        <SelectItem value="Advocate">Advocate</SelectItem><SelectItem value="Accountant">Accountant</SelectItem><SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select><FormMessage /></FormItem>
                            )}/>
                            <FormField control={profForm.control} name="membershipNumber" render={({ field }) => (<FormItem><FormLabel>Membership No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={profForm.control} name="enrollmentDate" render={({ field }) => (<FormItem><FormLabel>Enrollment Date</FormLabel>
                                <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal w-full", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                                <FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={profForm.control} name="officeAddress" render={({ field }) => (<FormItem><FormLabel>Office Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </CardContent>
                    <CardFooter><Button type="submit"><Save className="mr-2 h-4 w-4" /> Save Professional Details</Button></CardFooter>
                </form>
            </Form>
        </Card>
    )}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Branding &amp; Details</CardTitle>
          <CardDescription>
            Manage the branding, details, default terms, and signature for this workspace.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSaveBusinessSettings)}>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <h3 className="font-semibold text-lg">Company Info</h3>
                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="legalName" render={({ field }) => (<FormItem><FormLabel>Legal Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="businessName" render={({ field }) => (<FormItem><FormLabel>Business Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
               <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
               <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="gstin" render={({ field }) => (<FormItem><FormLabel>GSTIN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="pan" render={({ field }) => (<FormItem><FormLabel>PAN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
               </div>
               <FormField control={form.control} name="tan" render={({ field }) => (<FormItem><FormLabel>TAN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
               <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="natureOfBusiness" render={({ field }) => (<FormItem><FormLabel>Nature of Business</FormLabel><FormControl><Input placeholder="e.g., Trading, Manufacturing" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="entityType" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Type of Entity</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select entity type" /></SelectTrigger></FormControl>
                              <SelectContent>
                                  <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                                  <SelectItem value="Partnership Firm">Partnership Firm</SelectItem>
                                  <SelectItem value="Private Limited Company">Private Limited Company</SelectItem>
                                  <SelectItem value="LLP">LLP</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                          </Select>
                           <FormMessage />
                      </FormItem>
                   )} />
               </div>
               <Separator/>
               <h3 className="font-semibold text-lg">Invoice Numbering</h3>
                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="invoicePrefix" render={({ field }) => (<FormItem><FormLabel>Invoice Prefix</FormLabel><FormControl><Input placeholder="e.g., INV-" {...field} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="nextInvoiceNumber" render={({ field }) => (<FormItem><FormLabel>Next Invoice Number</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} /></FormControl><FormMessage /></FormItem>)} />
               </div>

            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Company Logo</h3>
              <div className="space-y-2">
                  <Label htmlFor="logo-upload">Logo File</Label>
                  <Input id="logo-upload" type="file" accept="image/*" onChange={handleFileChange} />
              </div>
              {logoDataUri && (
                  <div className="space-y-2">
                  <Label>Logo Preview</Label>
                  <div className="relative w-full max-w-xs h-40 border rounded-md p-4 flex items-center justify-center bg-muted/30">
                      <Image
                          src={logoDataUri}
                          alt="Company Logo Preview"
                          fill
                          style={{objectFit: 'contain'}}
                          className="p-2"
                      />
                  </div>
                  </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
              <Label>AI-Powered Feedback for Logo</Label>
              <div className="border rounded-lg p-4 min-h-[120px] bg-muted/30">
              {isLogoLoading ? (
                  <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                  </div>
              ) : logoSuggestions ? (
                  <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Branding Suggestions</AlertTitle>
                  <AlertDescription>
                      <pre className="whitespace-pre-wrap font-sans text-sm">{logoSuggestions}</pre>
                  </AlertDescription>
                  </Alert>
              ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Upload a logo to get feedback.
                  </div>
              )}
              </div>
          </div>

          <Separator />

           <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <Label htmlFor="terms">Default Terms &amp; Conditions</Label>
                      <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateTerms}
                          disabled={isGeneratingTerms}
                      >
                          {isGeneratingTerms ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                          <Wand2 className="mr-2 h-4 w-4" />
                          )}
                          Generate with AI
                      </Button>
                   </div>
                  <FormField control={form.control} name="termsAndConditions" render={({ field }) => (<FormItem><FormControl><Textarea id="terms" rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <Label>Default Signature</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={clearSignature}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                   </div>
                  <SignaturePad ref={signaturePadRef} onSignatureEnd={(data) => form.setValue('signatureDataUrl', data)} initialDataUrl={signatureDataUrl} />
                   <FormField control={form.control} name="signatureName" render={({ field }) => (<FormItem><FormControl><Input placeholder="Authorized Signatory" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>
          </div>

        </CardContent>
        <CardFooter>
           <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Save Workspace Settings
           </Button>
        </CardFooter>
        </form>
        </Form>
      </Card>

      {isWorkspaceOwner && (
        <>
          <Separator />
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle>Team Management</CardTitle>
                  <CardDescription>
                    Invite and manage team members for this workspace.
                  </CardDescription>
                </div>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite Team Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite a new team member</DialogTitle>
                            <DialogDescription>
                                Enter the email and assign a role. They will receive an invitation to join this workspace.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...inviteForm}>
                            <form id="invite-form" onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4 py-4">
                                <FormField
                                    control={inviteForm.control}
                                    name="email"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl><Input placeholder="teammate@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={inviteForm.control}
                                    name="role"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Admin">Admin (Full Access)</SelectItem>
                                            <SelectItem value="Employee">Employee (Create/Edit)</SelectItem>
                                            <SelectItem value="Viewer">Viewer (Read-only)</SelectItem>
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </form>
                        </Form>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" form="invite-form">Send Invitation</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamMembers.map(member => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.email}</TableCell>
                                <TableCell>{member.role}</TableCell>
                                <TableCell>{member.status}</TableCell>
                                <TableCell className="text-right">
                                    {member.role !== 'Owner' && (
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
