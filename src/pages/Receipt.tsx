import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, UtensilsCrossed } from 'lucide-react';

const Receipt = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['receipt-order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['receipt-items', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId!);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  const { data: org } = useQuery({
    queryKey: ['receipt-org', order?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('name, address, phone, gstin')
        .eq('id', order!.organization_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!order?.organization_id,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Receipt not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 flex items-start justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-lg font-bold">{org?.name || 'Restaurant'}</h1>
          {org?.address && <p className="text-xs text-muted-foreground">{org.address}</p>}
          {org?.phone && <p className="text-xs text-muted-foreground">Tel: {org.phone}</p>}
          {org?.gstin && <p className="text-xs text-muted-foreground">GSTIN: {org.gstin}</p>}
        </CardHeader>

        <CardContent className="space-y-3">
          <Separator />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Order #{order.order_number}</span>
            <span>{new Date(order.created_at).toLocaleString('en-IN')}</span>
          </div>
          <div className="text-xs text-muted-foreground capitalize">
            Type: {order.order_type.replace('_', ' ')}
          </div>

          <Separator />

          <div className="space-y-1.5">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span>{item.item_name}</span>
                  <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                </div>
                <span className="font-mono">₹{(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">₹{Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount</span>
                <span className="font-mono">-₹{Number(order.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">CGST</span>
              <span className="font-mono">₹{Number(order.cgst_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">SGST</span>
              <span className="font-mono">₹{Number(order.sgst_amount).toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="font-mono">₹{Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">Thank you for dining with us!</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">Powered by FoodPOS</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Receipt;
