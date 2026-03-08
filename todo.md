# FoodPOS — Feature Roadmap & TODO

## ✅ Phase 1: Foundation (DONE)
- [x] Database schema (17+ tables with RLS)
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
- [x] Receipt sharing via SMS/WhatsApp
- [x] Order history with filters
- [x] Split bill support
- [x] Discount application with audit logging
- [x] Customer details for delivery/takeaway orders
- [x] Table selection for dine-in orders

## ✅ Phase 3: Table Management (DONE)
- [x] Visual floor plan with status colors
- [x] Multi-floor and section support
- [x] Tap table → view/start order
- [x] Table transfer (move order between tables)
- [x] Merge tables (link multiple tables to one order)
- [x] Drag-to-arrange layout editor (edit mode with position saving)

## ✅ Phase 4: Kitchen Display System (DONE)
- [x] KOT cards with urgency colors
- [x] Status tracking (pending → preparing → ready → served)
- [x] Real-time KOT updates (Supabase Realtime)
- [x] Mark Ready per item and per order
- [x] Audio notification for new orders (Web Audio API beep)
- [x] Category filters

## ✅ Phase 5: Inventory Management (DONE)
- [x] Stock list UI with low-stock thresholds
- [x] Recipe ingredient linking
- [x] Auto-deduction via recipe links (DB trigger on order confirm)
- [x] Low-stock alerts/notifications
- [x] Manual stock adjustment with reason (audit logged)
- [x] Purchase order creation (draft → ordered → received with stock update)

## ✅ Phase 6: Dashboard & Analytics (DONE)
- [x] Dashboard UI shell with Recharts
- [x] GST reports page
- [x] End-of-day settlement
- [x] General reports page
- [x] Live sales summary from DB
- [x] Sales trend charts (daily/weekly/monthly)
- [x] Top-selling items (30-day ranking)
- [x] Payment method breakdown

## ✅ Phase 7: Admin & Settings (DONE)
- [x] Audit log viewer
- [x] Staff scheduling
- [x] Customer management with loyalty points
- [x] Loyalty transactions tracking
- [x] PIN-based quick login (Edge Function)
- [x] Data export/import
- [x] Backup management
- [x] Menu editor (full add/edit/delete)
- [x] Staff management (list profiles, toggle roles, activate/deactivate)
- [x] Organization settings editor (GSTIN, address, logo upload)

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
- [ ] Offline mode with sync
- [ ] Reporting exports (PDF generation)
- [ ] Super-admin dashboard across all tenants
- [ ] Webhook integrations (Slack, email alerts)
- [ ] API rate limiting per tenant
