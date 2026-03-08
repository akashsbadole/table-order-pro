

# Restaurant POS System — Implementation Plan

## Overview
A comprehensive Food & Restaurant POS web app with INR currency, GST taxation (CGST + SGST), and touch-first design optimized for speed.

---

## Phase 1: Foundation & Auth

### Supabase Setup & Database Schema
- **Organizations/Branches** table for multi-outlet support
- **Profiles** table linked to auth.users
- **User Roles** table with RBAC (Admin, Manager, Cashier, Waiter, Kitchen Staff) using security-definer functions
- **Menu Categories** and **Menu Items** tables (name, price, GST rate, image, availability)
- **Tables** table (number, capacity, status: vacant/occupied/dirty, floor/section)
- **Orders** table (type: dine-in/takeaway/delivery, status, table_id, customer info, timestamps)
- **Order Items** table (item, quantity, modifiers, notes, KOT status)
- **Transactions/Payments** table (method: cash/card/UPI, amount, GST breakdown)
- **Inventory** table (raw materials, stock level, unit, low-stock threshold)
- **Recipe Links** table (menu item → ingredient quantities for auto-deduction)
- **Audit Logs** table (action, user, timestamp, details)
- RLS policies for all tables based on user roles

### Authentication & Role-Based Access
- Login screen with PIN-based quick login (common in POS) + email/password
- Role-based navigation: each role sees only their relevant screens
- Session management with auto-logout after inactivity

---

## Phase 2: Front-of-House — Order & Billing

### Menu Grid
- Large touch-friendly category tabs across the top
- Grid of menu items with images, names, prices
- Quick search bar with instant filtering
- Item modifiers/add-ons popup (e.g., "extra cheese", "no onion")

### Order Screen
- Active order panel on the right side showing current items
- Quantity adjustment (+/-), item notes, remove item
- Order type selector: Dine-in (pick table), Takeaway, Delivery (customer details)
- Running total with GST breakdown (CGST + SGST)

### Billing & Checkout
- Payment method selection: Cash, Card, UPI
- Split bill support (by item, by seat, by percentage, equal split)
- GST-compliant invoice generation with GSTIN
- Print receipt / digital receipt option
- Discount application (percentage or flat, with audit log entry)

### Table Management
- Visual floor plan with drag-to-arrange tables
- Color-coded table status: Green (vacant), Red (occupied), Yellow (dirty)
- Tap table → view active order or start new order
- Table transfer (move order to different table)
- Merge tables for large parties

---

## Phase 3: Back-of-House — Kitchen & Inventory

### Kitchen Display System (KDS)
- Full-screen view of incoming KOTs in card format
- Orders sorted by time with color-coded urgency (green → yellow → red)
- "Mark Ready" button per item or per order
- Audio/visual notification for new orders
- Filter by category (e.g., only drinks, only starters)

### Inventory Management
- Raw materials list with current stock, unit, and threshold
- Auto-deduction when orders are completed (via recipe links)
- Low-stock alerts shown as badges/notifications
- Manual stock adjustment with reason logging
- Simple purchase order creation

---

## Phase 4: Admin Dashboard & Analytics

### Dashboard
- Today's sales summary (total revenue, order count, average order value)
- Sales trend charts (daily/weekly/monthly using Recharts)
- Top-selling items bar chart
- Busy hour heatmap
- Payment method breakdown (pie chart)

### Management Screens
- Menu editor: add/edit/delete items, set prices, toggle availability
- Staff management: add users, assign roles
- Audit log viewer: track voids, discounts, and sensitive actions
- GST report generation for compliance

---

## Design & UX

- **Touch-first**: Large buttons (min 48px), generous spacing
- **Dark mode** toggle for evening shifts
- **Color scheme**: Professional dark navy/charcoal with accent colors for status indicators
- **Responsive**: Optimized for tablets (primary) and desktops
- **Speed**: Minimal clicks to complete an order (target: under 10 seconds for a simple order)
- **Keyboard shortcuts** for desktop terminals (e.g., F1-F12 for categories, Enter to confirm)

