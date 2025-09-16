
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Separator } from '@/components/ui/separator';
import { CURRENCY } from 'studio/config';

const individualPlans = [
  {
    name: 'Starter',
    price: `${CURRENCY}0`,
    period: 'Free Forever',
    description: 'For individuals and small businesses getting started with invoicing.',
    features: [
      'Invoices & Purchases',
      'Credit & Debit Notes',
      'Customer & Vendor Management',
      'Product & Service Management',
      'Company Branding Settings',
    ],
    isPopular: false,
  },
  {
    name: 'Pro',
    price: `${CURRENCY}99`,
    period: '/ month',
    description: 'For businesses that need to manage GST compliance effortlessly.',
    features: [
      'Everything in Starter, plus:',
      'GSTR-1 Filing Preparation',
      'GSTR-3B Summary Generation',
      'AI-Powered ITC Reconciliation',
      'GSTR-1 vs GSTR-3B Comparison',
      'Portal-Ready JSON Exports',
    ],
    isPopular: true,
  },
  {
    name: 'Business',
    price: `${CURRENCY}199`,
    period: '/ month',
    description: 'A complete financial suite for growing businesses.',
    features: [
      'Everything in Pro, plus:',
      'Full Accounting Ledgers',
      'Receivables & Payables Tracking',
      'Cash & Bank Management',
      'P&L, Balance Sheet, Trial Balance',
      'Depreciation Chart',
      'Reports & Analytics',
    ],
    isPopular: false,
  },
];

const professionalPlans = [
    {
        name: 'Pro',
        price: `${CURRENCY}499`,
        period: '/ month',
        description: 'For professionals managing a small number of clients.',
        features: [
            'All Business Features',
            'Manage up to 10 Clients',
            'Client Workspace Switching',
            'Centralized Client Dashboard',
        ],
        isPopular: true,
    },
    {
        name: 'Business',
        price: `${CURRENCY}999`,
        period: '/ month',
        description: 'For growing firms that require more capacity and support.',
         features: [
            'All Business Features',
            'Manage up to 25 Clients',
            'Client Workspace Switching',
            'Centralized Client Dashboard',
            'Priority Email Support',
        ],
        isPopular: false,
    },
    {
        name: 'Enterprise',
        price: 'Contact Us',
        period: 'for a quote',
        description: 'For large practices with unlimited needs and dedicated support.',
        features: [
            'All Business Features',
            'Unlimited Clients',
            'Client Workspace Switching',
            'Centralized Client Dashboard',
            'Dedicated Account Manager',
        ],
        isPopular: false,
    }
];

export default function PricingPage() {
  return (
    <div>
      <PageHeader
        title="Plans & Pricing"
        description="Choose a subscription plan for your day-to-day needs, or select a premium on-demand service."
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-16">
            <h2 className="text-2xl font-bold tracking-tight text-center mb-8">For Individual Businesses</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {individualPlans.map((plan) => (
                <Card
                key={plan.name}
                className={cn(
                    'flex flex-col h-full',
                    plan.isPopular && 'border-primary border-2 shadow-lg'
                )}
                >
                {plan.isPopular && (
                    <div className="py-1 px-4 bg-primary text-primary-foreground text-sm font-semibold text-center rounded-t-lg">
                    Most Popular
                    </div>
                )}
                <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="flex items-baseline pt-4">
                    <span className="text-4xl font-bold tracking-tight">
                        {plan.price}
                    </span>
                    <span className="ml-1 text-xl font-medium text-muted-foreground">
                        {plan.period}
                    </span>
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 shrink-0" />
                        <span>{feature}</span>
                        </li>
                    ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" variant={plan.isPopular ? 'default' : 'outline'}>
                    {plan.name === 'Starter' ? 'Get Started' : 'Choose Plan'}
                    </Button>
                </CardFooter>
                </Card>
            ))}
            </div>
        </div>

        <Separator className="my-16" />

        <div className="mb-16">
            <div className="text-center mb-8">
                 <h2 className="text-2xl font-bold tracking-tight text-center mb-2">For Professionals (CAs, Auditors)</h2>
                 <p className="text-muted-foreground">Manage multiple clients from a single account.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {professionalPlans.map((plan) => (
                <Card
                key={plan.name}
                className={cn(
                    'flex flex-col h-full',
                    plan.isPopular && 'border-primary border-2 shadow-lg'
                )}
                >
                 {plan.isPopular && (
                    <div className="py-1 px-4 bg-primary text-primary-foreground text-sm font-semibold text-center rounded-t-lg">
                    Most Popular
                    </div>
                )}
                <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="flex items-baseline pt-4">
                    <span className="text-4xl font-bold tracking-tight">
                        {plan.price}
                    </span>
                    <span className="ml-1 text-xl font-medium text-muted-foreground">
                        {plan.period}
                    </span>
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 shrink-0" />
                        <span>{feature}</span>
                        </li>
                    ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" variant={plan.isPopular ? 'default' : 'outline'}>
                        {plan.price.startsWith('Contact') ? 'Contact Sales' : 'Choose Plan'}
                    </Button>
                </CardFooter>
                </Card>
            ))}
            </div>
        </div>

      </main>
    </div>
  );
}
