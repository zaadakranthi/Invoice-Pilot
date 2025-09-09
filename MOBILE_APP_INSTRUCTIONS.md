# Mobile App Development Instructions for InvoicePilot

This document provides all the necessary specifications for building the native iOS and Android mobile applications for the InvoicePilot platform.

## 1. Backend & Database

The backend is **already built and live** on Google Firebase. The mobile developer's primary task is to build the client-side application that connects to this existing infrastructure.

-   **Technology**: Firebase (Firestore Database, Firebase Auth).
-   **Data Sync**: The web application and the mobile application will share the same live Firestore database. All data created or updated on one platform will be instantly available on the other.
-   **Authentication**: The mobile app should use Firebase Authentication, implementing a "Sign in with Google" flow. The logic in `src/context/data-context.tsx` and `src/app/(auth)/login/page.tsx` can be used as a reference.

## 2. Core Application Feature Specification

All feature requirements, data models, business logic, and calculations for the main user-facing application are detailed in `src/MOBILE_APP_SPEC.md`. This document serves as the primary blueprint for the mobile app. It covers:

-   Dashboard Metrics
-   Invoice & Purchase Bill Management (Create, Edit, View)
-   GST Report Generation Logic (GSTR-1, GSTR-3B)
-   Customer, Vendor, and Product Management (CRUD operations)
-   Ledger and Financial Statement calculations (P&L, Balance Sheet)
-   AI feature integration (e.g., HSN Code Suggestion).

**Action**: The developer must read `src/MOBILE_APP_SPEC.md` thoroughly to understand the required features.

## 3. Admin Panel Feature Specification

For users with a "professional" or "superadmin" role, a separate admin panel is required in the mobile app.

All specifications for this panel are detailed in `src/ADMIN_PANEL_SPEC.md`. This covers:

-   Admin Dashboard with platform-wide statistics.
-   Live activity feeds.
-   User management screens (View, Search, Export).
-   Client workspace management for professionals.

**Action**: The developer must read `src/ADMIN_PANEL_SPEC.md` for all admin-related features.

## 4. Getting Started

1.  **Review this Project**: The developer should review the existing Next.js web application structure to understand the data models (`src/lib/types.ts`) and existing business logic (`src/context/data-context.tsx`).
2.  **Use the Blueprints**: Use `src/MOBILE_APP_SPEC.md` and `src/ADMIN_PANEL_SPEC.md` as the definitive guides for what to build.
3.  **Connect to Firebase**: Implement the Firebase SDK in the mobile application (React Native is recommended) and connect to the existing project to handle authentication and data storage. There is no need to build a new backend.