
'use client';

import { redirect } from 'next/navigation'

export default function Gstr9cWizardRootPage() {
  // The root of the wizard should redirect to the first step.
  redirect('/gstr-9c/wizard/5');
}
