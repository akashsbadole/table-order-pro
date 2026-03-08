# FoodPOS — Feature Roadmap & TODO

## ✅ Phase 1: Foundation (DONE)
- [x] Database schema (17 tables with RLS)
- [x] Multi-tenant architecture with organization_id scoping
- [x] Authentication (email/password + PIN quick login)
- [x] Role-based access control (admin, manager, cashier, waiter, kitchen_staff)
- [x] User roles in dedicated table (security best practice)
- [x] App layout with role-filtered sidebar
- [x] Login/Signup screen with demo credentials
- [x] Protected routes with role checks
- [x] Dark/light theme with persistence
- [x] i18n support (English, Hindi, Tamil)
- [x] Keyboard shortcuts

## ✅ Phase 2: Orders & Billing (DONE)
- [x] Menu grid with category tabs and search
- [x] Cart with quantity controls
- [x] GST breakdown (CGST + SGST)
- [x] Order type selector (dine-in, takeaway, delivery)
- [x] Live database integration (menu items from DB)
- [x] Order creation (save to DB)
- [x] KOT (Kitchen Order Ticket) generation
- [x] Billing dialog with payment method selection
- [x] Receipt generation (printable GST invoice with QR)
- [x] Receipt sharing via SMS
- [x] Order history with filters
- [ ] Split bill support
- [ ] Discount application with audit logging
- [ ] Customer details for delivery orders
- [ ] Table selection for dine-in orders

## ✅ Phase 3: Table Management (PARTIAL)
- [x] Visual floor plan with status colors
- [x] Multi-floor and section support
- [ ] Tap table → view/start order
- [ ] Table transfer
- [ ] Merge tables
- [ ] Drag-to-arrange layout editor

## ✅ Phase 4: Kitchen Display System (PARTIAL)
- [x] KOT cards with urgency colors
- [x] Status tracking (pending → preparing → ready → served)
- [ ] Real-time KOT updates (Supabase Realtime)
- [ ] Mark Ready per item/order
- [ ] Audio notification for new orders
- [ ] Category filters

## ✅ Phase 5: Inventory Management (PARTIAL)
- [x] Stock list UI with low-stock thresholds
- [x] Recipe ingredient linking
- [ ] Auto-deduction via recipe links
- [ ] Low-stock alerts/notifications
- [ ] Manual stock adjustment with reason
- [ ] Purchase order creation

## ✅ Phase 6: Dashboard & Analytics (PARTIAL)
- [x] Dashboard UI shell with Recharts
- [x] GST reports page
- [x] End-of-day settlement
- [x] General reports page
- [ ] Live sales summary from DB
- [ ] Sales trend charts (daily/weekly/monthly)
- [ ] Top-selling items
- [ ] Payment method breakdown

## ✅ Phase 7: Admin & Settings (PARTIAL)
- [x] Audit log viewer
- [x] Staff scheduling
- [x] Customer management with loyalty points
- [x] Loyalty transactions tracking
- [x] PIN-based quick login (Edge Function)
- [x] Data export/import
- [x] Backup management
- [ ] Menu editor (full add/edit/delete)
- [ ] Staff management (add users, assign roles from UI)
- [ ] Organization settings editor (GSTIN, address, logo)

## ✅ Phase 8: Subscription & Multi-Tenancy (DONE)
- [x] Subscription plans table with pricing & features
- [x] Auto-provisioned 14-day free trial on org creation (DB trigger)
- [x] Subscription admin dashboard (stats: total, active, trialing, expiring)
- [x] Subscription table with search/filter
- [x] Create & edit subscription plans (name, price, features)
- [x] Enable/disable plans with toggle
- [x] Per-org subscription management (extend trial, activate, cancel)
- [x] RLS policies for subscription data isolation
- [ ] Razorpay payment integration
- [ ] Auto-expire & email notification on trial end

## 📋 Backlog
- [ ] Multi-outlet/branch support (multiple orgs per owner)
- [ ] Digital receipt via WhatsApp
- [ ] Offline mode with sync
- [ ] Reporting exports (CSV/PDF)
- [ ] Super-admin dashboard across all tenants
- [ ] Webhook integrations (Slack, email alerts)
- [ ] API rate limiting per tenant
