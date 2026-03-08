import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useLowStockAlert() {
  const { toast } = useToast();
  const alerted = useRef(false);

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['low-stock-check'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, current_stock, low_stock_threshold, unit')
        .order('name');
      if (error) throw error;
      return (data || []).filter((i) => i.current_stock <= i.low_stock_threshold);
    },
    refetchInterval: 60000, // check every minute
  });

  useEffect(() => {
    if (lowStockItems.length > 0 && !alerted.current) {
      alerted.current = true;
      const names = lowStockItems.slice(0, 3).map((i) => i.name).join(', ');
      const more = lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : '';
      toast({
        title: `⚠️ Low Stock Alert`,
        description: `${names}${more} below threshold`,
        variant: 'destructive',
      });
    }
    if (lowStockItems.length === 0) {
      alerted.current = false;
    }
  }, [lowStockItems, toast]);

  return { lowStockCount: lowStockItems.length, lowStockItems };
}
