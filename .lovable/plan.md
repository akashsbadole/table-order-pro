

# Production-Ready FoodPOS — Implementation Plan

This plan covers the changes needed to take FoodPOS from a development prototype to a production-grade web application.

---

## What Needs to Change

### 1. Remove Demo Credentials from Login Page
The login page currently exposes hardcoded demo emails/passwords (`admin@foodpos.in / admin123`, etc.). These must be removed for production.

### 2. Update HTML Meta Tags
`index.html` still has Lovable placeholder OG tags. Update with proper FoodPOS branding, description, and a real OG image.

### 3. Add Error Boundary
No error boundary exists. A crash in any component takes down the entire app. Add a global `ErrorBoundary` component wrapping the app.

### 4. Code Splitting with React.lazy
All 20+ page components are eagerly imported in `App.tsx`. Use `React.lazy` + `Suspense` to split the bundle and improve initial load time.

### 5. Global Loading / Skeleton States
Replace raw "Loading..." text strings with proper skeleton components for a polished UX.

### 6. QueryClient Production Configuration
The `QueryClient` has no retry, staleTime, or error handling config. Add sensible defaults for production (retry 2x, 5-min staleTime, global error handler).

### 7. PWA / Offline Indicator
Add a service worker registration stub and an offline banner so staff know when connectivity drops (critical for restaurant environments).

### 8. Security Hardening
- Remove the hardcoded `DEMO_CREDENTIALS` array entirely
- Ensure the signup flow creates an organization + assigns admin role automatically (onboarding flow)
- Add rate limiting awareness on login (already handled by auth backend)

### 9. Signup Onboarding Flow
Currently signup creates a profile but no organization. New users land with `organization_id = null` and can't do anything. Add a post-signup onboarding step that creates an organization and assigns the `admin` role.

### 10. Fix Console Warnings
- `PlanFormDialog` needs `React.forwardRef` to eliminate the ref warning

### 11. Environment-Aware Config
Add a footer or hidden version indicator for debugging in production.

---

## Database Changes

**Migration: Auto-create organization on signup**
- Create a DB function `handle_new_user_onboarding()` that:
  1. Creates a new organization with the user's name as restaurant name
  2. Updates the profile's `organization_id`
  3. Inserts an `admin` role into `user_roles`
- Attach as trigger on `profiles` insert (or extend the existing `handle_new_user` trigger)

---

## Files to Create/Edit

| File | Action |
|---|---|
| `src/components/ErrorBoundary.tsx` | Create — catches React errors, shows recovery UI |
| `src/pages/Onboarding.tsx` | Create — post-signup org setup (name, address, GSTIN) |
| `src/App.tsx` | Edit — lazy imports, Suspense, ErrorBoundary, QueryClient config, onboarding route |
| `src/pages/Login.tsx` | Edit — remove demo credentials section, clean up for production |
| `src/components/PlanFormDialog.tsx` | Edit — add forwardRef |
| `index.html` | Edit — update OG meta tags |
| `src/components/OfflineBanner.tsx` | Create — shows banner when navigator.onLine is false |
| `src/components/AppLayout.tsx` | Edit — add offline banner, version footer |

---

## Implementation Order

1. Remove demo credentials + update login page
2. Add ErrorBoundary component
3. Code-split with React.lazy + Suspense
4. Configure QueryClient for production
5. Create onboarding page + DB migration for auto-org creation
6. Update index.html meta tags
7. Add offline banner
8. Fix PlanFormDialog forwardRef warning
9. Add version footer

