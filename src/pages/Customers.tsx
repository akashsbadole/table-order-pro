import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Edit2, Loader2, UserCircle, Phone, MapPin, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Customers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

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

      // Group by phone number
      const grouped: Record<string, {
        name: string;
        phone: string;
        address: string;
        orderCount: number;
        totalSpent: number;
        lastOrder: string;
      }> = {};

      (data || []).forEach((order) => {
        const phone = order.customer_phone!;
        if (!grouped[phone]) {
          grouped[phone] = {
            name: order.customer_name || 'Unknown',
            phone,
            address: order.customer_address || '',
            orderCount: 0,
            totalSpent: 0,
            lastOrder: order.created_at,
          };
        }
        grouped[phone].orderCount++;
        grouped[phone].totalSpent += Number(order.total_amount);
        // Keep the latest name/address
        if (order.created_at > grouped[phone].lastOrder) {
          grouped[phone].lastOrder = order.created_at;
          if (order.customer_name) grouped[phone].name = order.customer_name;
          if (order.customer_address) grouped[phone].address = order.customer_address;
        }
      });

      return Object.values(grouped).sort((a, b) => b.orderCount - a.orderCount);
    },
  });

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">Customer directory from order history</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <UserCircle className="h-3 w-3" />
          {customers.length} customers
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
          {filtered.map((customer) => (
            <Card key={customer.phone} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    {customer.name}
                  </CardTitle>
                  {customer.orderCount >= 3 && (
                    <Badge variant="default" className="text-[10px]">Regular</Badge>
                  )}
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
                <p className="text-[10px] text-muted-foreground">
                  Last order: {new Date(customer.lastOrder).toLocaleDateString('en-IN')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Customers;
