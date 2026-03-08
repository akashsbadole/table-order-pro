import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: { id: string; name: string; current_stock: number; unit: string } | null;
}

const StockAdjustmentDialog = ({ open, onOpenChange, item }: Props) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('');

  const adjust = useMutation({
    mutationFn: async () => {
      if (!item || !profile?.organization_id) throw new Error('Missing data');
      const change = parseFloat(quantityChange);
      if (isNaN(change) || change === 0) throw new Error('Enter a valid quantity');
      if (!reason.trim()) throw new Error('Reason is required');

      const newStock = item.current_stock + change;
      const { error: updateErr } = await supabase
        .from('inventory_items')
        .update({ current_stock: Math.max(0, newStock) })
        .eq('id', item.id);
      if (updateErr) throw updateErr;

      // Log adjustment using raw query via rpc workaround — use from() with type cast
      const { error: logErr } = await (supabase as any).from('stock_adjustments').insert({
        organization_id: profile.organization_id,
        inventory_item_id: item.id,
        quantity_change: change,
        reason: reason.trim(),
        adjusted_by: profile.user_id,
      });
      if (logErr) throw logErr;

      await supabase.from('audit_logs').insert({
        organization_id: profile.organization_id,
        user_id: profile.user_id,
        entity_type: 'inventory',
        entity_id: item.id,
        action: 'stock_adjustment',
        details: { item_name: item.name, change, reason: reason.trim(), new_stock: Math.max(0, newStock) },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({ title: 'Stock adjusted' });
      setQuantityChange('');
      setReason('');
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock — {item?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Current stock: <span className="font-bold font-mono">{item?.current_stock} {item?.unit}</span>
          </div>
          <div className="space-y-2">
            <Label>Quantity Change (+ to add, - to remove)</Label>
            <Input type="number" value={quantityChange} onChange={(e) => setQuantityChange(e.target.value)} placeholder="e.g. +5 or -3" />
          </div>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Spoilage, Manual count correction" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => adjust.mutate()} disabled={!quantityChange || !reason.trim() || adjust.isPending}>
            {adjust.isPending ? 'Adjusting...' : 'Adjust'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustmentDialog;
