# FoodPOS — Feature Roadmap & TODO

## ✅ Phase 1: Foundation (DONE)
- [x] Database schema (11 tables with RLS)
- [x] Authentication (email/password + auto-confirm)
- [x] Role-based access control (admin, manager, cashier, waiter, kitchen_staff)
- [x] App layout with role-filtered sidebar
- [x] Login/Signup screen
- [x] Protected routes

## 🚧 Phase 2: Front-of-House — Orders & Billing (IN PROGRESS)
- [x] Menu grid with category tabs and search
- [x] Cart with quantity controls
- [x] GST breakdown (CGST + SGST)
- [x] Order type selector (dine-in, takeaway, delivery)
- [x] Live database integration (menu items from DB)
- [x] Order creation (save to DB)
- [x] KOT (Kitchen Order Ticket) generation
- [x] Billing dialog with payment method selection
- [x] Receipt generation (printable GST invoice)
- [x] Demo credentials for all roles on login screen
- [ ] Split bill support
- [ ] Discount application with audit logging
- [ ] Customer details for delivery orders
- [ ] Table selection for dine-in orders

## 🚧 Phase 3: Table Management
- [x] Visual floor plan with status colors
- [ ] Tap table → view/start order
- [ ] Table transfer
- [ ] Merge tables
- [ ] Drag-to-arrange layout editor

## 🚧 Phase 4: Kitchen Display System
- [x] KOT cards with urgency colors
- [ ] Real-time KOT updates (Supabase Realtime)
- [ ] Mark Ready per item/order
- [ ] Audio notification for new orders
- [ ] Category filters

## 🚧 Phase 5: Inventory Management
- [x] Stock list UI
- [ ] Auto-deduction via recipe links
- [ ] Low-stock alerts/notifications
- [ ] Manual stock adjustment with reason
- [ ] Purchase order creation

## 🚧 Phase 6: Dashboard & Analytics
- [x] Dashboard UI shell with Recharts
- [ ] Live sales summary from DB
- [ ] Sales trend charts (daily/weekly/monthly)
- [ ] Top-selling items
- [ ] Payment method breakdown
- [ ] GST report generation

## 🚧 Phase 7: Admin & Settings
- [ ] Menu editor (add/edit/delete items)
- [ ] Staff management (add users, assign roles)
- [ ] Organization settings (GSTIN, address, logo)
- [ ] Audit log viewer
- [ ] PIN-based quick login
- [ ] Dark mode toggle with persistence
- [ ] Keyboard shortcuts for desktop

## 📋 Backlog
- [ ] Multi-outlet/branch support
- [ ] Digital receipt via SMS/WhatsApp
- [ ] Offline mode with sync
- [ ] Customer loyalty program
- [ ] Reporting exports (CSV/PDF)
