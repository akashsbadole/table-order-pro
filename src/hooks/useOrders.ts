import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  gstRate: number;
  quantity: number;
  notes: string;
}

interface CreateOrderParams {
  cart: CartItem[];
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tableId?: string | null;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  paymentMethod?: 'cash' | 'card' | 'upi';
  discountAmount?: number;
}

export function useCreateOrder() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateOrderParams) => {
      if (!profile?.organization_id) throw new Error('No organization found');

      const subtotal = params.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const discount = params.discountAmount || 0;
      const afterDiscount = Math.max(0, subtotal - discount);
      const taxRatio = subtotal > 0 ? afterDiscount / subtotal : 0;
      const gstAmount = params.cart.reduce((sum, item) => sum + (item.price * item.quantity * item.gstRate) / 100, 0) * taxRatio;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;
      const total = afterDiscount + gstAmount;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          organization_id: profile.organization_id,
          order_type: params.orderType,
          table_id: params.tableId || null,
          customer_name: params.customerName || null,
          customer_phone: params.customerPhone || null,
          customer_address: params.customerAddress || null,
          subtotal,
          cgst_amount: cgst,
          sgst_amount: sgst,
          discount_amount: discount,
          total_amount: total,
          status: 'confirmed',
          created_by: profile.user_id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = params.cart.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        gst_rate: item.gstRate,
        notes: item.notes || null,
        kot_status: 'pending' as const,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      if (params.paymentMethod) {
        const { error: txError } = await supabase.from('transactions').insert({
          order_id: order.id,
          organization_id: profile.organization_id,
          payment_method: params.paymentMethod,
          amount: total,
          status: 'completed',
          processed_by: profile.user_id,
        });
        if (txError) throw txError;
        await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id);
      }

      return { ...order, items: orderItems };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Order created', description: 'Order placed successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Order failed', description: error.message, variant: 'destructive' });
    },
  });
}
