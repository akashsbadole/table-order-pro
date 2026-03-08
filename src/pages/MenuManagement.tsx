import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Edit2, Trash2, Loader2, UtensilsCrossed, FolderPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMenuItems, useMenuCategories } from '@/hooks/useMenuItems';

interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  gst_rate: string;
  is_veg: boolean;
  is_available: boolean;
  category_id: string;
}

const MenuManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');

  const defaultForm: MenuItemForm = { name: '', description: '', price: '', gst_rate: '5', is_veg: true, is_available: true, category_id: '' };
  const [form, setForm] = useState<MenuItemForm>(defaultForm);

  const { data: categories = [] } = useMenuCategories();
  // Fetch ALL items (not just available)
  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['menu-items-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, price, gst_rate, is_veg, is_available, category_id, description, image_url, sort_order')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const filtered = allItems.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || item.category_id === activeCategory;
    return matchSearch && matchCat;
  });

  const saveItem = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error('No organization');
      const payload = {
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        gst_rate: parseFloat(form.gst_rate) || 5,
        is_veg: form.is_veg,
        is_available: form.is_available,
        category_id: form.category_id || null,
        organization_id: profile.organization_id,
      };
      if (editId) {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('menu_items').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items-all'] });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      setItemDialogOpen(false);
      setEditId(null);
      toast({ title: editId ? 'Item updated' : 'Item added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items-all'] });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast({ title: 'Item deleted' });
    },
  });

  const saveCategory = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error('No organization');
      const { error } = await supabase.from('menu_categories').insert({
        name: catName,
        organization_id: profile.organization_id,
        sort_order: categories.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      setCatDialogOpen(false);
      setCatName('');
      toast({ title: 'Category added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const openAdd = () => {
    setEditId(null);
    setForm(defaultForm);
    setItemDialogOpen(true);
  };

  const openEdit = (item: typeof allItems[0]) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      gst_rate: String(item.gst_rate),
      is_veg: item.is_veg,
      is_available: item.is_available,
      category_id: item.category_id || '',
    });
    setItemDialogOpen(true);
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit, and manage menu items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatDialogOpen(true)} className="touch-target gap-1">
            <FolderPlus className="h-4 w-4" /> Add Category
          </Button>
          <Button onClick={openAdd} className="touch-target gap-1">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Button variant={!activeCategory ? 'default' : 'secondary'} size="sm" onClick={() => setActiveCategory(null)} className="shrink-0">All</Button>
          {categories.map((cat) => (
            <Button key={cat.id} variant={activeCategory === cat.id ? 'default' : 'secondary'} size="sm" onClick={() => setActiveCategory(cat.id)} className="shrink-0">{cat.name}</Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-muted-foreground">
            <UtensilsCrossed className="h-10 w-10 mb-2 opacity-30" />
            <p>No menu items found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <Card key={item.id} className={!item.is_available ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold">{item.name}</CardTitle>
                  <Badge variant={item.is_veg ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                    {item.is_veg ? 'VEG' : 'NON-VEG'}
                  </Badge>
                </div>
                {item.description && <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold font-mono text-primary">₹{Number(item.price)}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant={item.is_available ? 'secondary' : 'outline'} className="text-[10px]">
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem.mutate(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">GST: {Number(item.gst_rate)}%</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Menu Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Butter Chicken" />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Rich and creamy..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>GST Rate (%)</Label>
                <Input type="number" value={form.gst_rate} onChange={(e) => setForm({ ...form, gst_rate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_veg} onCheckedChange={(v) => setForm({ ...form, is_veg: v })} />
                <Label>Vegetarian</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} />
                <Label>Available</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveItem.mutate()} disabled={!form.name || !form.price || saveItem.isPending}>
              {saveItem.isPending ? 'Saving...' : editId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Category Name</Label>
            <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Starters" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveCategory.mutate()} disabled={!catName || saveCategory.isPending}>
              {saveCategory.isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagement;
