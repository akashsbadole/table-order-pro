import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, AlertTriangle, Edit2, Trash2, Loader2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  low_stock_threshold: number;
  cost_per_unit: number;
}

const Inventory = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ name: '', unit: 'kg', current_stock: '0', low_stock_threshold: '10', cost_per_unit: '0' });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_items').select('*').order('name');
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error('No organization');
      const payload = {
        name: form.name,
        unit: form.unit,
        current_stock: parseFloat(form.current_stock) || 0,
        low_stock_threshold: parseFloat(form.low_stock_threshold) || 10,
        cost_per_unit: parseFloat(form.cost_per_unit) || 0,
        organization_id: profile.organization_id,
      };
      if (editItem) {
        const { error } = await supabase.from('inventory_items').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('inventory_items').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      closeDialog();
      toast({ title: editItem ? 'Item updated' : 'Item added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({ title: 'Item deleted' });
    },
  });

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', unit: 'kg', current_stock: '0', low_stock_threshold: '10', cost_per_unit: '0' });
    setDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      unit: item.unit,
      current_stock: String(item.current_stock),
      low_stock_threshold: String(item.low_stock_threshold),
      cost_per_unit: String(item.cost_per_unit),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditItem(null); };

  const filtered = items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  const lowStockCount = items.filter((i) => i.current_stock <= i.low_stock_threshold).length;

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">Track raw materials and stock levels</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {lowStockCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStockCount} Low Stock
            </Badge>
          )}
          <Button onClick={openAdd} className="touch-target gap-1">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-muted-foreground">
            <Package className="h-10 w-10 mb-2 opacity-30" />
            <p>No inventory items found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isLow = item.current_stock <= item.low_stock_threshold;
            return (
              <Card key={item.id} className={isLow ? 'border-destructive' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{item.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      {isLow && <Badge variant="destructive" className="text-[10px]">Low</Badge>}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono">{Number(item.current_stock)}</span>
                    <span className="text-sm text-muted-foreground">{item.unit}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Threshold: {Number(item.low_stock_threshold)} {item.unit}</span>
                    <span>₹{Number(item.cost_per_unit)}/{item.unit}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? 'Edit Item' : 'Add Inventory Item'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Paneer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg, L, pcs" />
              </div>
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Low Stock Threshold</Label>
                <Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Cost per Unit (₹)</Label>
                <Input type="number" value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : editItem ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
