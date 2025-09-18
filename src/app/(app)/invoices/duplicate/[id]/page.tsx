"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "@/components/invoice-form";
import { Invoice } from "@/lib/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DuplicateInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (id) {
      const fetchInvoice = async () => {
        const docRef = doc(db, "invoices", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const invoiceData = docSnap.data() as Invoice;
          // Reset invoice id, and prepare for a new invoice
          setInvoice({ ...invoiceData, id: '' });
        } else {
          console.log("No such document!");
        }
      };
      fetchInvoice();
    }
  }, [id]);

  const handleSave = (newInvoice: Invoice) => {
    // Logic to save the new invoice will be added here
    router.push("/invoices");
  };

  return (
    <div>
      <PageHeader title="Duplicate Invoice" backHref="/invoices" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Create a Duplicate Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice ? (
              <InvoiceForm invoice={invoice} onSave={handleSave} />
            ) : (
              <p>Loading invoice data...</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}