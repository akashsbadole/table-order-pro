import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ShoppingCart, TrendingUp, IndianRupee, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

type Period = 'today' | 'week' | 'month';

const Dashboard = () => {
  const { profile } = useAuth();
  const [trendPeriod, setTrendPeriod] = useState<Period>('week');

  const { data: todayStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const todayStart = `${today}T00:00:00`;
      const todayEnd = `${today}T23:59:59`;

      const [ordersRes, tablesRes, txRes] = await Promise.all([
        supabase.from('orders').select('id, total_amount, order_type, status, created_at')
          .gte('created_at', todayStart).lte('created_at', todayEnd),
        supabase.from('restaurant_tables').select('id, status'),
        supabase.from('transactions').select('amount, payment_method, created_at')
          .eq('status', 'completed').gte('created_at', todayStart).lte('created_at', todayEnd),
      ]);

      const orders = ordersRes.data || [];
      const tables = tablesRes.data || [];
      const transactions = txRes.data || [];

      const totalSales = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const orderCount = orders.length;
      const avgOrder = orderCount > 0 ? totalSales / orderCount : 0;
      const activeTables = tables.filter((t) => t.status === 'occupied').length;

      const paymentBreakdown = transactions.reduce<Record<string, number>>((acc, t) => {
        acc[t.payment_method] = (acc[t.payment_method] || 0) + Number(t.amount);
        return acc;
      }, {});

      const typeBreakdown = orders.reduce<Record<string, number>>((acc, o) => {
        acc[o.order_type] = (acc[o.order_type] || 0) + 1;
        return acc;
      }, {});

      const hourlyData = Array.from({ length: 12 }, (_, i) => {
        const hour = new Date();
        hour.setHours(hour.getHours() - 11 + i, 0, 0, 0);
        const hourEnd = new Date(hour);
        hourEnd.setHours(hour.getHours() + 1);
        const hourSales = transactions
          .filter((t) => { const d = new Date(t.created_at); return d >= hour && d < hourEnd; })
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return { hour: hour.toLocaleTimeString('en-IN', { hour: '2-digit', hour12: true }), sales: hourSales };
      });

      return { totalSales, orderCount, avgOrder, activeTables, paymentBreakdown, typeBreakdown, hourlyData };
    },
    refetchInterval: 30000,
  });

  // Sales trends
  const { data: trendData = [] } = useQuery({
    queryKey: ['sales-trends', trendPeriod],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      if (trendPeriod === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (trendPeriod === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabase.from('transactions')
        .select('amount, created_at')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .order('created_at');
      if (error) throw error;

      const grouped: Record<string, number> = {};
      (data || []).forEach((t) => {
        const key = trendPeriod === 'today'
          ? new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', hour12: true })
          : new Date(t.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        grouped[key] = (grouped[key] || 0) + Number(t.amount);
      });

      return Object.entries(grouped).map(([label, value]) => ({ label, value }));
    },
  });

  // Top selling items
  const { data: topItems = [] } = useQuery({
    queryKey: ['top-selling-items'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase.from('order_items')
        .select('item_name, quantity')
        .gte('created_at', thirtyDaysAgo);
      if (error) throw error;

      const grouped: Record<string, number> = {};
      (data || []).forEach((i) => {
        grouped[i.item_name] = (grouped[i.item_name] || 0) + i.quantity;
      });

      return Object.entries(grouped)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);
    },
  });

  const stats = [
    { label: "Today's Sales", value: `₹${(todayStats?.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, icon: <IndianRupee className="h-5 w-5" />, color: 'text-success' },
    { label: 'Orders Today', value: String(todayStats?.orderCount || 0), icon: <ShoppingCart className="h-5 w-5" />, color: 'text-primary' },
    { label: 'Avg Order Value', value: `₹${(todayStats?.avgOrder || 0).toFixed(0)}`, icon: <TrendingUp className="h-5 w-5" />, color: 'text-warning' },
    { label: 'Active Tables', value: String(todayStats?.activeTables || 0), icon: <LayoutDashboard className="h-5 w-5" />, color: 'text-info' },
  ];

  const COLORS = ['hsl(243, 75%, 59%)', 'hsl(0, 72%, 51%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)'];

  const paymentData = Object.entries(todayStats?.paymentBreakdown || {}).map(([name, value]) => ({
    name: name.toUpperCase(), value,
  }));

  const typeData = Object.entries(todayStats?.typeBreakdown || {}).map(([name, value]) => ({
    name: name.replace('_', ' '), value,
  }));

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name ?? 'User'}</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <div className={stat.color}>{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold font-mono">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Hourly Sales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Hourly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {(todayStats?.hourlyData?.some((h) => h.sales > 0)) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={todayStats?.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [`₹${v.toFixed(0)}`, 'Sales']} />
                  <Bar dataKey="sales" fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                Sales data will appear as orders are placed today
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentData.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                      {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `₹${v.toFixed(0)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center">
                  {paymentData.map((d, i) => (
                    <Badge key={d.name} variant="outline" className="text-xs gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {d.name}: ₹{(d.value as number).toFixed(0)}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">No payment data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Sales Trends</CardTitle>
            <div className="flex gap-1">
              {(['today', 'week', 'month'] as Period[]).map((p) => (
                <Button key={p} variant={trendPeriod === p ? 'default' : 'outline'} size="sm" className="text-xs capitalize" onClick={() => setTrendPeriod(p)}>
                  {p}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`₹${v.toFixed(0)}`, 'Sales']} />
                <Line type="monotone" dataKey="value" stroke="hsl(243, 75%, 59%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">No trend data available</div>
          )}
        </CardContent>
      </Card>

      {/* Top Selling Items */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top Selling Items (30 days)</CardTitle></CardHeader>
        <CardContent>
          {topItems.length > 0 ? (
            <div className="space-y-2">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-6 text-right text-sm font-bold text-muted-foreground">#{i + 1}</span>
                  <div className="flex-1 h-8 bg-muted/50 rounded-md overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary/20 rounded-md"
                      style={{ width: `${(item.qty / topItems[0].qty) * 100}%` }}
                    />
                    <span className="relative z-10 px-3 text-sm font-medium leading-8">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-sm">{item.qty}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">No order data yet</div>
          )}
        </CardContent>
      </Card>

      {/* Order Type Summary */}
      {typeData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Order Types Today</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {typeData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">{d.name}</Badge>
                  <span className="font-mono font-bold">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
