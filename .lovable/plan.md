

# Implementation Plan: Remaining POS Features (Phases 2-7 + Backlog)

This is a large set of features spanning multiple areas of the application. Here is the implementation breakdown organized by phase.

---

## Already Implemented (will skip)
- Split bill dialog (exists, functional)
- Discount approval with audit logging (exists with PIN verification)
- Visual floor plan with status colors (exists)
- Tap table → view/start order (exists)
- KOT cards with urgency colors (exists)
- Realtime KOT updates (exists via Supabase Realtime)
- Stock list UI (exists with CRUD)
- Dashboard UI with Recharts (exists with live data)
- Menu editor add/edit/delete (exists)
- Audit log viewer (exists with filters)
- PIN-based quick login (exists)
- Dark mode toggle with persistence (exists)
- Keyboard shortcuts (exists)
- Low-stock alerts/notifications (exists via `useLowStockAlert`)
- GST report generation (exists)
- Customer loyalty program (exists in Customers page)
- Live sales summary from DB (exists in Dashboard)
- Payment method breakdown (exists in Dashboard)

---

## What Needs to Be Built

### Phase 2: Customer Details for Delivery Orders
- Add customer name/phone/address fields in Orders page when `orderType === 'delivery'` or `'takeaway'`
- Pass these fields through `useCreateOrder`

### Phase 3: Table Management Enhancements
1. **Table Transfer** — Dialog to move an active order from one table to another (update `orders.table_id` and table statuses)
2. **Merge Tables** — Select 2+ tables to link under one order, marking all as occupied
3. **Drag-to-arrange Layout Editor** — Enable dragging table cards to reposition (update `pos_x`/`pos_y` in DB). Will use CSS grid positioning with drag handlers.

### Phase 4: Kitchen Display Enhancements
1. **Mark Ready per item** — Add per-item "Ready" button (currently only per-order)
2. **Audio notification for new orders** — Play a sound when new KOT arrives via realtime
3. **Category filters** — Filter KOT display by menu category

### Phase 5: Inventory Enhancements
1. **Auto-deduction via recipe links** — After order completion, deduct inventory based on `recipe_ingredients`. Add a DB trigger or handle in `useCreateOrder`.
2. **Manual stock adjustment with reason** — Dialog with quantity change and reason field, logged to `audit_logs`
3. **Purchase order creation** — New `purchase_orders` table + UI for creating POs with items/quantities

### Phase 6: Dashboard & Analytics Enhancements
1. **Sales trend charts (daily/weekly/monthly)** — Add period selector and line chart showing sales over time
2. **Top-selling items** — Query `order_items` grouped by `item_name`, display ranked list

### Phase 7: Admin & Settings
1. **Staff management** — UI to list profiles in org, add new staff (create auth user + profile + role), edit roles, deactivate
2. **Organization settings** — Already exists but add logo upload (needs storage bucket)

### Backlog Items
1. **Digital receipt via SMS/WhatsApp** — Edge function exists (`send-receipt-sms`), wire up UI in receipt dialog
2. **Reporting exports (CSV/PDF)** — CSV export exists, add PDF generation
3. **Multi-outlet/branch support** — Future scope, skip for now
4. **Offline mode with sync** — Future scope, skip for now

---

## Database Changes Required

1. **`purchase_orders` table** — `id, organization_id, supplier_name, status (draft/ordered/received), total_amount, notes, created_at, created_by`
2. **`purchase_order_items` table** — `id, purchase_order_id, inventory_item_id, quantity, unit_price`
3. **DB function for inventory auto-deduction** — Trigger on order status change to 'confirmed', deducts stock via `recipe_ingredients`
4. **Storage bucket** for organization logos
5. **Enable realtime** on `order_items` table (for per-item KOT updates)

---

## Implementation Order

Given the scope, I recommend implementing in this order:

1. **Customer details for delivery** (small, high value)
2. **Table transfer & merge** (medium complexity)
3. **Kitchen per-item ready + audio + category filters** (medium)
4. **Inventory auto-deduction + manual adjustment** (medium, needs migration)
5. **Purchase orders** (new table + full CRUD)
6. **Dashboard trends + top items** (queries + charts)
7. **Staff management UI** (auth integration)
8. **Drag layout editor** (complex UI)
9. **Receipt SMS wiring + PDF export** (edge function integration)

---

## Technical Notes

- All new tables will include `organization_id` with RLS policies using `get_user_org_id()` for multi-tenant isolation
- Inventory auto-deduction will use a PostgreSQL trigger function (`AFTER UPDATE ON orders`) to avoid client-side complexity
- Audio notifications will use the Web Audio API with a simple beep sound
- Table drag will use pointer events with position stored as `pos_x`/`pos_y` on `restaurant_tables`
- Staff management will use the existing `pin-login` edge function pattern for creating users server-side

This is a substantial implementation. Shall I proceed with building all features in the listed order?

