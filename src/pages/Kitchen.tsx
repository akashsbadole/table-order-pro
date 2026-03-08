import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Loader2, ChefHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface KotOrder {
  id: string;
  order_number: number;
  order_type: string;
  table_id: string | null;
  table_number?: string;
  created_at: string;
  items: {
    id: string;
    item_name: string;
    quantity: number;
    notes: string | null;
    kot_status: string;
  }[];
}

const getUrgencyColor = (minutes: number) => {
  if (minutes < 5) return 'border-l-success';
  if (minutes < 10) return 'border-l-warning';
  return 'border-l-destructive';
};

const Kitchen = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: async () => {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, order_number, order_type, table_id, created_at')
        .in('status', ['confirmed', 'preparing'])
        .order('created_at', { ascending: true });
      if (error) throw error;

      const orderIds = ordersData.map((o) => o.id);
      if (orderIds.length === 0) return [];

      const { data: itemsData, error: itemsErr } = await supabase
        .from('order_items')
        .select('id, order_id, item_name, quantity, notes, kot_status')
        .in('order_id', orderIds)
        .in('kot_status', ['pending', 'preparing']);
      if (itemsErr) throw itemsErr;

      // Get table numbers
      const tableIds = ordersData.map((o) => o.table_id).filter(Boolean) as string[];
      let tablesMap: Record<string, string> = {};
      if (tableIds.length > 0) {
        const { data: tables } = await supabase
          .from('restaurant_tables')
          .select('id, table_number')
          .in('id', tableIds);
        tablesMap = (tables || []).reduce((acc, t) => ({ ...acc, [t.id]: t.table_number }), {} as Record<string, string>);
      }

      return ordersData
        .map((order) => ({
          ...order,
          table_number: order.table_id ? tablesMap[order.table_id] : undefined,
          items: (itemsData || []).filter((i) => i.order_id === order.id),
        }))
        .filter((o) => o.items.length > 0) as KotOrder[];
    },
    refetchInterval: 10000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('kitchen-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const markReady = useMutation({
    mutationFn: async (orderId: string) => {
      // Mark all items in this order as ready
      const { error } = await supabase
        .from('order_items')
        .update({ kot_status: 'ready', kot_sent_at: new Date().toISOString() })
        .eq('order_id', orderId)
        .in('kot_status', ['pending', 'preparing']);
      if (error) throw error;

      // Update order status
      await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      toast({ title: 'Order marked ready' });
    },
  });

  const markPreparing = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('order_items')
        .update({ kot_status: 'preparing' })
        .eq('order_id', orderId)
        .eq('kot_status', 'pending');
      if (error) throw error;
      await supabase.from('orders').update({ status: 'preparing' }).eq('id', orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kitchen Display</h1>
          <p className="text-sm text-muted-foreground">Active orders requiring preparation</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <ChefHat className="h-3 w-3" />
          {orders.length} Active
        </Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <ChefHat className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No active orders</p>
            <p className="text-sm">New orders will appear here in real-time</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const minutesAgo = Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000);
            const allPreparing = order.items.every((i) => i.kot_status === 'preparing');
            return (
              <Card key={order.id} className={`border-l-4 ${getUrgencyColor(minutesAgo)}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">
                      #{order.order_number} {order.table_number ? `— ${order.table_number}` : ''}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {minutesAgo}m ago
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {order.order_type.replace('_', ' ')}
                    </Badge>
                    <Badge variant={allPreparing ? 'secondary' : 'destructive'} className="text-[10px] capitalize">
                      {allPreparing ? 'Preparing' : 'New'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 rounded-md bg-muted/50 p-2">
                      <span className="font-mono font-bold text-sm text-primary">{item.quantity}×</span>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{item.item_name}</span>
                        {item.notes && (
                          <p className="text-xs text-warning mt-0.5">⚠ {item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-3">
                    {!allPreparing && (
                      <Button
                        variant="outline"
                        className="flex-1 touch-target"
                        onClick={() => markPreparing.mutate(order.id)}
                        disabled={markPreparing.isPending}
                      >
                        Start Preparing
                      </Button>
                    )}
                    <Button
                      className="flex-1 touch-target"
                      onClick={() => markReady.mutate(order.id)}
                      disabled={markReady.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Ready
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Kitchen;
