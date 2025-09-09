{ pkgs, ... }:

{
  packages = [
    pkgs.nodejs_20,
    pkgs.openssh
  ];
  
  # ... other configurations
}
# FreeQuickGSTwithCMA: Your AI-Powered GST & Accounting Co-Pilot

Welcome to FreeQuickGSTwithCMA, a modern, responsive web application designed to simplify GST invoicing, accounting, and compliance for Indian businesses. This application is built with a powerful tech stack to be robust, scalable, and easy to maintain.

## Tech Stack

This project leverages a modern, server-centric web architecture:

-   **Framework**: [Next.js](https://nextjs.org/) (using the App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI Library**: [React](https://react.dev/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Auth, Firestore, Hosting, Functions)
-   **Generative AI**: [Firebase Genkit](https://firebase.google.com/docs/genkit) with Google AI
-   **State Management**: React Context API for centralized data handling.
-   **Deployment**: [Firebase App Hosting](https://firebase.google.com/docs/hosting)

---

## Feature Documentation

The application is organized into several key modules, accessible from the sidebar and dashboard.

### 1. Dashboard & Navigation
- **Dynamic Dashboard**: The central hub providing at-a-glance summary cards for Total Receivables, Payables, Net Tax Liability, and Active Customers.
- **Marketing Carousel**: A visually appealing carousel at the top to highlight key application features.
- **Compliance Calendar**: An automated calendar that displays key GST and compliance deadlines for the current month.
- **Latest Invoices**: A live-updating panel showing the five most recent invoices for quick access.
- **Responsive Sidebar**: A collapsible sidebar for easy navigation across all application modules.

### 2. Billing & GST
- **Invoice Management**: Create, edit, and manage professional, GST-compliant invoices. Includes features for bulk CSV upload/export and quick invoicing.
- **Purchase Bill Management**: Record and track all purchase bills from vendors.
- **Credit & Debit Notes**: Issue and manage credit notes for sales returns and debit notes for purchase returns.
- **GSTR-1 Filing Prep**: Automatically generates a GSTR-1 summary from your sales data for a selected period, exportable in CSV and portal-ready JSON formats.
- **GSTR-3B Summary Prep**: Automatically generates a GSTR-3B summary from sales and purchase data, calculating net tax liability.
- **GSTR-9 Annual Return**: Prepare and review data for the annual GST return.
- **GSTR-9C Reconciliation**: Generate the reconciliation statement between audited financials and GSTR-9.

### 3. Analytics & Reconciliation
- **AI-Powered ITC Reconciliation**: Upload your GSTR-2B CSV, and the AI will match it against your purchase records, categorizing invoices into perfect matches, mismatches, and items missing from either source.
- **AI-Powered GSTR Comparison**: Compare GSTR-1 and GSTR-3B data to identify discrepancies. The AI provides an analysis of deviations and actionable suggestions for compliance.
- **Reports & Analytics**: A dedicated page to visualize monthly sales, view top clients, and see recent invoice activity.

### 4. Parties & Items
- **Customer Management**: A full CRUD (Create, Read, Update, Delete) interface for managing all customer details.
- **Vendor Management**: A full CRUD interface for managing all supplier/vendor details.
- **Products & Services**: Manage a central repository of your goods and services, including HSN/SAC codes, GST rates, and pricing. Features AI-powered HSN code suggestions.

### 5. Day-to-Day Accounting
- **Receivables & Payables**: Detailed, interactive ledgers for tracking outstanding payments from customers and dues to vendors.
- **Cash & Bank**: A consolidated ledger for all cash and bank transactions.
- **Journal Vouchers**: Record non-cash or adjustment entries.
- **General Ledger**: A comprehensive ledger view for any account in your Chart of Accounts.

### 6. Financial Statements
- **Trading Account**: Calculates Gross Profit or Loss.
- **Profit & Loss Account**: Calculates Net Profit or Loss.
- **Balance Sheet**: Provides a snapshot of the company's financial position with assets and liabilities.
- **Trial Balance**: Lists all ledger account balances to verify mathematical accuracy.
- **Depreciation Chart**: Manage fixed assets and calculate depreciation using the WDV method.

### 7. Professional Services & Settings
- **Appointment Booking**: A dedicated page for users to book a consultation (video or phone call) with a CA or Auditor via an interactive calendar and time-slot selector.
- **Company Branding**: A settings page to customize company details, logo, address, GSTIN, and default invoice terms. Features AI-powered logo analysis and T&C generation.

---

## Understanding the Code & Data Flow

It's important to understand how your code and data move from development to the live application.

-   **Your Code's "Home" is Here**: This development environment contains all your source code.
-   **GitHub is the "Master Copy"**: You will "push" your code from here to GitHub. This acts as the central backup and version control for your project.
-   **Firebase Publishes from GitHub**: The Firebase Hosting service is connected to your GitHub repository. When it detects a new change, it automatically pulls the latest version, builds it, and deploys it to your live website.

You never need to transfer code *from* Firebase *to* your computer. The flow is always **Here -> GitHub -> Firebase**.

## Transferring to GitHub

Here is a step-by-step guide to get your code into a GitHub repository. You will need to have `git` installed on your local machine.

### Step 1: Create a New Repository on GitHub
1.  Go to [GitHub.com](https://github.com/) and log in.
2.  Click the **+** icon in the top-right corner and select **New repository**.
3.  Give your repository a name (e.g., `free-quick-gst`).
4.  Choose whether you want the repository to be **Public** or **Private**.
5.  **Important**: Do NOT initialize the repository with a `README`, `.gitignore`, or `license` file. We already have those.
6.  Click **Create repository**.

### Step 1.5: Authenticate with GitHub
Before you can push your code, you need to log in to your GitHub account from this environment's terminal. This is a one-time setup.

1.  **Run the login command in the terminal:**
    ```bash
    gh auth login
    ```
2.  **Follow the on-screen prompts.** It will ask you a few questions. The recommended answers are usually the default:
    *   What account do you want to log into? **GitHub.com**
    *   What is your preferred protocol for Git operations? **HTTPS**
    *   Authenticate Git with your GitHub credentials? **Yes**
    *   How would you like to authenticate? **Login with a web browser**
3.  **The terminal will give you a one-time code** and ask you to open a URL in your browser.
4.  **Copy the code**, open the URL, and paste the code on the GitHub page. Authorize the login.
5.  Once you are done in the browser, come back to the terminal. You are now authenticated.

### Step 2: Push Your Existing Code
After creating the repository and authenticating, you can now push your code.

Open a terminal or command prompt in your project's root directory and run the following commands one by one:

1.  **Initialize a local Git repository:**
    ```bash
    git init -b main
    ```

2.  **Add all the files to be tracked:**
    ```bash
    git add .
    ```

3.  **Commit the files with a message:**
    ```bash
    git commit -m "Initial commit"
    ```

4.  **Connect your local repository to the one on GitHub.** (Copy this command from your new GitHub repository page. It will look like this):
    ```bash
    git remote add origin https://github.com/your-username/your-repository-name.git
    ```

5.  **Push your code to GitHub:**
    ```bash
    git push -u origin main
    ```

After these steps are complete, you can refresh your GitHub repository page, and you will see all of your project files there.

---

## Deployment
The application is configured for deployment on **Firebase App Hosting**. This service is designed specifically for modern web applications like this one and handles the build and deployment process automatically.

1.  **Push to GitHub**: First, make sure your code is on GitHub by following the "Transferring to GitHub" guide above.
2.  **Connect to Firebase**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use an existing one).
3.  **Navigate to App Hosting**: In the Firebase project, go to the **Build** section and click on **App Hosting**.
4.  **Create a Backend**: Follow the on-screen prompts to connect your GitHub repository. Firebase will automatically detect the `apphosting.yaml` file and configure the build settings.
5.  **Deploy**: Once connected, pushing new code to your `main` branch on GitHub will automatically trigger a new deployment. You can also manually trigger deployments from the Firebase console.
6.  **Go Live**: After the first deployment is complete, Firebase will provide you with a live URL to test your application. You can also connect a custom domain from the App Hosting dashboard.
