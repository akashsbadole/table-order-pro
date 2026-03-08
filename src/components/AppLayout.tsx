import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, ShoppingCart, Grid3X3, ChefHat, Package, Settings,
  LogOut, Menu, X, UtensilsCrossed, CalendarDays, FileSpreadsheet,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: Array<'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen_staff'>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { label: 'Orders', path: '/orders', icon: <ShoppingCart className="h-5 w-5" />, roles: ['admin', 'manager', 'cashier', 'waiter'] },
  { label: 'Tables', path: '/tables', icon: <Grid3X3 className="h-5 w-5" />, roles: ['admin', 'manager', 'waiter'] },
  { label: 'Kitchen', path: '/kitchen', icon: <ChefHat className="h-5 w-5" />, roles: ['admin', 'manager', 'kitchen_staff'] },
  { label: 'Inventory', path: '/inventory', icon: <Package className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { label: 'Menu', path: '/menu-management', icon: <UtensilsCrossed className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { label: 'Staff', path: '/staff-scheduling', icon: <CalendarDays className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { label: 'Export/Import', path: '/export-import', icon: <FileSpreadsheet className="h-5 w-5" />, roles: ['admin', 'manager'] },
  { label: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" />, roles: ['admin'] },
];

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, roles, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNavItems = navItems.filter((item) => item.roles.some((r) => roles.includes(r)));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
            <UtensilsCrossed className="h-7 w-7 text-sidebar-primary" />
            <span className="text-lg font-bold tracking-tight">FoodPOS</span>
            <Button variant="ghost" size="icon" className="ml-auto lg:hidden text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-target',
                  location.pathname === item.path
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}>
                {item.icon}{item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-sidebar-border p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium truncate">{profile?.full_name ?? 'User'}</p>
                <p className="text-xs text-sidebar-foreground/50 capitalize">{roles[0] ?? 'No role'}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground font-mono">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
