'use client';

import { redirect } from 'next/navigation'

export default function GstrAnnualWizardRootPage() {
  // The root of the wizard should redirect to the first step.
  redirect('/gstr-annual/wizard/1')
}
