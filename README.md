# FoodPOS — Multi-Tenant Restaurant POS System

## Overview

FoodPOS is a cloud-based, multi-tenant restaurant Point of Sale system built for managing orders, billing, kitchen operations, inventory, and staff across one or more restaurant outlets. Each tenant (organization) has fully isolated data via Row-Level Security (RLS).

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Recharts
- **Backend**: Lovable Cloud (Supabase) — PostgreSQL, Auth, Edge Functions, Realtime
- **Auth**: Email/password + PIN-based quick login
- **i18n**: English, Hindi, Tamil

## Architecture

### Multi-Tenancy

- Every table is scoped by `organization_id`
- All data access enforced via Supabase RLS policies using `get_user_org_id(auth.uid())`
- Role-based access: `admin`, `manager`, `cashier`, `waiter`, `kitchen_staff`
- Roles stored in a dedicated `user_roles` table (not on profiles) to prevent privilege escalation

### Subscription Model

- 14-day free trial on organization creation (auto-provisioned via DB trigger)
- Admin panel for managing subscription plans (create, edit, enable/disable)
- Admin can manually extend trials, activate subscriptions, or cancel per organization
- Architected for Razorpay integration (deferred)

## Features

### ✅ Implemented

#### Core
- Multi-tenant organization isolation (RLS)
- Role-based access control (5 roles)
- Protected routes with role filtering
- Responsive app layout with sidebar navigation
- Dark/light theme with persistence
- Keyboard shortcuts
- i18n (EN/HI/TA)

#### Orders & Billing
- Menu grid with category tabs, search, veg/non-veg filter
- Cart with quantity controls
- GST breakdown (CGST + SGST) per item
- Order types: dine-in, takeaway, delivery
- Order creation with live DB integration
- KOT (Kitchen Order Ticket) generation
- Billing dialog with payment method selection (cash, card, UPI)
- Printable GST receipt with QR code
- Receipt sharing via SMS
- Order history with filters

#### Table Management
- Visual floor plan with color-coded status (vacant, occupied, dirty)
- Multi-floor and section support

#### Kitchen Display
- KOT cards with urgency color coding
- Status tracking (pending → preparing → ready → served)

#### Inventory
- Stock list with current levels and units
- Low-stock threshold alerts
- Recipe ingredient linking

#### Dashboard & Reports
- Dashboard with Recharts visualizations
- GST reports
- End-of-day settlement
- General reports page

#### Staff & Admin
- Staff scheduling
- Audit log viewer
- Customer management with loyalty points
- Loyalty transactions tracking
- PIN-based quick login (Edge Function)
- Data export/import
- Backup management

#### Subscription Administration (Super Admin)
- Organization subscription overview (stats: total, active, trialing, expiring)
- Subscription table with search/filter
- Manage Plans tab: create, edit, enable/disable plans with features
- Per-org actions: extend trial, activate subscription, cancel
- Subscription plans with monthly/yearly pricing

### 🚧 Planned

- Split bill support
- Discount application with audit logging
- Customer details for delivery orders
- Table-to-order linking (tap table → start order)
- Table transfer & merge
- Drag-to-arrange floor plan editor
- Real-time KOT updates (Supabase Realtime)
- Mark Ready per item
- Audio notifications for new orders
- Auto inventory deduction via recipes
- Manual stock adjustment with reason
- Purchase order creation
- Live sales summary & trend charts
- Top-selling items analytics
- Payment method breakdown
- Menu editor (full CRUD)
- Staff management (add users, assign roles)
- Organization settings editor
- Multi-outlet/branch support
- Digital receipt via WhatsApp
- Offline mode with sync
- Reporting exports (CSV/PDF)
- Razorpay payment integration

## Database Schema

13 core tables + 2 subscription tables, all with RLS:

| Table | Purpose |
|---|---|
| `organizations` | Tenant orgs with GST/tax config |
| `profiles` | User profiles linked to orgs |
| `user_roles` | RBAC role assignments |
| `menu_categories` | Menu category grouping |
| `menu_items` | Menu items with pricing & GST |
| `orders` | Order records |
| `order_items` | Line items per order |
| `restaurant_tables` | Table layout with positions |
| `transactions` | Payment transactions |
| `inventory_items` | Stock tracking |
| `recipe_ingredients` | Menu-to-inventory linking |
| `loyalty_points` | Customer loyalty balances |
| `loyalty_transactions` | Points earn/redeem history |
| `staff_schedules` | Shift scheduling |
| `audit_logs` | Action audit trail |
| `subscription_plans` | Available plans |
| `subscriptions` | Per-org subscription status |

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

Or use [Lovable](https://lovable.dev) to edit and deploy directly.

## Deployment

Open Lovable → Share → Publish. Custom domains supported via Settings → Domains.
