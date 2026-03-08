import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, ShoppingCart, TrendingUp, IndianRupee } from 'lucide-react';

const Dashboard = () => {
  const { profile } = useAuth();

  const stats = [
    { label: "Today's Sales", value: '₹0.00', icon: <IndianRupee className="h-5 w-5" />, color: 'text-success' },
    { label: 'Orders Today', value: '0', icon: <ShoppingCart className="h-5 w-5" />, color: 'text-primary' },
    { label: 'Avg Order Value', value: '₹0.00', icon: <TrendingUp className="h-5 w-5" />, color: 'text-warning' },
    { label: 'Active Tables', value: '0', icon: <LayoutDashboard className="h-5 w-5" />, color: 'text-info' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name ?? 'User'}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <div className={stat.color}>{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Sales charts will appear here once orders are placed.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
