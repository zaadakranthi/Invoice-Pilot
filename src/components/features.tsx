
'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Receipt,
    ShoppingCart,
    Users,
    Building,
    Package,
    HeartHandshake,
    FileText,
    Copy,
    FilePlus,
    FileMinus,
    FileCheck,
    Files,
    BookText,
    Scale,
    CandlestickChart,
    Landmark,
    Sheet,
    Wallet,
    TrendingDown,
    BookOpenCheck,
    CalendarCheck,
    Settings,
    BarChart2,
    FilePieChart,
    UserMinus,
    PiggyBank,
    FileJson,
    Book,
    History,
    Telescope,
    Wind,
} from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CmaIcon } from './cma-icon';

const icons: { [key: string]: LucideIcon | React.FC<LucideProps> } = {
    Receipt, ShoppingCart, Users, Building, Package, HeartHandshake,
    FileText, Copy, FilePlus, FileMinus, FileCheck, Files, BookText,
    Scale, CandlestickChart, Landmark, Sheet, Wallet, TrendingDown,
    BookOpenCheck, CalendarCheck, Settings, BarChart2, FilePieChart, UserMinus, 
    PiggyBank, FileJson, CmaIcon, Book, History, FileArchive: Files, Telescope, Wind,
};

interface Feature {
  title: string;
  description: string;
  href: string;
  icon: string;
}

interface FeaturesProps {
    title: string;
    features: Feature[];
    className?: string;
}

export function Features({ title, features, className }: FeaturesProps) {
    return (
    <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <div className={cn("grid gap-4", className)}>
            {features.map((feature) => {
                const Icon = icons[feature.icon] || Telescope;
                return (
                    <Link href={feature.href} key={feature.title} className="group" style={{ perspective: '1000px' }}>
                        <Card className="h-full transition-all duration-300 group-hover:border-primary group-hover:shadow-2xl group-hover:[transform:rotateY(-10deg)_rotateX(4deg)]">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{feature.title}</CardTitle>
                                {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                )
            })}
        </div>
    </div>
    )
}
