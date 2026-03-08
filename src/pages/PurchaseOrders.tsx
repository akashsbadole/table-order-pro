import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Trash2, Package, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface POItem {
  inventory_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

const statusColors: Record<string, string> = {
  draft: 'secondary',
  ordered: 'default',
  received: 'outline',
};

const PurchaseOrders = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [poItems, setPoItems] = useState<POItem[]>([]);

  const { data: purchaseOrders = [], isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_items').select('id, name, unit, cost_per_unit').order('name');
      if (error) throw error;
      return data;
    },
  });

  const addItem = (itemId: string) => {
    const inv = inventoryItems.find((i) => i.id === itemId);
    if (!inv || poItems.find((p) => p.inventory_item_id === itemId)) return;
    setPoItems([...poItems, { inventory_item_id: itemId, item_name: inv.name, quantity: 1, unit_price: Number(inv.cost_per_unit) }]);
  };

  const updatePoItem = (idx: number, field: string, value: number) => {
    setPoItems((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const removePoItem = (idx: number) => setPoItems((prev) => prev.filter((_, i) => i !== idx));

  const createPO = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error('No org');
      const totalAmount = poItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
      const { data: po, error: poErr } = await supabase.from('purchase_orders').insert({
        organization_id: profile.organization_id,
        supplier_name: supplierName,
        notes,
        total_amount: totalAmount,
        created_by: profile.user_id,
      }).select().single();
      if (poErr) throw poErr;

      const items = poItems.map((i) => ({
        purchase_order_id: po.id,
        inventory_item_id: i.inventory_item_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
      }));
      const { error: itemsErr } = await supabase.from('purchase_order_items').insert(items);
      if (itemsErr) throw itemsErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast({ title: 'Purchase order created' });
      resetForm();
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', id);
      if (error) throw error;

      // If received, add stock
      if (status === 'received') {
        const { data: items } = await supabase.from('purchase_order_items').select('*').eq('purchase_order_id', id);
        for (const item of items || []) {
          await supabase.rpc('get_user_org_id', { _user_id: profile!.user_id }); // just to ensure auth
          const { data: inv } = await supabase.from('inventory_items').select('current_stock').eq('id', item.inventory_item_id).single();
          if (inv) {
            await supabase.from('inventory_items').update({
              current_stock: Number(inv.current_stock) + Number(item.quantity),
            }).eq('id', item.inventory_item_id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({ title: 'Status updated' });
    },
  });

  const resetForm = () => {
    setDialogOpen(false);
    setSupplierName('');
    setNotes('');
    setPoItems([]);
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Create and manage supplier purchase orders</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-1"><Plus className="h-4 w-4" /> New PO</Button>
      </div>

      {purchaseOrders.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-muted-foreground">
            <FileText className="h-10 w-10 mb-2 opacity-30" />
            <p>No purchase orders yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {purchaseOrders.map((po) => (
            <Card key={po.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{po.supplier_name}</CardTitle>
                  <Badge variant={statusColors[po.status] as any || 'secondary'} className="capitalize text-[10px]">{po.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold font-mono">₹{Number(po.total_amount).toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(po.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                {po.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{po.notes}</p>}
                <div className="flex gap-1 mt-3">
                  {po.status === 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: po.id, status: 'ordered' })}>Mark Ordered</Button>
                  )}
                  {po.status === 'ordered' && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: po.id, status: 'received' })}>Mark Received</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier Name</Label>
              <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="e.g. Metro Cash & Carry" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes" />
            </div>
            <div className="space-y-2">
              <Label>Add Items</Label>
              <Select onValueChange={addItem}>
                <SelectTrigger><SelectValue placeholder="Select inventory item..." /></SelectTrigger>
                <SelectContent>
                  {inventoryItems.filter((i) => !poItems.find((p) => p.inventory_item_id === i.id)).map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {poItems.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-auto">
                {poItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded bg-muted/50 p-2">
                    <span className="flex-1 text-sm font-medium truncate">{item.item_name}</span>
                    <Input type="number" className="w-20 h-8 text-xs" value={item.quantity} onChange={(e) => updatePoItem(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                    <Input type="number" className="w-24 h-8 text-xs" value={item.unit_price} onChange={(e) => updatePoItem(idx, 'unit_price', parseFloat(e.target.value) || 0)} placeholder="₹ price" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePoItem(idx)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                <div className="text-right text-sm font-bold font-mono">
                  Total: ₹{poItems.reduce((s, i) => s + i.quantity * i.unit_price, 0).toFixed(0)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={() => createPO.mutate()} disabled={!supplierName || poItems.length === 0 || createPO.isPending}>
              {createPO.isPending ? 'Creating...' : 'Create PO'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
