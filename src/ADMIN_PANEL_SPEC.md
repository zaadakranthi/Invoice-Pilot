
# Mobile App Feature Specification: Admin Panel

## 1. Introduction

This document outlines the features and data requirements for replicating the **Admin Panel** of the InvoicePilot web application in a native mobile app (iOS/Android). This panel is designed for the application owner/administrator to monitor application usage, manage users, and view key business metrics.

---

## 2. Core Concepts & Data

The Admin Panel relies on aggregated data from across the user base. In a production environment, this would require a backend service connected to a central database (like Firestore) to query and summarize user activities. For the mobile app, this means creating API endpoints that the app can call to fetch this admin-level data securely.

### 2.1. Admin-Specific Data Models

In addition to the core data models (like `Customer`, `Invoice`), the admin panel requires summarized or specific data structures:

-   **AdminStats**: An object containing key real-time metrics.
    -   `activeSubscriptions`: { `total`: number, `pro`: number, `business`: number }
    -   `eWayBillsToday`: number
    -   `gstrReportsToday`: number
    -   `aiFeaturesUsedToday`: number
-   **ActivityFeedItem**: An object representing a single important user action.
    -   `user`: string (User's Name)
    -   `feature`: string (e.g., "ITC Reconciliation", "Upgraded to Business Plan")
    -   `plan`: string ("Pro" or "Business")
    -   `timestamp`: Date/string
-   **UserWithActivity**: A `Customer` object augmented with admin-specific data.
    -   `activityCount`: number (Total number of tracked actions)
    -   `activities`: An array of { `action`: string, `date`: string } objects.
    -   `subscriptionPlan`: string ("Pro", "Business", or "Free")

---

## 3. Detailed Feature Breakdown

The Admin Panel consists of two main screens.

### 3.1. Admin Dashboard Screen

This is the main landing screen for the administrator.

-   **Screen:** `AdminDashboardScreen`
-   **Navigation:** Accessible via a dedicated "Admin" button in the main app navigation (e.g., in a settings menu or a tab bar for the admin user).
-   **UI Components:**
    -   **Header:** Displays "Admin Dashboard" as the title.
    -   **Summary Cards (4x):** A grid of cards displaying key live metrics.
        -   **Active Subscriptions:**
            -   **Logic:** Shows the total count of paying users. Should also display a breakdown of how many users are on the "Pro" vs. "Business" plan.
            -   **Data Source:** `AdminStats.activeSubscriptions`
        -   **E-Way Bills Generated (Today):**
            -   **Logic:** Shows a simple count of all E-Way Bills generated across the platform on the current day.
            -   **Data Source:** `AdminStats.eWayBillsToday`
        -   **GSTR Reports Generated (Today):**
            -   **Logic:** A count of all GSTR reports (GSTR-1, GSTR-3B) generated on the current day.
            -   **Data Source:** `AdminStats.gstrReportsToday`
        -   **AI Features Used (Today):**
            -   **Logic:** A count of every time an AI-powered feature (like ITC Reconciliation, HSN Code Suggestion) was used.
            -   **Data Source:** `AdminStats.aiFeaturesUsedToday`
    -   **Live Activity Feed Panel:**
        -   A card containing a table or list of recent, significant user actions.
        -   **Logic:** Display the last 5-10 `ActivityFeedItem` objects, sorted with the most recent first.
        -   **Columns/Fields:** User Name, Description of Activity, User's Plan, and Time (e.g., "5 mins ago").
    -   **User Management Navigation Card:**
        -   A prominent, tappable card that clearly navigates the admin to the `UserManagementScreen`.
        -   **Title:** "User Management"
        -   **Description:** "View, search, and export a list of all registered users."

### 3.2. User Management Screen

This screen allows the admin to view and manage the application's user base.

-   **Screen:** `UserManagementScreen`
-   **Navigation:**
    -   Accessed from the `AdminDashboardScreen`.
    -   Must contain a clear **"Back" button** in the header to return to the `AdminDashboardScreen`.
-   **UI Components:**
    -   **Header:**
        -   Title: "User Management"
        -   Search Bar: A text input field to filter the user list in real-time. The search should match against user name, email, GSTIN, etc.
    -   **Export Buttons (2x):**
        1.  **Export All Users:**
            -   **Logic:** Generates a CSV file containing the complete details of **all** registered users.
            -   **CSV Columns:** `Client Code`, `Name`, `Email`, `Phone`, `GSTIN`, `PAN`, `Activity Count`, `Billing Address`, `Shipping Address`.
        2.  **Export Subscribers:**
            -   **Logic:** Generates a CSV file containing details for **only** the users who have an active "Pro" or "Business" subscription.
            -   **CSV Columns:** Same as above, but with an additional `Subscription Plan` column.
    -   **User List Table:**
        -   A scrollable table displaying all registered users (or the filtered results).
        -   **Columns:**
            -   `Name`: The customer's full name.
            -   `Email`: The customer's email address.
            -   `Phone`: The customer's mobile number.
            -   `Activity Level`: A badge or label showing the `UserWithActivity.activityCount`. This provides a quick indicator of user engagement.
            -   `GSTIN`: The user's GST Identification Number.
            -   `Actions`: A button or menu for each user row.
    -   **View Activity Dialog/Screen:**
        -   **Trigger:** Tapping the "Actions" button on a user row in the table.
        -   **Logic:** Presents a modal dialog or navigates to a new screen that displays the activity log for the selected user.
        -   **Content:** A simple table listing the user's recent actions and the date they occurred (from `UserWithActivity.activities`).
