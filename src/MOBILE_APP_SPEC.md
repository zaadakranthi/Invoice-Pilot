
# Mobile App Feature Specification: InvoicePilot

## 1. Introduction

This document provides a detailed specification for creating a native mobile application (iOS and Android) based on the existing InvoicePilot web application. It outlines the core data structures, business logic, calculations, and feature requirements necessary for development, likely using a framework like React Native.

---

## 2. Core Concepts & Data Management

The mobile app should mirror the web app's "single source of truth" architecture. All application data should be managed through a centralized state management system (e.g., React Context, Zustand, Redux) and persisted locally on the device (e.g., using AsyncStorage, MMKV, or a local database like SQLite).

### 2.1. Data Persistence

- A mechanism equivalent to the `useStickyState` hook should be implemented to save the entire application state to the device's local storage. This ensures data is not lost when the app is closed.
- The app should load this persisted state into the state management store upon startup.

### 2.2. Core Data Models

The following data models from `src/lib/types.ts` are essential and should be replicated in the mobile app's codebase (e.g., in TypeScript types/interfaces).

-   `Customer`: Manages all customer details.
-   `Vendor`: Manages all supplier details.
-   `Product`: Manages goods and services, including pricing and tax info.
-   `Invoice`: Represents a sales invoice.
-   `PurchaseBill`: Represents a purchase bill.
-   `PaymentReceived`: A record of a payment from a customer.
-   `PaymentMade`: A record of a payment to a vendor.
-   `LineItem`: A single item within an invoice or bill.
-   `BrandingSettings`: Stores company-specific details and preferences.
-   `BankAccount`: For managing cash and bank accounts.

---

## 3. Detailed Feature Breakdown

### 3.1. Dashboard

The dashboard is the main screen of the application.

-   **Screen:** `DashboardScreen`
-   **UI Components:**
    -   **Summary Cards (4x):** Display key metrics.
        -   **Total Receivables:**
            -   **Logic:** Sum of `(invoice.totalAmount - invoice.amountPaid)` for all invoices.
            -   **Data Source:** `invoices` state.
        -   **Total Payables:**
            -   **Logic:** Sum of `(bill.totalAmount - bill.amountPaid)` for all purchase bills.
            -   **Data Source:** `bills` state.
        -   **Net Tax Liability:**
            -   **Logic:** `(Total GST from Invoices) - (Total GST from Bills)`.
            -   Total GST from Invoices = Sum of `(cgst + sgst + igst + cess)` for all invoices.
            -   Total GST from Bills = Sum of `gstAmount` for all bills.
            -   **Data Source:** `invoices`, `bills` state.
        -   **Active Customers:**
            -   **Logic:** Count of all entries in the `customers` state.
            -   **Data Source:** `customers` state.
    -   **Feature Navigation Grid:**
        -   A grid or list of tappable cards that navigate to different feature screens. These should be grouped logically as they are on the web dashboard (e.g., "Billing & GST", "Analytics", etc.).
    -   **Latest Invoices Panel:**
        -   **Logic:** Display the 5 most recent invoices from the `invoices` state, sorted by date in descending order.
        -   Show client name, status, and total amount for each.
        -   Include a "View All" button that navigates to the `InvoiceListScreen`.
    -   **Compliance Calendar:**
        -   **Logic:** Automatically display key compliance dates for the **current month**.
        -   Should calculate and show due dates for GSTR-1 (11th), GSTR-3B (20th), etc.
        -   Mark dates as "complete" if the current system date is past the due date.

### 3.2. Billing & GST Module

#### 3.2.1. Invoice Management

-   **Screens:**
    -   `InvoiceListScreen`: Displays all invoices with search and filter capabilities.
    -   `InvoiceFormScreen (Create/Edit)`: A form to create or edit an invoice.
    -   `InvoiceDetailScreen`: A read-only view of a single invoice.
-   **Core Logic (`InvoiceFormScreen`):**
    -   **Invoice Number:** Must be unique. When creating, suggest the next number based on `brandingSettings.invoicePrefix` and `brandingSettings.nextInvoiceNumber`.
    -   **Line Items:** User can add/remove products/services.
        -   When a `Product` is selected, its `description`, `rate`, `hsnCode`, and `gstRate` should auto-fill.
        -   `Amount` = `quantity * rate`.
    -   **Calculations (Real-time):**
        -   `Subtotal` = Sum of `Amount` for all line items.
        -   `Total CGST` & `Total SGST` = Sum of `(Amount * gstRate / 100) / 2` for each line item (assuming intra-state).
        -   `Total IGST` = (Logic for inter-state transactions must be added).
        -   `Total CESS` = Sum of `(Amount * cessRate / 100)`.
        -   `Grand Total` = `Subtotal + Total GST + Total CESS`.
    -   **Saving an Invoice:**
        -   On save, a new `Invoice` object is created/updated in the state.
        -   Stock levels must be validated. For each line item, check if `product.currentStock >= item.quantity`. A warning should be shown for negative stock, but the transaction can still proceed.
        -   The `nextInvoiceNumber` in `brandingSettings` should be incremented.

#### 3.2.2. Purchase Bill Management

-   **Screens:**
    -   `PurchaseListScreen`: Displays all purchase bills.
    -   `PurchaseFormScreen (Create)`: A form to record a new purchase bill.
-   **Core Logic (`PurchaseFormScreen`):**
    -   Similar to invoice creation, but for purchases.
    -   When a `Product` is selected, `purchasePrice` should be used as the default rate.
    -   On save, a new `PurchaseBill` object is created. This transaction **increases** the stock quantity for the relevant products.

#### 3.2.3. GST Reports

-   **GSTR-1 Filing Prep Screen:**
    -   **Logic:** User selects a financial year and month. The app filters all `invoices` for that period.
    -   Data is aggregated and displayed under GST-compliant headings (B2B, B2CS, etc.).
    -   **B2B Invoices:** Filter invoices where the customer has a GSTIN.
    -   **B2CS Invoices:** Filter invoices where the customer has no GSTIN.
    -   **Functionality:** Provide an "Export JSON" button that generates a portal-ready JSON file based on the official GSTN schema.
-   **GSTR-3B Summary Screen:**
    -   **Logic:** User selects a period.
    -   **Outward Supplies (Table 3.1):** Calculated by summing up `taxableValue`, `cgst`, `sgst`, etc., from all `invoices` in the selected period.
    -   **Eligible ITC (Table 4):** Calculated by summing up `gstAmount` from all `purchaseBills` in the period.
    -   **Tax Payable:** Calculated as `(Outward Tax) - (Eligible ITC)`.

### 3.3. Parties & Items Module

-   **Customer/Vendor Management Screens:**
    -   Full CRUD (Create, Read, Update, Delete) functionality for `Customers` and `Vendors`.
    -   Forms should include fields for name, contact details, address, GSTIN, and PAN.
-   **Product & Service Management Screen:**
    -   Full CRUD functionality for `Products`.
    -   The form must include fields for name, type, HSN/SAC code, UOM, sale price, purchase price, GST rate, and opening stock.
    -   **HSN Code Suggestion:** The form should have a button next to the HSN field. When tapped, it calls the AI flow (`suggestHsnCode`) with the product name and fills the result into the HSN field.

### 3.4. Day-to-Day Accounting Module

-   **Receivables Screen:**
    -   **Logic:** Group all invoices by `customer`.
    -   For each customer, calculate:
        -   `Total Billed` = Sum of `totalAmount` for their invoices.
        -   `Total Received` = Sum of `amount` from `paymentsReceived` for that customer.
        -   `Balance` = `Total Billed - Total Received`.
    -   Display a collapsible list of customers with their outstanding balances.
    -   Each customer should have a "Record Receipt" button.
-   **Payables Screen:**
    -   **Logic:** Group all bills by `vendor`.
    -   Similar calculations as Receivables but using `purchaseBills` and `paymentsMade`.
    -   Each vendor should have a "Record Payment" button.
-   **Cash & Bank Ledger Screen:**
    -   **Logic:**
        1.  Start with `openingBalance` from the selected `BankAccount`.
        2.  Create a combined list of all `paymentsReceived` and `paymentsMade`.
        3.  Sort this list chronologically by date.
        4.  Iterate through the sorted list, calculating a running balance for each transaction. `(Balance + Receipt - Payment)`.
        5.  Display this as a ledger.

### 3.5. Financial Statements

-   **P&L Account Screen:**
    -   **Logic:**
        -   `Gross Profit`: Calculated from the Trading Account logic.
        -   `Indirect Incomes`: Sum of all ledger accounts categorized as 'Income' (excluding Sales).
        -   `Indirect Expenses`: Sum of all ledger accounts categorized as 'Expense' (excluding Purchases & Direct Expenses).
        -   `Net Profit` = `(Gross Profit + Indirect Incomes) - Indirect Expenses`.
-   **Balance Sheet Screen:**
    -   **Logic:**
        -   **Liabilities Side:**
            -   `Capital`: From opening balance.
            -   `Net Profit`: Calculated from the P&L logic.
            -   `Accounts Payable`: The total outstanding balance from the Payables screen.
        -   **Assets Side:**
            -   `Fixed Assets`: From asset ledger.
            -   `Closing Stock`: User-entered value.
            -   `Accounts Receivable`: The total outstanding balance from the Receivables screen.
            -   `Cash & Bank`: The final balance from the Cash & Bank Ledger.
        -   The screen must show if `Total Assets` equals `Total Liabilities`.

### 3.6. AI & Professional Services

-   **Book an Appointment Screen:**
    -   UI should include a calendar for date selection and a list of available time slots.
    -   A form to select the professional (CA/Auditor) and type of consultation (Video/Phone Call).
-   **Company Branding Screen:**
    -   A form to edit all fields in the `BrandingSettings` object.
    -   **Logo Analysis:**
        -   Allow the user to upload a logo image.
        -   The image should be converted to a Base64 data URI.
        -   Call the `suggestLogoImprovements` AI flow with the data URI.
        -   Display the returned suggestions to the user.
    -   **Terms & Conditions Generation:**
        -   A button that calls the `suggestTermsAndConditions` AI flow with the `companyName`.
        -   The result should populate the T&Cs text area.
