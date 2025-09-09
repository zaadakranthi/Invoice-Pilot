
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Invoice } from '@/lib/types';
import { FileJson } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '@/context/data-context';

const eWayBillSchema = z.object({
  supplyType: z.enum(['O', 'I']),
  subSupplyType: z.string().min(1),
  docType: z.enum(['INV', 'BIL', 'CHL']),
  docNo: z.string(),
  docDate: z.string(),
  fromGstin: z.string(),
  fromTrdName: z.string(),
  fromAddr1: z.string(),
  fromPlace: z.string(),
  fromPincode: z.coerce.number(),
  fromStateCode: z.coerce.number(),
  toGstin: z.string(),
  toTrdName: z.string(),
  toAddr1: z.string(),
  toPlace: z.string(),
  toPincode: z.coerce.number(),
  toStateCode: z.coerce.number(),
  totalValue: z.number(),
  cgstValue: z.number(),
  sgstValue: z.number(),
  igstValue: z.number(),
  cessValue: z.number(),
  transporterId: z.string().optional(),
  transporterName: z.string().optional(),
  transDocNo: z.string(),
  transMode: z.string(),
  transDistance: z.coerce.number(),
  vehicleNo: z.string(),
  vehicleType: z.string(),
});

type EWayBillFormData = z.infer<typeof eWayBillSchema>;

interface EWayBillFormProps {
  invoice: Invoice;
  onClose: () => void;
}

export function EWayBillForm({ invoice, onClose }: EWayBillFormProps) {
  const { customers, brandingSettings } = useData();
  const { toast } = useToast();

  const customer = customers.find(c => c.name === invoice.client);
  
  const { register, handleSubmit, formState: { errors } } = useForm<EWayBillFormData>({
    resolver: zodResolver(eWayBillSchema),
    defaultValues: {
      supplyType: 'O',
      subSupplyType: '1',
      docType: 'INV',
      docNo: invoice.id,
      docDate: format(new Date(invoice.date), 'dd/MM/yyyy'),
      fromGstin: brandingSettings?.gstin || '',
      fromTrdName: brandingSettings?.businessName || '',
      fromAddr1: brandingSettings?.address?.split('\n')[0] || '',
      fromPlace: 'Mumbai', // Placeholder
      fromPincode: 400001, // Placeholder
      fromStateCode: 27, // Placeholder for Maharashtra
      toGstin: customer?.gstin || '',
      toTrdName: customer?.name || '',
      toAddr1: customer?.billingAddress?.split('\n')[0] || '',
      toPlace: 'Delhi', // Placeholder
      toPincode: 110001, // Placeholder
      toStateCode: 7, // Placeholder for Delhi
      totalValue: invoice.taxableValue,
      cgstValue: invoice.cgst,
      sgstValue: invoice.sgst,
      igstValue: invoice.igst,
      cessValue: invoice.cess,
      transMode: '1', // Road
      vehicleType: 'R', // Regular
    },
  });

  const onSubmit: SubmitHandler<EWayBillFormData> = (data) => {
    const ewayBillJson = {
      version: '1.0.0124',
      billLists: [
        {
          ...data,
          itemList: [
            {
              // This is simplified. A real implementation would iterate invoice line items.
              itemCode: 1,
              productName: 'Consolidated Goods',
              productDesc: 'Consolidated Goods as per Invoice',
              hsnCode: 998877, // Placeholder
              quantity: 1,
              taxableAmount: data.totalValue,
              cgstRate: (data.cgstValue / data.totalValue) * 100,
              sgstRate: (data.sgstValue / data.totalValue) * 100,
              igstRate: (data.igstValue / data.totalValue) * 100,
              cessRate: (data.cessValue / data.totalValue) * 100,
            }
          ]
        }
      ]
    };

    const jsonString = JSON.stringify(ewayBillJson, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ewaybill_${invoice.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: 'JSON Generated', description: 'E-Way Bill JSON file has been downloaded.' });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
                <Label>Transporter ID</Label>
                <Input {...register('transporterId')} placeholder="GSTIN of Transporter" />
            </div>
             <div>
                <Label>Transporter Name</Label>
                <Input {...register('transporterName')} placeholder="Name of Transporter" />
            </div>
            <div>
                <Label>Transport Doc No.</Label>
                <Input {...register('transDocNo')} />
            </div>
            <div>
                <Label>Approx. Distance (KM)</Label>
                <Input type="number" {...register('transDistance')} />
                 {errors.transDistance && <p className="text-red-500 text-xs">{errors.transDistance.message}</p>}
            </div>
       </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div>
                <Label>Transport Mode</Label>
                 <Select onValueChange={(value) => register('transMode').onChange({ target: { value }})} defaultValue="1">
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Road</SelectItem>
                        <SelectItem value="2">Rail</SelectItem>
                        <SelectItem value="3">Air</SelectItem>
                        <SelectItem value="4">Ship</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label>Vehicle No.</Label>
                <Input {...register('vehicleNo')} placeholder="e.g., MH01AB1234" />
                {errors.vehicleNo && <p className="text-red-500 text-xs">{errors.vehicleNo.message}</p>}
            </div>
             <div>
                <Label>Vehicle Type</Label>
                 <Select onValueChange={(value) => register('vehicleType').onChange({ target: { value }})} defaultValue="R">
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="R">Regular</SelectItem>
                        <SelectItem value="O">Over Dimensional Cargo</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="pt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">
                <FileJson className="mr-2 h-4 w-4" /> Generate JSON
            </Button>
        </div>
    </form>
  );
}
