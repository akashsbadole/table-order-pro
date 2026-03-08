import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryTableId: string;
  primaryTableNumber: string;
  orderId: string;
}

const MergeTablesDialog = ({ open, onOpenChange, primaryTableId, primaryTableNumber, orderId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  const { data: tables = [] } = useQuery({
    queryKey: ['vacant-tables-merge'],
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

  const toggleTable = (id: string) => {
    setSelectedTables((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const merge = useMutation({
    mutationFn: async () => {
      if (selectedTables.length === 0) throw new Error('Select tables to merge');
      // Mark all selected tables as occupied
      for (const tableId of selectedTables) {
        await supabase.from('restaurant_tables').update({ status: 'occupied' }).eq('id', tableId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast({ title: 'Tables merged', description: `${selectedTables.length + 1} tables now linked` });
      setSelectedTables([]);
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge with Table {primaryTableNumber}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Select vacant tables to merge (mark as occupied alongside the primary table).</p>
        <div className="grid grid-cols-3 gap-2 max-h-60 overflow-auto">
          {tables.length === 0 ? (
            <p className="col-span-3 text-sm text-muted-foreground text-center py-4">No vacant tables</p>
          ) : tables.map((t) => (
            <Button
              key={t.id}
              variant={selectedTables.includes(t.id) ? 'default' : 'outline'}
              className="flex flex-col h-auto py-3"
              onClick={() => toggleTable(t.id)}
            >
              <span className="font-bold font-mono">{t.table_number}</span>
              <span className="text-[10px] text-muted-foreground">{t.section}</span>
            </Button>
          ))}
        </div>
        {selectedTables.length > 0 && (
          <Badge variant="secondary">{selectedTables.length} table(s) selected</Badge>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => merge.mutate()} disabled={selectedTables.length === 0 || merge.isPending}>
            {merge.isPending ? 'Merging...' : 'Merge Tables'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MergeTablesDialog;
