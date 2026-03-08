import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-loaded pages
const Login = lazy(() => import("./pages/Login"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const Tables = lazy(() => import("./pages/Tables"));
const Kitchen = lazy(() => import("./pages/Kitchen"));
const Inventory = lazy(() => import("./pages/Inventory"));
const MenuManagement = lazy(() => import("./pages/MenuManagement"));
const Customers = lazy(() => import("./pages/Customers"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const StaffScheduling = lazy(() => import("./pages/StaffScheduling"));
const ExportImport = lazy(() => import("./pages/ExportImport"));
const BackupPage = lazy(() => import("./pages/Backup"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Receipt = lazy(() => import("./pages/Receipt"));
const GSTReports = lazy(() => import("./pages/GSTReports"));
const EODSettlement = lazy(() => import("./pages/EODSettlement"));
const Reports = lazy(() => import("./pages/Reports"));
const SubscriptionAdmin = lazy(() => import("./pages/SubscriptionAdmin"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));

const PageLoader = () => (
  <div className="flex-1 p-6 space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-72" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
    <Skeleton className="h-64 mt-4" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  <Route path="/" element={<Navigate to="/orders" replace />} />

                  <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier', 'waiter']}><AppLayout><Orders /></AppLayout></ProtectedRoute>} />
                  <Route path="/order-history" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}><AppLayout><OrderHistory /></AppLayout></ProtectedRoute>} />
                  <Route path="/tables" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']}><AppLayout><Tables /></AppLayout></ProtectedRoute>} />
                  <Route path="/kitchen" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'kitchen_staff']}><AppLayout><Kitchen /></AppLayout></ProtectedRoute>} />
                  <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AppLayout><Inventory /></AppLayout></ProtectedRoute>} />
                  <Route path="/purchase-orders" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AppLayout><PurchaseOrders /></AppLayout></ProtectedRoute>} />
                  <Route path="/menu-management" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AppLayout><MenuManagement /></AppLayout></ProtectedRoute>} />
                  <Route path="/customers" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}><AppLayout><Customers /></AppLayout></ProtectedRoute>} />
                  <Route path="/staff-management" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><StaffManagement /></AppLayout></ProtectedRoute>} />
                  <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><AuditLogs /></AppLayout></ProtectedRoute>} />
                  <Route path="/staff-scheduling" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AppLayout><StaffScheduling /></AppLayout></ProtectedRoute>} />
                  <Route path="/export-import" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AppLayout><ExportImport /></AppLayout></ProtectedRoute>} />
                  <Route path="/backup" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><BackupPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/gst-reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AppLayout><GSTReports /></AppLayout></ProtectedRoute>} />
                  <Route path="/eod-settlement" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}><AppLayout><EODSettlement /></AppLayout></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
                  <Route path="/subscription-admin" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><SubscriptionAdmin /></AppLayout></ProtectedRoute>} />

                  <Route path="/receipt/:orderId" element={<Receipt />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
