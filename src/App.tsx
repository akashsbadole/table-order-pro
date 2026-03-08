import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderHistory from "./pages/OrderHistory";
import Tables from "./pages/Tables";
import Kitchen from "./pages/Kitchen";
import Inventory from "./pages/Inventory";
import MenuManagement from "./pages/MenuManagement";
import Customers from "./pages/Customers";
import AuditLogs from "./pages/AuditLogs";
import SettingsPage from "./pages/Settings";
import StaffScheduling from "./pages/StaffScheduling";
import ExportImport from "./pages/ExportImport";
import BackupPage from "./pages/Backup";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Receipt from "./pages/Receipt";
import GSTReports from "./pages/GSTReports";
import EODSettlement from "./pages/EODSettlement";
import Reports from "./pages/Reports";
import SubscriptionAdmin from "./pages/SubscriptionAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              <Route path="/" element={<Navigate to="/orders" replace />} />

              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier', 'waiter']}><AppLayout><Orders /></AppLayout></ProtectedRoute>} />
              <Route path="/order-history" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}><AppLayout><OrderHistory /></AppLayout></ProtectedRoute>} />
              <Route path="/tables" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']}><AppLayout><Tables /></AppLayout></ProtectedRoute>} />
              <Route path="/kitchen" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'kitchen_staff']}><AppLayout><Kitchen /></AppLayout></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AppLayout><Inventory /></AppLayout></ProtectedRoute>} />
              <Route path="/menu-management" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><AppLayout><MenuManagement /></AppLayout></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}><AppLayout><Customers /></AppLayout></ProtectedRoute>} />
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
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
