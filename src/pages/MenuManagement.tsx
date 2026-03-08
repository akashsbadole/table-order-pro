import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit2 } from 'lucide-react';
import { useState } from 'react';

const DEMO_MENU = [
  { id: '1', name: 'Paneer Tikka', category: 'Starters', price: 280, gstRate: 5, isVeg: true, isAvailable: true },
  { id: '2', name: 'Chicken 65', category: 'Starters', price: 320, gstRate: 5, isVeg: false, isAvailable: true },
  { id: '3', name: 'Butter Chicken', category: 'Main Course', price: 380, gstRate: 5, isVeg: false, isAvailable: true },
  { id: '4', name: 'Dal Makhani', category: 'Main Course', price: 260, gstRate: 5, isVeg: true, isAvailable: true },
  { id: '5', name: 'Palak Paneer', category: 'Main Course', price: 280, gstRate: 5, isVeg: true, isAvailable: false },
  { id: '6', name: 'Butter Naan', category: 'Breads', price: 60, gstRate: 5, isVeg: true, isAvailable: true },
  { id: '7', name: 'Masala Chai', category: 'Beverages', price: 40, gstRate: 5, isVeg: true, isAvailable: true },
  { id: '8', name: 'Gulab Jamun', category: 'Desserts', price: 120, gstRate: 5, isVeg: true, isAvailable: true },
];

const MenuManagement = () => {
  const [search, setSearch] = useState('');

  const filtered = DEMO_MENU.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit, and manage menu items</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search menu..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item) => (
          <Card key={item.id} className={!item.isAvailable ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-semibold">{item.name}</CardTitle>
                <div className="flex gap-1">
                  <Badge variant={item.isVeg ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                    {item.isVeg ? 'VEG' : 'NON-VEG'}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{item.category}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold font-mono text-primary">₹{item.price}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={item.isAvailable ? 'secondary' : 'outline'} className="text-[10px]">
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">GST: {item.gstRate}%</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MenuManagement;
