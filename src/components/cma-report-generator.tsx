
'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Upload, FileDown, FileText, Wand2, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getCmaObservations } from '@/app/actions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useData } from '@/context/data-context';


// --- MOCK DATA & CALCULATION LOGIC ---

const getInitialFinancials = () => ({
    operatingStatement: {
        'Net Sales': { year1: 1200000, year2: 1440000 },
        'Other Operating Income': { year1: 20000, year2: 24000 },
        'Total Operating Income': { year1: 1220000, year2: 1464000 },
        'Raw Material Consumed': { year1: 650000, year2: 780000 },
        'Power & Fuel': { year1: 30000, year2: 36000 },
        'Direct Wages & Salaries': { year1: 40000, year2: 48000 },
        'Other Manufacturing Expenses': { year1: 20000, year2: 24000 },
        'Cost of Sales': { year1: 890000, year2: 1068000 },
        'Opening Stock': { year1: 150000, year2: 180000 },
        'Closing Stock': { year1: 180000, year2: 216000 },
        'Gross Profit': { year1: 330000, year2: 396000 },
        'Administrative Expenses': { year1: 120000, year2: 144000 },
        'Selling & Distribution Expenses': { year1: 120000, year2: 144000 },
        'PBDIT': { year1: 90000, year2: 108000 },
    },
    balanceSheet: {
        'LIABILITIES': { isHeader: true },
        'Current Liabilities': { isHeader: true, level: 1 },
        'Sundry Creditors': { year1: 200000, year2: 240000 },
        'Bank Borrowings (CC/OD)': { year1: 100000, year2: 120000 },
        'Provisions (Expenses, Tax)': { year1: 60000, year2: 72000 },
        'Total Current Liabilities': { year1: 360000, year2: 432000 },
        'Non-Current Liabilities': { isHeader: true, level: 1 },
        'Term Loans': { year1: 500000, year2: 400000 },
        'Unsecured Loans': { year1: 50000, year2: 50000 },
        'Total Non-Current Liabilities': { year1: 550000, year2: 450000 },
        'Net Worth': { isHeader: true, level: 1 },
        'Share Capital': { year1: 600000, year2: 600000 },
        'Reserves & Surplus': { year1: 40000, year2: 148000 },
        'Tangible Net Worth': { year1: 640000, year2: 748000 },
        'TOTAL LIABILITIES & EQUITY': { year1: 1550000, year2: 1630000, isTotal: true },
        'ASSETS': { isHeader: true },
        'Current Assets': { isHeader: true, level: 1 },
        'Cash & Bank': { year1: 100000, year2: 120000 },
        'Sundry Debtors': { year1: 220000, year2: 264000 },
        'Inventory (Stock)': { year1: 180000, year2: 216000 },
        'Other Current Assets': { year1: 0, year2: 0 },
        'Total Current Assets': { year1: 500000, year2: 600000 },
        'Non-Current Assets': { isHeader: true, level: 1 },
        'Gross Fixed Assets': { year1: 1200000, year2: 1200000 },
        'Less: Accumulated Depreciation': { year1: 200000, year2: 296000 },
        'Net Fixed Assets': { year1: 1000000, year2: 904000 },
        'Capital Work-in-Progress': { year1: 50000, year2: 26000 },
        'Other Non-Current Assets': { year1: 0, year2: 0 },
        'Total Non-Current Assets': { year1: 1050000, year2: 930000 },
        'TOTAL ASSETS': { year1: 1550000, year2: 1530000, isTotal: true },
    }
});

interface Asset {
    id: number;
    name: string;
    cost: number;
    additionYear: string;
    depreciationRate: number;
}

interface ProjectionAssumptions {
  [year: string]: {
    revenueGrowth: number;
    expenseChange: number;
  };
}


const calculateAmortizationSchedule = (principal: number, annualRate: number, years: number) => {
    const monthlyRate = annualRate / 12 / 100;
    const numberOfPayments = years * 12;

    if (principal <= 0 || annualRate < 0 || years <= 0) return [];
    if (monthlyRate === 0) {
        const emi = principal / numberOfPayments;
        return Array.from({ length: numberOfPayments }, (_, i) => ({
            month: i + 1,
            openingBalance: principal - i * emi,
            emi,
            principal: emi,
            interest: 0,
            closingBalance: principal - (i + 1) * emi,
        }));
    }

    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    let schedule = [];
    let openingBalance = principal;

    for (let i = 1; i <= numberOfPayments; i++) {
        const interest = openingBalance * monthlyRate;
        const principalComponent = emi - interest;
        const closingBalance = openingBalance - principalComponent;

        schedule.push({
            month: i,
            openingBalance,
            emi,
            principal: principalComponent,
            interest,
            closingBalance: closingBalance < 0.01 ? 0 : closingBalance,
        });
        openingBalance = closingBalance;
    }
    return schedule;
}


export function CmaReportGenerator() {
    const { toast } = useToast();
    const { brandingSettings } = useData();
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [observations, setObservations] = useState('');
    
    const [projectedYears, setProjectedYears] = useState(5);
    const [loanType, setLoanType] = useState('Term Loan');
    const [loanAmount, setLoanAmount] = useState(500000);
    const [interestRate, setInterestRate] = useState(10);
    const [repaymentYears, setRepaymentYears] = useState(5);

    const [assumptions, setAssumptions] = useState<ProjectionAssumptions>({});

    React.useEffect(() => {
        setAssumptions((prev) => {
          const newAssumptions: ProjectionAssumptions = {};
          const lastPrevYear = Object.keys(prev).pop() || 'proj1';
          const lastAssumption = prev[lastPrevYear] || { revenueGrowth: 20, expenseChange: 15 };

          for (let i = 1; i <= projectedYears; i++) {
            const yearKey = `proj${i}`;
            newAssumptions[yearKey] = prev[yearKey] || lastAssumption;
          }
          return newAssumptions;
        });
      }, [projectedYears]);
    
      const handleAssumptionChange = (
        year: string,
        field: 'revenueGrowth' | 'expenseChange',
        value: number
      ) => {
        setAssumptions((prev) => ({
          ...prev,
          [year]: {
            ...prev[year],
            [field]: value,
          },
        }));
      };


    const [assets, setAssets] = useState<Asset[]>([
        { id: 1, name: 'Existing Plant & Machinery', cost: 1200000, additionYear: 'Historical', depreciationRate: 15 },
        { id: 2, name: 'New Machinery (Projected)', cost: 500000, additionYear: 'proj1', depreciationRate: 15 },
    ]);
    
    const handleAssetChange = (id: number, field: keyof Asset, value: string | number) => {
        setAssets(assets.map(asset => asset.id === id ? { ...asset, [field]: value } : asset));
    };

    const handleAddAsset = () => {
        setAssets([...assets, { id: Date.now(), name: 'New Asset', cost: 0, additionYear: `proj${projectedYears}`, depreciationRate: 15 }]);
    };

    const handleRemoveAsset = (id: number) => {
        setAssets(assets.filter(asset => asset.id !== id));
    };


    const handleGenerate = async () => {
        setIsGenerating(true);

        // This timeout simulates a network call and processing delay
        setTimeout(async () => {
            const financials = getInitialFinancials();
            const historicalYears = ['year1', 'year2'];
            const allYears = [...historicalYears, ...Array.from({ length: projectedYears }, (_, i) => `proj${i + 1}`)];
            
            let ratios: any = {};
            let fundsFlow: any = {};
            let mpbf: any = {};
            let cashFlow: any = {};

            // Add new keys for projected years
            allYears.forEach(year => {
                if (!year.startsWith('year')) {
                     Object.keys(financials.operatingStatement).forEach(key => {
                        financials.operatingStatement[key as keyof typeof financials.operatingStatement][year as 'year1'] = 0;
                     });
                     Object.keys(financials.balanceSheet).forEach(key => {
                        const row = financials.balanceSheet[key as keyof typeof financials.balanceSheet];
                        if(!row.isHeader && !row.isTotal) {
                             row[year as 'year1'] = 0;
                        }
                     });
                }
            });

            for (let i = historicalYears.length; i < allYears.length; i++) {
                const currentYear = allYears[i];
                const prevYear = allYears[i - 1];

                const currentAssumptions = assumptions[currentYear] || { revenueGrowth: 0, expenseChange: 0 };

                
                const os = financials.operatingStatement;
                const bs = financials.balanceSheet;

                // Operating Statement Projections
                os['Net Sales'][currentYear] = os['Net Sales'][prevYear] * (1 + currentAssumptions.revenueGrowth / 100);
                os['Other Operating Income'][currentYear] = os['Other Operating Income'][prevYear] * (1 + currentAssumptions.revenueGrowth / 100);
                os['Total Operating Income'][currentYear] = os['Net Sales'][currentYear] + os['Other Operating Income'][currentYear];
                os['Raw Material Consumed'][currentYear] = os['Raw Material Consumed'][prevYear] * (1 + currentAssumptions.expenseChange / 100);
                os['Power & Fuel'][currentYear] = os['Power & Fuel'][prevYear] * (1 + currentAssumptions.expenseChange / 100);
                os['Direct Wages & Salaries'][currentYear] = os['Direct Wages & Salaries'][prevYear] * (1 + currentAssumptions.expenseChange / 100);
                os['Other Manufacturing Expenses'][currentYear] = os['Other Manufacturing Expenses'][prevYear] * (1 + currentAssumptions.expenseChange / 100);
                os['Opening Stock'][currentYear] = os['Closing Stock'][prevYear];
                os['Cost of Sales'][currentYear] = os['Raw Material Consumed'][currentYear] + os['Power & Fuel'][currentYear] + os['Direct Wages & Salaries'][currentYear] + os['Other Manufacturing Expenses'][currentYear] + os['Opening Stock'][currentYear];
                os['Closing Stock'][currentYear] = os['Cost of Sales'][currentYear] / 12 * 1.5; // Assume 1.5 months of stock
                os['Cost of Sales'][currentYear] -= os['Closing Stock'][currentYear];
                os['Gross Profit'][currentYear] = os['Total Operating Income'][currentYear] - os['Cost of Sales'][currentYear];
                os['Administrative Expenses'][currentYear] = os['Administrative Expenses'][prevYear] * (1 + currentAssumptions.expenseChange / 100);
                os['Selling & Distribution Expenses'][currentYear] = os['Selling & Distribution Expenses'][prevYear] * (1 + currentAssumptions.expenseChange / 100);
                os['PBDIT'][currentYear] = os['Gross Profit'][currentYear] - (os['Administrative Expenses'][currentYear] + os['Selling & Distribution Expenses'][currentYear]);

                // Balance Sheet Projections linked to OS
                os['Depreciation'] = os['Depreciation'] || {};
                bs['PBIT'] = bs['PBIT'] || {};
                bs['Interest'] = bs['Interest'] || {};
                bs['PBT'] = bs['PBT'] || {};
                bs['Tax'] = bs['Tax'] || {};
                bs['PAT'] = bs['PAT'] || {};
                
                const assetAdditionsThisYear = assets.filter(a => a.additionYear === currentYear).reduce((sum, a) => sum + a.cost, 0);
                bs['Gross Fixed Assets'][currentYear] = bs['Gross Fixed Assets'][prevYear] + assetAdditionsThisYear;
                
                let openingWdvForDep = bs['Gross Fixed Assets'][prevYear] - bs['Less: Accumulated Depreciation'][prevYear];
                os['Depreciation'][currentYear] = assets.reduce((dep, asset) => {
                    if (asset.additionYear === 'Historical' || allYears.indexOf(asset.additionYear) < i) {
                        return dep + (openingWdvForDep * (asset.depreciationRate / 100)); // Simplified for prototype
                    }
                    if (asset.additionYear === currentYear) {
                         return dep + (asset.cost * (asset.depreciationRate / 100));
                    }
                    return dep;
                }, 0);


                bs['PBIT'][currentYear] = os['PBDIT'][currentYear] - os['Depreciation'][currentYear];
                bs['Term Loans'][currentYear] = Math.max(0, bs['Term Loans'][prevYear] - (loanType === 'Term Loan' ? loanAmount / repaymentYears : 0));
                bs['Interest'][currentYear] = (bs['Term Loans'][prevYear] + bs['Bank Borrowings (CC/OD)'][prevYear]) * (interestRate / 100);
                bs['PBT'][currentYear] = bs['PBIT'][currentYear] - bs['Interest'][currentYear];
                bs['Tax'][currentYear] = bs['PBT'][currentYear] * 0.25; // 25% tax rate
                bs['PAT'][currentYear] = bs['PBT'][currentYear] - bs['Tax'][currentYear];
                
                bs['Sundry Creditors'][currentYear] = os['Raw Material Consumed'][currentYear] / 12 * 2; // 2 months credit
                bs['Bank Borrowings (CC/OD)'][currentYear] = bs['Bank Borrowings (CC/OD)'][prevYear] * (loanType === 'Overdraft' ? 1.05 : 1);
                bs['Provisions (Expenses, Tax)'][currentYear] = bs['Provisions (Expenses, Tax)'][prevYear] * (1 + currentAssumptions.expenseChange / 100);
                bs['Total Current Liabilities'][currentYear] = bs['Sundry Creditors'][currentYear] + bs['Bank Borrowings (CC/OD)'][currentYear] + bs['Provisions (Expenses, Tax)'][currentYear];
                bs['Unsecured Loans'][currentYear] = bs['Unsecured Loans'][prevYear];
                bs['Total Non-Current Liabilities'][currentYear] = bs['Term Loans'][currentYear] + bs['Unsecured Loans'][currentYear];
                bs['Reserves & Surplus'][currentYear] = bs['Reserves & Surplus'][prevYear] + bs['PAT'][currentYear];
                bs['Share Capital'][currentYear] = bs['Share Capital'][prevYear];
                bs['Tangible Net Worth'][currentYear] = bs['Share Capital'][currentYear] + bs['Reserves & Surplus'][currentYear];
                
                bs['Sundry Debtors'][currentYear] = os['Net Sales'][currentYear] / 12 * 2; // 2 months credit
                bs['Inventory (Stock)'][currentYear] = os['Closing Stock'][currentYear];
                
                const totalLiabilitiesEquity = bs['Total Current Liabilities'][currentYear] + bs['Total Non-Current Liabilities'][currentYear] + bs['Tangible Net Worth'][currentYear];
                
                bs['Less: Accumulated Depreciation'][currentYear] = bs['Less: Accumulated Depreciation'][prevYear] + os['Depreciation'][currentYear];
                bs['Net Fixed Assets'][currentYear] = bs['Gross Fixed Assets'][currentYear] - bs['Less: Accumulated Depreciation'][currentYear];
                bs['Other Non-Current Assets'][currentYear] = bs['Other Non-Current Assets'][prevYear];
                bs['Total Non-Current Assets'][currentYear] = bs['Net Fixed Assets'][currentYear] + bs['Other Non-Current Assets'][currentYear];

                const totalAssetsWithoutCash = bs['Total Non-Current Assets'][currentYear] + bs['Sundry Debtors'][currentYear] + bs['Inventory (Stock)'][currentYear];
                bs['Cash & Bank'][currentYear] = totalLiabilitiesEquity - totalAssetsWithoutCash; // Balancing figure
                bs['Total Current Assets'][currentYear] = bs['Cash & Bank'][currentYear] + bs['Sundry Debtors'][currentYear] + bs['Inventory (Stock)'][currentYear];
                bs['TOTAL LIABILITIES & EQUITY'][currentYear] = totalLiabilitiesEquity;
                bs['TOTAL ASSETS'][currentYear] = bs['Total Current Assets'][currentYear] + bs['Total Non-Current Assets'][currentYear];


                // Funds Flow
                const fundsFlowSources = {
                    'Net Profit after Tax': bs['PAT'][currentYear],
                    'Depreciation': os['Depreciation'][currentYear],
                    'Increase in Term Loan': Math.max(0, bs['Term Loans'][currentYear] - bs['Term Loans'][prevYear]),
                    'Increase in WC Bank Borrowing': Math.max(0, bs['Bank Borrowings (CC/OD)'][currentYear] - bs['Bank Borrowings (CC/OD)'][prevYear]),
                    'Increase in Unsecured Loans': Math.max(0, bs['Unsecured Loans'][currentYear] - bs['Unsecured Loans'][prevYear]),
                    'Increase in Sundry Creditors': Math.max(0, bs['Sundry Creditors'][currentYear] - bs['Sundry Creditors'][prevYear]),
                };
                const totalSources = Object.values(fundsFlowSources).reduce((a, b) => a + b, 0);

                const fundsFlowApplications = {
                    'Increase in Fixed Assets': Math.max(0, bs['Gross Fixed Assets'][currentYear] - bs['Gross Fixed Assets'][prevYear]),
                    'Repayment of Term Loan': Math.max(0, bs['Term Loans'][prevYear] - bs['Term Loans'][currentYear]),
                    'Increase in Inventory': Math.max(0, bs['Inventory (Stock)'][currentYear] - bs['Inventory (Stock)'][prevYear]),
                    'Increase in Sundry Debtors': Math.max(0, bs['Sundry Debtors'][currentYear] - bs['Sundry Debtors'][prevYear]),
                };
                const totalApplications = Object.values(fundsFlowApplications).reduce((a, b) => a + b, 0);
                fundsFlow[currentYear] = { sources: fundsFlowSources, applications: fundsFlowApplications, totalSources, totalApplications };
                
                // Cash Flow
                const cfo = {
                    'Net Profit before Tax': bs['PBT'][currentYear],
                    'Add: Depreciation': os['Depreciation'][currentYear],
                    'Add: Interest': bs['Interest'][currentYear],
                    'WC: (Increase)/Decrease in Inventory': bs['Inventory (Stock)'][prevYear] - bs['Inventory (Stock)'][currentYear],
                    'WC: (Increase)/Decrease in Debtors': bs['Sundry Debtors'][prevYear] - bs['Sundry Debtors'][currentYear],
                    'WC: Increase/(Decrease) in Creditors': bs['Sundry Creditors'][currentYear] - bs['Sundry Creditors'][prevYear],
                };
                const cashFromOps = Object.values(cfo).reduce((a, b) => a + b, 0);
                const taxPaid = bs['Tax'][currentYear];
                const netCfo = cashFromOps - taxPaid;

                const cfi = {
                    'Purchase of Fixed Assets': -(bs['Gross Fixed Assets'][currentYear] - bs['Gross Fixed Assets'][prevYear]),
                };
                const netCfi = Object.values(cfi).reduce((a, b) => a + b, 0);
                
                const cff = {
                    'Proceeds from Term Loan': Math.max(0, bs['Term Loans'][currentYear] - bs['Term Loans'][prevYear]),
                    'Repayment of Term Loan': -Math.max(0, bs['Term Loans'][prevYear] - bs['Term Loans'][currentYear]),
                    'Interest Paid': -bs['Interest'][currentYear],
                };
                const netCff = Object.values(cff).reduce((a, b) => a + b, 0);
                
                cashFlow[currentYear] = {
                    cfo,
                    cfi,
                    cff,
                    netCfo,
                    netCfi,
                    netCff,
                    'Net Increase in Cash': netCfo + netCfi + netCff,
                    'Opening Cash & Bank': bs['Cash & Bank'][prevYear],
                    'Closing Cash & Bank': bs['Cash & Bank'][currentYear],
                };


                // MPBF
                const wcg = bs['Total Current Assets'][currentYear] - bs['Sundry Creditors'][currentYear];
                mpbf[currentYear] = {
                    'Total Current Assets (TCA)': bs['Total Current Assets'][currentYear],
                    'Less: Other Current Liabilities (OCL)': bs['Sundry Creditors'][currentYear],
                    'Working Capital Gap (WCG)': wcg,
                    'Less: NWC Margin (Method I: 25% of WCG)': wcg * 0.25,
                    'MPBF (Method I)': wcg - (wcg * 0.25),
                    'Less: NWC Margin (Method II: 25% of TCA)': bs['Total Current Assets'][currentYear] * 0.25,
                    'MPBF (Method II)': wcg - (bs['Total Current Assets'][currentYear] * 0.25),
                    'Assessed Bank Finance': 0,
                };
                mpbf[currentYear]['Assessed Bank Finance'] = Math.min(mpbf[currentYear]['MPBF (Method I)'], mpbf[currentYear]['MPBF (Method II)']);


                // Ratio Analysis
                const ebit = bs['PBIT'][currentYear];
                const totalDebt = bs['Total Non-Current Liabilities'][currentYear] + bs['Bank Borrowings (CC/OD)'][currentYear];
                const loanRepayment = loanType === 'Term Loan' ? loanAmount / repaymentYears : 0;
                ratios[currentYear] = {
                    'Current Ratio': (bs['Total Current Assets'][currentYear] / bs['Total Current Liabilities'][currentYear]).toFixed(2),
                    'Quick Ratio': ((bs['Total Current Assets'][currentYear] - bs['Inventory (Stock)'][currentYear]) / bs['Total Current Liabilities'][currentYear]).toFixed(2),
                    'Debt Equity Ratio': (totalDebt / bs['Tangible Net Worth'][currentYear]).toFixed(2),
                    'Proprietary Ratio': (bs['Tangible Net Worth'][currentYear] / bs['TOTAL ASSETS'][currentYear]).toFixed(2),
                    'Gross Profit Ratio (%)': ((os['Gross Profit'][currentYear] / os['Net Sales'][currentYear]) * 100).toFixed(2),
                    'Net Profit Ratio (%)': ((bs['PAT'][currentYear] / os['Net Sales'][currentYear]) * 100).toFixed(2),
                    'Return on Capital Employed (ROCE) (%)': ((ebit / (bs['Tangible Net Worth'][currentYear] + totalDebt)) * 100).toFixed(2),
                    'Return on Net Worth (RONW) (%)': ((bs['PAT'][currentYear] / bs['Tangible Net Worth'][currentYear]) * 100).toFixed(2),
                    'Inventory Turnover': (os['Cost of Sales'][currentYear] / bs['Inventory (Stock)'][currentYear]).toFixed(2),
                    'Debtors Turnover': (os['Net Sales'][currentYear] / bs['Sundry Debtors'][currentYear]).toFixed(2),
                    'Creditors Turnover': (os['Raw Material Consumed'][currentYear] / bs['Sundry Creditors'][currentYear]).toFixed(2),
                    'Fixed Asset Turnover': (os['Net Sales'][currentYear] / bs['Net Fixed Assets'][currentYear]).toFixed(2),
                    'DSCR (Debt Service Coverage Ratio)': ((bs['PAT'][currentYear] + os['Depreciation'][currentYear] + bs['Interest'][currentYear]) / (bs['Interest'][currentYear] + loanRepayment)).toFixed(2),
                    'Interest Coverage Ratio': (ebit / bs['Interest'][currentYear]).toFixed(2),
                };
            }

            const amortizationSchedule = calculateAmortizationSchedule(loanAmount, interestRate, repaymentYears);

            let data: any = {
                'Part I: Operating Statement': { data: financials.operatingStatement, years: allYears },
                'Part II: Analysis of Balance Sheet': { data: financials.balanceSheet, years: allYears },
                'Part III: Cash Flow Statement': { data: cashFlow, years: allYears.filter(y => !y.startsWith('year')) },
                'Part IV: Ratio Analysis': { data: ratios, years: allYears.filter(y => !y.startsWith('year')) },
                'Part V: Fund Flow Statement': { data: fundsFlow, years: allYears.filter(y => !y.startsWith('year')) },
                'Part VI: MPBF Assessment': { data: mpbf, years: allYears.filter(y => !y.startsWith('year')) },
            };
             if (loanType === 'Term Loan' && amortizationSchedule.length > 0) {
                 const schedule = amortizationSchedule.map(row => ({
                    Month: row.month,
                    'Opening Balance': Math.round(row.openingBalance),
                    'EMI': Math.round(row.emi),
                    'Principal': Math.round(row.principal),
                    'Interest': Math.round(row.interest),
                    'Closing Balance': Math.round(row.closingBalance),
                }));
                data['Part VII: Loan Repayment Schedule'] = { data: schedule, years: Object.keys(schedule[0]), isAmortization: true };
            }
            setReportData(data);
            
            try {
                // Prepare a simplified data structure for the AI
                const projectedYearsOnly = allYears.filter(y => y.startsWith('proj'));
                const keyRatiosForAI = projectedYearsOnly.map(year => ({
                  year: year.replace('proj', 'Year '),
                  'Current Ratio': ratios[year]['Current Ratio'],
                  'Debt Equity Ratio': ratios[year]['Debt Equity Ratio'],
                  'DSCR': ratios[year]['DSCR (Debt Service Coverage Ratio)'],
                  'Net Profit Ratio (%)': ratios[year]['Net Profit Ratio (%)'],
                  'Sales': Math.round(financials.operatingStatement['Net Sales'][year]).toLocaleString('en-IN')
                }));

                const result = await getCmaObservations({ cmaDataJson: JSON.stringify(keyRatiosForAI) });
                setObservations(result.observations);
            } catch (error) {
                console.error("Failed to get AI observations:", error);
                setObservations("AI analysis could not be completed. Please try again.");
            }

            setIsGenerating(false);
            toast({ title: 'Report Generated', description: 'CMA data and observations have been populated.' });
        }, 1500);
    }
    
    const handleDownloadTemplate = () => {
        const header = 'Particulars,Year1_Amount,Year2_Amount\n';
        const sampleData = [
            'Net Sales,1000000,1200000',
            'Purchases,600000,720000',
            'Sundry Creditors,200000,240000',
            'Sundry Debtors,220000,264000',
            'Closing Stock,180000,216000',
        ].join('\n');
        const csvContent = `data:text/csv;charset=utf-8,${header}${sampleData}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'cma_data_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Template Downloaded', description: 'Sample CSV template has been downloaded.' });
    };

    const formatYearLabel = (year: string) => {
        if (year.startsWith('year')) return `Audited Year ${year.replace('year', '')}`;
        if (year.startsWith('proj')) return `Projected Year ${year.replace('proj', '')}`;
        return year;
    };
    
    const handleExportExcel = () => {
        if (!reportData) return;
        const wb = XLSX.utils.book_new();
    
        const companyInfo = [
            [brandingSettings?.businessName || ''],
            [brandingSettings?.address || ''],
            [`PAN: ${brandingSettings?.pan || ''}`, `GSTIN: ${brandingSettings?.gstin || ''}`],
            [] // Spacer row
        ];

        Object.entries(reportData).forEach(([sheetName, value]: [string, any]) => {
            let ws_data: (string | number)[][] = [...companyInfo];
            const { data, years, isAmortization } = value;
            const yearLabels = years.map(formatYearLabel);

            if (sheetName.includes('Ratio Analysis')) {
                ws_data.push(['Ratio', ...yearLabels]);
                Object.keys(data[years[0]]).forEach(ratio => {
                    const row = [ratio, ...years.map((year: string) => data[year][ratio])];
                    ws_data.push(row);
                });
            } else if (sheetName.includes('Fund Flow')) {
                ws_data.push(['Sources', ...yearLabels]);
                Object.keys(data[years[0]].sources).forEach(source => {
                    ws_data.push([source, ...years.map((year: string) => Math.round(data[year].sources[source]))]);
                });
                ws_data.push(['Total Sources', ...years.map((year: string) => Math.round(data[year].totalSources))]);
                ws_data.push([]); // Spacer
                ws_data.push(['Applications', ...yearLabels]);
                Object.keys(data[years[0]].applications).forEach(app => {
                    ws_data.push([app, ...years.map((year: string) => Math.round(data[year].applications[app]))]);
                });
                ws_data.push(['Total Applications', ...years.map((year: string) => Math.round(data[year].totalApplications))]);
            } else if (sheetName.includes('Cash Flow')) {
                 ws_data.push(['Particulars', ...yearLabels]);
                 ws_data.push(['A. Cash Flow from Operating Activities']);
                Object.keys(data[years[0]].cfo).forEach(item => {
                    ws_data.push([`  ${item}`, ...years.map((year: string) => Math.round(data[year].cfo[item]))]);
                });
                ws_data.push(['Net Cash from Operating Activities', ...years.map((year: string) => Math.round(data[year].netCfo))]);
                ws_data.push([]);
                ws_data.push(['B. Cash Flow from Investing Activities']);
                Object.keys(data[years[0]].cfi).forEach(item => {
                    ws_data.push([`  ${item}`, ...years.map((year: string) => Math.round(data[year].cfi[item]))]);
                });
                ws_data.push(['Net Cash from Investing Activities', ...years.map((year: string) => Math.round(data[year].netCfi))]);
                ws_data.push([]);
                ws_data.push(['C. Cash Flow from Financing Activities']);
                Object.keys(data[years[0]].cff).forEach(item => {
                    ws_data.push([`  ${item}`, ...years.map((year: string) => Math.round(data[year].cff[item]))]);
                });
                ws_data.push(['Net Cash from Financing Activities', ...years.map((year: string) => Math.round(data[year].netCff))]);
            } else if (sheetName.includes('MPBF')) {
                 ws_data.push(['Particulars', ...yearLabels]);
                 Object.keys(data[years[0]]).forEach(key => {
                     ws_data.push([key, ...years.map((year: string) => Math.round(data[year][key]))]);
                 });
            } else {
                ws_data.push(['Particulars', ...yearLabels]);
                const particulars = isAmortization ? data : Object.keys(data);
                particulars.forEach((item: any) => {
                    const rowKey = isAmortization ? item.Month : item;
                    const rowData = isAmortization ? item : data[rowKey];
                    const row: any[] = [rowKey];
                    years.forEach((year: string) => {
                        const cellValue = rowData[year];
                        row.push(cellValue !== undefined && cellValue !== null ? Math.round(Number(cellValue)) : '');
                    });
                    ws_data.push(row);
                });
            }
            
            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
        });

        XLSX.writeFile(wb, "CMA_Report.xlsx");
        toast({ title: 'Export Successful', description: 'CMA report has been exported to Excel.' });
    };

    const handleExportPdf = () => {
        if (!reportData) return;
        const doc = new jsPDF();
        let yPos = 15;

        // Add company header
        doc.setFontSize(16);
        doc.text(brandingSettings?.businessName || 'CMA Report', 105, yPos, { align: 'center' });
        yPos += 7;
        doc.setFontSize(10);
        doc.text(brandingSettings?.address || '', 105, yPos, { align: 'center' });
        yPos += 5;
        doc.text(`PAN: ${brandingSettings?.pan || ''} | GSTIN: ${brandingSettings?.gstin || ''}`, 105, yPos, { align: 'center' });
        yPos += 10;


        Object.entries(reportData).forEach(([title, value]: [string, any], index) => {
            const { data, years, isAmortization } = value;
            if (yPos > 250) { 
                doc.addPage();
                yPos = 15;
            }
            doc.setFontSize(12);
            doc.text(title, 14, yPos);
            yPos += 7;

            const yearLabels = years.map(formatYearLabel);
            let head: string[][] = [[]];
            let body: (string | number)[][] = [];

            if (title.includes('Ratio Analysis')) {
                head = [['Ratio', ...yearLabels]];
                Object.keys(data[years[0]]).forEach(ratio => {
                    body.push([ratio, ...years.map((year: string) => data[year][ratio])]);
                });
            } else if (title.includes('Fund Flow')) {
                head = [['Particulars', ...yearLabels]];
                body.push(['Sources of Funds']);
                Object.keys(data[years[0]].sources).forEach(source => {
                    body.push([`  ${source}`, ...years.map((year: string) => Math.round(data[year].sources[source]).toLocaleString('en-IN'))]);
                });
                body.push(['Total Sources', ...years.map((year: string) => Math.round(data[year].totalSources).toLocaleString('en-IN'))]);
                body.push([]); // Spacer
                body.push(['Applications of Funds']);
                Object.keys(data[years[0]].applications).forEach(app => {
                    body.push([`  ${app}`, ...years.map((year: string) => Math.round(data[year].applications[app]).toLocaleString('en-IN'))]);
                });
                body.push(['Total Applications', ...years.map((year: string) => Math.round(data[year].totalApplications).toLocaleString('en-IN'))]);
            } else if (title.includes('Cash Flow')) {
                head = [['Particulars', ...yearLabels]];
                body.push(['A. Cash Flow from Operating Activities']);
                Object.keys(data[years[0]].cfo).forEach(item => {
                    body.push([`  ${item}`, ...years.map((year: string) => Math.round(data[year].cfo[item]).toLocaleString('en-IN'))]);
                });
                body.push(['Net Cash from Operating Activities', ...years.map((year: string) => Math.round(data[year].netCfo).toLocaleString('en-IN'))]);
            } else if(title.includes('MPBF')) {
                head = [['Particulars', ...yearLabels]];
                Object.keys(data[years[0]]).forEach(key => {
                    body.push([key, ...years.map((year: string) => Math.round(data[year][key]).toLocaleString('en-IN'))]);
                });
            } else {
                head = [['Particulars', ...yearLabels]];
                const particulars = isAmortization ? data : Object.keys(data);
                particulars.forEach((item: any) => {
                    const rowKey = isAmortization ? item.Month : item;
                    const rowData = isAmortization ? item : data[rowKey];
                    const row: (string|number)[] = [rowKey];
                    years.forEach((year: string) => {
                        row.push(rowData[year] !== undefined ? Math.round(Number(rowData[year])).toLocaleString('en-IN') : '-');
                    });
                    body.push(row);
                });
            }

            autoTable(doc, {
                head: head,
                body: body,
                startY: yPos,
                theme: 'grid',
                headStyles: { fillColor: [22, 160, 133], textColor: 255 },
                styles: { fontSize: 8 },
            });

            yPos = (doc as any).lastAutoTable.finalY + 10;
        });

        doc.save("CMA_Report.pdf");
        toast({ title: 'Export Successful', description: 'CMA report has been exported as PDF.' });
    };

    return (
        <Tabs defaultValue="inputs" className="space-y-4">
            <div className="flex items-center justify-between">
                <TabsList>
                    <TabsTrigger value="inputs">1. Inputs & Assumptions</TabsTrigger>
                    <TabsTrigger value="report" disabled={!reportData}>2. Generated CMA Report</TabsTrigger>
                    <TabsTrigger value="observations" disabled={!reportData}>3. AI Observations</TabsTrigger>
                </TabsList>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExportExcel} disabled={!reportData}> <FileDown className="mr-2 h-4 w-4"/> Export Excel</Button>
                    <Button variant="outline" onClick={handleExportPdf} disabled={!reportData}> <FileText className="mr-2 h-4 w-4"/> Export PDF</Button>
                </div>
            </div>

            <TabsContent value="inputs">
                <Card>
                    <CardHeader>
                        <CardTitle>Data Inputs & Projections</CardTitle>
                        <CardDescription>Provide historical data and future assumptions to generate the report.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                             <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Historical Data</h3>
                                <div className="space-y-2">
                                    <Label>Data Source</Label>
                                    <Select defaultValue="existing">
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="existing">Use Existing Data in InvoicePilot</SelectItem>
                                            <SelectItem value="upload">Upload Audited Financials</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="upload-file">Upload Excel/CSV File</Label>
                                        <Button variant="link" size="sm" onClick={handleDownloadTemplate}>Download Template</Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input id="upload-file" type="file"/>
                                        <Button variant="secondary"><Upload className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Historical Years</Label>
                                        <Select defaultValue="2">
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1 Year</SelectItem>
                                                <SelectItem value="2">2 Years</SelectItem>
                                                <SelectItem value="3">3 Years</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Projected Years</Label>
                                        <Select value={String(projectedYears)} onValueChange={(v) => setProjectedYears(Number(v))}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                {[1,2,3,4,5,6,7].map(y => <SelectItem key={y} value={String(y)}>{y} Year{y>1 && 's'}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Assumptions for Projections</h3>
                                <Card>
                                <CardContent className="p-2">
                                <Table>
                                    <TableHeader>
                                    <TableRow>
                                        <TableHead>Year</TableHead>
                                        <TableHead>Revenue Growth (%)</TableHead>
                                        <TableHead>Expense Change (%)</TableHead>
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {Object.entries(assumptions).map(([year, values]) => (
                                        <TableRow key={year}>
                                        <TableCell>Year {year.replace('proj', '')}</TableCell>
                                        <TableCell>
                                            <Input
                                            type="number"
                                            value={values.revenueGrowth}
                                            onChange={(e) =>
                                                handleAssumptionChange(year, 'revenueGrowth', Number(e.target.value))
                                            }
                                            className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                            type="number"
                                            value={values.expenseChange}
                                            onChange={(e) =>
                                                handleAssumptionChange(year, 'expenseChange', Number(e.target.value))
                                            }
                                            className="h-8"
                                            />
                                        </TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                                </CardContent>
                                </Card>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Loan Type</Label>
                                        <Select value={loanType} onValueChange={setLoanType}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Term Loan">Term Loan</SelectItem>
                                                <SelectItem value="Overdraft">Overdraft (OD)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Rate of Interest (% p.a.)</Label>
                                        <Input type="number" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Loan Requirement</Label>
                                        <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} />
                                    </div>
                                    {loanType === 'Term Loan' && (
                                    <div className="space-y-2">
                                        <Label>Repayment Period (Years)</Label>
                                        <Input type="number" value={repaymentYears} onChange={(e) => setRepaymentYears(Number(e.target.value))}/>
                                    </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Fixed Assets & Depreciation</h3>
                                 <Card>
                                    <CardContent className="p-2 max-h-60 overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Asset Name</TableHead>
                                                    <TableHead>Cost</TableHead>
                                                    <TableHead>Year</TableHead>
                                                    <TableHead>Rate(%)</TableHead>
                                                    <TableHead>Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {assets.map(asset => (
                                                    <TableRow key={asset.id}>
                                                        <TableCell><Input className="h-8" value={asset.name} onChange={e => handleAssetChange(asset.id, 'name', e.target.value)} /></TableCell>
                                                        <TableCell><Input className="h-8 w-24" type="number" value={asset.cost} onChange={e => handleAssetChange(asset.id, 'cost', Number(e.target.value))} /></TableCell>
                                                        <TableCell>
                                                            <Select value={asset.additionYear} onValueChange={v => handleAssetChange(asset.id, 'additionYear', v)}>
                                                                <SelectTrigger className="h-8"><SelectValue/></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Historical">Historical</SelectItem>
                                                                    {Array.from({ length: projectedYears }, (_, i) => `proj${i + 1}`).map(y => (
                                                                        <SelectItem key={y} value={y}>{`Year ${y.replace('proj', '')}`}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell><Input className="h-8 w-16" type="number" value={asset.depreciationRate} onChange={e => handleAssetChange(asset.id, 'depreciationRate', Number(e.target.value))} /></TableCell>
                                                        <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveAsset(asset.id)}><Trash2 className="h-4 w-4"/></Button></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                    <CardFooter className="p-2">
                                        <Button size="sm" variant="outline" className="w-full" onClick={handleAddAsset}><PlusCircle className="mr-2 h-4 w-4" /> Add Asset</Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                            Generate Report
                        </Button>
                    </CardFooter>
                </Card>
            </TabsContent>
            
            <TabsContent value="report">
                <Card>
                    <CardHeader>
                        <CardTitle>CMA Report</CardTitle>
                        <CardDescription>Review the auto-generated Credit Monitoring Arrangement report.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" defaultValue={['Part I: Operating Statement', 'Part II: Analysis of Balance Sheet']} className="w-full space-y-4">
                            {reportData && Object.entries(reportData).map(([key, value]: [string, any], index) => (
                                <AccordionItem value={key} key={key+index}>
                                    <AccordionTrigger className="text-lg font-semibold capitalize bg-muted/50 px-4 rounded-md">
                                        {key}
                                    </AccordionTrigger>
                                    <AccordionContent className="p-2">
                                        <VerticalDataTable title={key} data={value.data} years={value.years} isAmortization={value.isAmortization} />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="observations">
                <Card>
                     <CardHeader>
                        <CardTitle>AI Generated Observations</CardTitle>
                        <CardDescription>Banker-style commentary on the financials. You can edit this before exporting.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isGenerating ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                         ) : (
                            <Textarea
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                rows={15}
                                className="font-mono text-sm"
                            />
                         )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

function VerticalDataTable({ title, data, years, isAmortization }: { title: string, data: any, years: string[], isAmortization?: boolean }) {
    if (!data) return <p>No data available for {title}.</p>;
    
    const isHorizontal = Array.isArray(data);
    const particulars = isHorizontal ? data : Object.keys(data);
    
    const formatYearLabel = (year: string) => {
        if (year.startsWith('year')) return `Audited ${year.replace('year', 'Year ')}`;
        if (year.startsWith('proj')) return `Projected ${year.replace('proj', 'Year ')}`;
        return year;
    };
    
    const yearLabels = years.map(formatYearLabel);

    if(isAmortization) {
        return (
             <Table>
                <TableHeader>
                    <TableRow>
                        {years.map(header => <TableHead key={header} className="capitalize">{header.replace(/([A-Z]|\d+)/g, ' $1')}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row: any, rowIndex: number) => (
                        <TableRow key={rowIndex}>
                            {years.map(header => (
                                <TableCell key={header} className={header !== 'Month' ? 'font-mono text-right' : ''}>
                                    {row[header].toLocaleString('en-IN')}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

    if (title.includes('Ratio Analysis')) {
         const categories = {
            'Liquidity Ratios': ['Current Ratio', 'Quick Ratio'],
            'Solvency Ratios': ['Debt Equity Ratio', 'Proprietary Ratio'],
            'Profitability Ratios (%)': ['Gross Profit Ratio (%)', 'Net Profit Ratio (%)', 'Return on Capital Employed (ROCE) (%)', 'Return on Net Worth (RONW) (%)'],
            'Turnover Ratios': ['Inventory Turnover', 'Debtors Turnover', 'Creditors Turnover', 'Fixed Asset Turnover'],
            'Coverage Ratios': ['DSCR (Debt Service Coverage Ratio)', 'Interest Coverage Ratio'],
        };
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="font-bold">Ratio</TableHead>
                        {yearLabels.map(year => <TableHead key={year} className="text-right font-bold">{year}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.entries(categories).map(([category, ratios]) => (
                        <React.Fragment key={category}>
                            <TableRow className="bg-muted/30">
                                <TableCell colSpan={years.length + 1} className="font-bold">{category}</TableCell>
                            </TableRow>
                            {ratios.map(ratio => (
                                <TableRow key={ratio}>
                                    <TableCell>{ratio}</TableCell>
                                    {years.map(year => (
                                        <TableCell key={`${ratio}-${year}`} className="text-right font-mono">
                                            {data[year]?.[ratio] || '-'}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        );
    }
    
    if (title.includes('Cash Flow')) {
        const cfoItems = Object.keys(data[years[0]].cfo);
        const cfiItems = Object.keys(data[years[0]].cfi);
        const cffItems = Object.keys(data[years[0]].cff);
        return (
            <Table>
                <TableHeader><TableRow><TableHead className="font-bold">Particulars</TableHead>{yearLabels.map(y => <TableHead key={y} className="text-right font-bold">{y}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                    <TableRow className="bg-muted/30"><TableCell className="font-bold" colSpan={years.length+1}>A. Cash Flow from Operating Activities</TableCell></TableRow>
                    {cfoItems.map(item => <TableRow key={item}><TableCell className="pl-6">{item}</TableCell>{years.map(year => <TableCell key={year} className="text-right font-mono">{Math.round(data[year].cfo[item]).toLocaleString('en-IN')}</TableCell>)}</TableRow>)}
                    <TableRow className="font-bold"><TableCell>Net Cash from Operating Activities</TableCell>{years.map(year => <TableCell key={year} className="text-right font-mono">{Math.round(data[year].netCfo).toLocaleString('en-IN')}</TableCell>)}</TableRow>
                    <TableRow className="bg-muted/30"><TableCell className="font-bold" colSpan={years.length+1}>B. Cash Flow from Investing Activities</TableCell></TableRow>
                    {cfiItems.map(item => <TableRow key={item}><TableCell className="pl-6">{item}</TableCell>{years.map(year => <TableCell key={year} className="text-right font-mono">{Math.round(data[year].cfi[item]).toLocaleString('en-IN')}</TableCell>)}</TableRow>)}
                    <TableRow className="font-bold"><TableCell>Net Cash from Investing Activities</TableCell>{years.map(year => <TableCell key={year} className="text-right font-mono">{Math.round(data[year].netCfi).toLocaleString('en-IN')}</TableCell>)}</TableRow>
                    <TableRow className="bg-muted/30"><TableCell className="font-bold" colSpan={years.length+1}>C. Cash Flow from Financing Activities</TableCell></TableRow>
                    {cffItems.map(item => <TableRow key={item}><TableCell className="pl-6">{item}</TableCell>{years.map(year => <TableCell key={year} className="text-right font-mono">{Math.round(data[year].cff[item]).toLocaleString('en-IN')}</TableCell>)}</TableRow>)}
                    <TableRow className="font-bold"><TableCell>Net Cash from Financing Activities</TableCell>{years.map(year => <TableCell key={year} className="text-right font-mono">{Math.round(data[year].netCff).toLocaleString('en-IN')}</TableCell>)}</TableRow>
                </TableBody>
            </Table>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="font-bold">Particulars</TableHead>
                    {yearLabels.map(year => (
                        <TableHead key={year} className="text-right font-bold">{year}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {particulars.map((item: any, index: number) => {
                    const rowKey = isHorizontal ? (item.ratio || item.particulars) : item;
                    if (!rowKey) return null;
                    const rowData = isHorizontal ? item : data[rowKey];

                    if (rowData.isHeader) {
                        return (
                             <TableRow key={`${rowKey}-${index}`}>
                                <TableCell colSpan={years.length + 1} className={cn("font-bold", rowData.level === 1 && "pl-8", rowData.level === undefined && "bg-muted/50")}>
                                    {rowKey}
                                </TableCell>
                            </TableRow>
                        )
                    }

                    const isTotal = typeof rowKey === 'string' && (rowKey.toUpperCase().startsWith('TOTAL') || rowData.isTotal);

                    return (
                        <TableRow key={`${rowKey}-${index}`}>
                            <TableCell className={cn("font-medium", isTotal && "font-bold")}>{rowKey}</TableCell>
                            {years.map(year => (
                                <TableCell key={`${rowKey}-${year}`} className={cn('text-right font-mono', isTotal && "font-bold")}>
                                    {rowData[year] !== undefined && rowData[year] !== null ? Math.round(Number(rowData[year])).toLocaleString('en-IN') : '-'}
                                </TableCell>
                            ))}
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    );
}
