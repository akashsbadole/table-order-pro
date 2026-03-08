import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLowStockAlert } from '@/hooks/useLowStockAlert';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import OfflineBanner from '@/components/OfflineBanner';
import {
  LayoutDashboard, ShoppingCart, Grid3X3, ChefHat, Package, Settings,
  LogOut, Menu, X, UtensilsCrossed, CalendarDays, FileSpreadsheet, Database,
  History, Moon, Sun, UserCircle, Shield, AlertTriangle, Receipt, ClipboardCheck, BarChart3, Crown,
} from 'lucide-react';


const navItemsDef = [
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { labelKey: 'nav.orders', path: '/orders', icon: <ShoppingCart className="h-5 w-5" />, roles: ['admin', 'manager', 'cashier', 'waiter'] },
  { labelKey: 'nav.history', path: '/order-history', icon: <History className="h-5 w-5" />, roles: ['admin', 'manager', 'cashier'] },
  { labelKey: 'nav.tables', path: '/tables', icon: <Grid3X3 className="h-5 w-5" />, roles: ['admin', 'manager', 'waiter'] },
  { labelKey: 'nav.kitchen', path: '/kitchen', icon: <ChefHat className="h-5 w-5" />, roles: ['admin', 'manager', 'kitchen_staff'] },
  { labelKey: 'nav.inventory', path: '/inventory', icon: <Package className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { labelKey: 'nav.purchaseOrders', path: '/purchase-orders', icon: <FileSpreadsheet className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { labelKey: 'nav.menu', path: '/menu-management', icon: <UtensilsCrossed className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { labelKey: 'nav.customers', path: '/customers', icon: <UserCircle className="h-5 w-5" />, roles: ['admin', 'manager', 'cashier'] },
  { labelKey: 'nav.staff', path: '/staff-scheduling', icon: <CalendarDays className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { labelKey: 'nav.gstReports', path: '/gst-reports', icon: <Receipt className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { labelKey: 'nav.eodSettlement', path: '/eod-settlement', icon: <ClipboardCheck className="h-5 w-5" />, roles: ['admin', 'manager', 'cashier'] },
  { labelKey: 'nav.reports', path: '/reports', icon: <BarChart3 className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { labelKey: 'nav.staffManagement', path: '/staff-management', icon: <UserCircle className="h-5 w-5" />, roles: ['admin'] },
  { labelKey: 'nav.auditLogs', path: '/audit-logs', icon: <Shield className="h-5 w-5" />, roles: ['admin'] },
  { labelKey: 'nav.exportImport', path: '/export-import', icon: <FileSpreadsheet className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { labelKey: 'nav.backup', path: '/backup', icon: <Database className="h-5 w-5" />, roles: ['admin'] },
  { labelKey: 'nav.subscriptions', path: '/subscription-admin', icon: <Crown className="h-5 w-5" />, roles: ['admin'] },
  { labelKey: 'nav.settings', path: '/settings', icon: <Settings className="h-5 w-5" />, roles: ['admin'] },
] as const;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, roles, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { lowStockCount } = useLowStockAlert();
  useKeyboardShortcuts();

  const filteredNavItems = navItemsDef.filter((item) => item.roles.some((r) => roles.includes(r as any)));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <UtensilsCrossed className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">FoodPOS</span>
            <Button variant="ghost" size="icon" className="ml-auto lg:hidden text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {profile?.organization_id && (
            <div className="px-4 py-2 border-b border-sidebar-border">
              <p className="text-xs text-sidebar-foreground/50 truncate">Organization</p>
              <p className="text-sm font-medium text-sidebar-foreground truncate">Demo Restaurant</p>
            </div>
          )}

          <nav className="flex-1 space-y-0.5 px-3 py-3 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  location.pathname === item.path
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}>
                {item.icon}<span className="truncate">{t(item.labelKey)}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium truncate">{profile?.full_name ?? 'User'}</p>
                <p className="text-xs text-sidebar-foreground/50 capitalize">{roles[0]?.replace('_', ' ') ?? 'No role'}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent" onClick={signOut}>
              <LogOut className="h-4 w-4" /> {t('nav.signOut')}
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex flex-1 flex-col overflow-hidden">
        <OfflineBanner />
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          {lowStockCount > 0 && (
            <Link to="/inventory">
              <Badge variant="destructive" className="gap-1 cursor-pointer">
                <AlertTriangle className="h-3 w-3" />
                {lowStockCount} {t('inventory.lowStock')}
              </Badge>
            </Link>
          )}
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <span className="text-xs text-muted-foreground font-mono hidden sm:block">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </header>
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
