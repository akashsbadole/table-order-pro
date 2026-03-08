import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Search, XCircle, Eye, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  confirmed: 'bg-info/10 text-info border-info/30',
  preparing: 'bg-primary/10 text-primary border-primary/30',
  ready: 'bg-success/10 text-success border-success/30',
  served: 'bg-success/10 text-success border-success/30',
  completed: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

const OrderHistory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [viewOrder, setViewOrder] = useState<any>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['order-history', statusFilter, typeFilter, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .gte('created_at', `${dateFilter}T00:00:00`)
        .lte('created_at', `${dateFilter}T23:59:59`)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
      if (typeFilter !== 'all') query = query.eq('order_type', typeFilter as any);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ['order-items-detail', viewOrder?.id],
    queryFn: async () => {
      if (!viewOrder) return [];
      const { data, error } = await supabase.from('order_items').select('*').eq('order_id', viewOrder.id);
      if (error) throw error;
      return data;
    },
    enabled: !!viewOrder,
  });

  const cancelOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-history'] });
      setViewOrder(null);
      toast({ title: 'Order cancelled' });
    },
  });

  const filtered = orders.filter((o) =>
    !search || String(o.order_number).includes(search) || (o.customer_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Order History</h1>
        <p className="text-sm text-muted-foreground">View and manage past orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by order # or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="dine_in">Dine In</SelectItem>
            <SelectItem value="takeaway">Takeaway</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        <Badge variant="outline">{filtered.length} orders</Badge>
        <Badge variant="outline" className="font-mono">
          Total: ₹{filtered.reduce((s, o) => s + Number(o.total_amount), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Badge>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-muted-foreground">
            <History className="h-10 w-10 mb-2 opacity-30" />
            <p>No orders found for this date/filter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <Card key={order.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setViewOrder(order)}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm">#{order.order_number}</span>
                    <Badge variant="outline" className={`text-[10px] capitalize ${statusColors[order.status] || ''}`}>
                      {order.status}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {order.order_type.replace('_', ' ')}
                    </Badge>
                    {order.customer_name && <span className="text-xs text-muted-foreground">{order.customer_name}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {order.discount_amount > 0 && ` • Discount: ₹${Number(order.discount_amount).toFixed(0)}`}
                  </p>
                </div>
                <span className="font-mono font-bold text-primary shrink-0">₹{Number(order.total_amount).toFixed(0)}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order #{viewOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className={`capitalize ${statusColors[viewOrder.status] || ''}`}>{viewOrder.status}</Badge>
                <Badge variant="secondary" className="capitalize">{viewOrder.order_type.replace('_', ' ')}</Badge>
              </div>

              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm rounded-md bg-muted/50 p-2">
                    <div>
                      <span className="font-medium">{item.item_name}</span>
                      <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                      {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    </div>
                    <span className="font-mono">₹{(Number(item.unit_price) * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-sm border-t border-border pt-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">₹{Number(viewOrder.subtotal).toFixed(2)}</span></div>
                {viewOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-destructive"><span>Discount</span><span className="font-mono">-₹{Number(viewOrder.discount_amount).toFixed(2)}</span></div>
                )}
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">CGST</span><span className="font-mono">₹{Number(viewOrder.cgst_amount).toFixed(2)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">SGST</span><span className="font-mono">₹{Number(viewOrder.sgst_amount).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t border-border pt-1">
                  <span>Total</span><span className="font-mono">₹{Number(viewOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {viewOrder.customer_name && (
                <div className="text-xs text-muted-foreground">
                  <p>Customer: {viewOrder.customer_name}</p>
                  {viewOrder.customer_phone && <p>Phone: {viewOrder.customer_phone}</p>}
                </div>
              )}

              {viewOrder.status !== 'cancelled' && viewOrder.status !== 'completed' && (
                <Button variant="destructive" className="w-full touch-target gap-2" onClick={() => cancelOrder.mutate(viewOrder.id)} disabled={cancelOrder.isPending}>
                  <XCircle className="h-4 w-4" />
                  {cancelOrder.isPending ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistory;
