import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentTableId: string;
  currentTableNumber: string;
}

const TableTransferDialog = ({ open, onOpenChange, orderId, currentTableId, currentTableNumber }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const { data: tables = [] } = useQuery({
    queryKey: ['vacant-tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('id, table_number, capacity, section')
        .eq('status', 'vacant')
        .order('table_number');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const transfer = useMutation({
    mutationFn: async () => {
      if (!selectedTable) throw new Error('Select a table');
      await supabase.from('orders').update({ table_id: selectedTable }).eq('id', orderId);
      await supabase.from('restaurant_tables').update({ status: 'occupied' }).eq('id', selectedTable);
      await supabase.from('restaurant_tables').update({ status: 'vacant' }).eq('id', currentTableId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      queryClient.invalidateQueries({ queryKey: ['table-orders'] });
      toast({ title: 'Table transferred' });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transfer from Table {currentTableNumber} <ArrowRight className="h-4 w-4" /> ?
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-auto">
          {tables.length === 0 ? (
            <p className="col-span-3 text-sm text-muted-foreground text-center py-4">No vacant tables</p>
          ) : tables.map((t) => (
            <Button
              key={t.id}
              variant={selectedTable === t.id ? 'default' : 'outline'}
              className="flex flex-col h-auto py-3"
              onClick={() => setSelectedTable(t.id)}
            >
              <span className="font-bold font-mono">{t.table_number}</span>
              <span className="text-[10px] text-muted-foreground">{t.section}</span>
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => transfer.mutate()} disabled={!selectedTable || transfer.isPending}>
            {transfer.isPending ? 'Transferring...' : 'Transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TableTransferDialog;
