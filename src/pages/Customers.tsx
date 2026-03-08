import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Loader2, UserCircle, Phone, MapPin, ShoppingCart, Star, Gift } from 'lucide-react';

const Customers = () => {
  const [search, setSearch] = useState('');

  // Get unique customers from orders
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('customer_name, customer_phone, customer_address, id, total_amount, created_at')
        .not('customer_phone', 'is', null)
        .neq('customer_phone', '')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const grouped: Record<string, {
        name: string; phone: string; address: string;
        orderCount: number; totalSpent: number; lastOrder: string;
      }> = {};

      (data || []).forEach((order) => {
        const phone = order.customer_phone!;
        if (!grouped[phone]) {
          grouped[phone] = {
            name: order.customer_name || 'Unknown', phone,
            address: order.customer_address || '', orderCount: 0,
            totalSpent: 0, lastOrder: order.created_at,
          };
        }
        grouped[phone].orderCount++;
        grouped[phone].totalSpent += Number(order.total_amount);
        if (order.created_at > grouped[phone].lastOrder) {
          grouped[phone].lastOrder = order.created_at;
          if (order.customer_name) grouped[phone].name = order.customer_name;
          if (order.customer_address) grouped[phone].address = order.customer_address;
        }
      });

      return Object.values(grouped).sort((a, b) => b.orderCount - a.orderCount);
    },
  });

  // Get loyalty points
  const { data: loyaltyMap = {} } = useQuery({
    queryKey: ['loyalty-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('customer_phone, total_points, redeemed_points, total_visits');
      if (error) throw error;
      const map: Record<string, { points: number; visits: number }> = {};
      (data || []).forEach((lp) => {
        map[lp.customer_phone] = {
          points: lp.total_points - lp.redeemed_points,
          visits: lp.total_visits,
        };
      });
      return map;
    },
  });

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">Customer directory with loyalty tracking</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <UserCircle className="h-3 w-3" /> {customers.length} customers
        </Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-muted-foreground">
            <UserCircle className="h-10 w-10 mb-2 opacity-30" />
            <p>No customers found</p>
            <p className="text-xs">Customers are auto-saved from delivery/takeaway orders</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((customer) => {
            const loyalty = loyaltyMap[customer.phone];
            return (
              <Card key={customer.phone} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      {customer.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      {customer.orderCount >= 3 && (
                        <Badge variant="default" className="text-[10px]">Regular</Badge>
                      )}
                      {loyalty && loyalty.points > 0 && (
                        <Badge variant="secondary" className="text-[10px] gap-0.5">
                          <Star className="h-2.5 w-2.5" /> {loyalty.points} pts
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span className="font-mono">{customer.phone}</span>
                  </div>
                  {customer.address && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{customer.address}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ShoppingCart className="h-3 w-3" />
                      <span>{customer.orderCount} orders</span>
                    </div>
                    <span className="text-sm font-mono font-bold text-primary">
                      ₹{customer.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  {loyalty && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Gift className="h-3 w-3" /> Loyalty visits: {loyalty.visits}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Last order: {new Date(customer.lastOrder).toLocaleDateString('en-IN')}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Customers;
