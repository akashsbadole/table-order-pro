import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const DEMO_INVENTORY = [
  { id: '1', name: 'Paneer', unit: 'kg', currentStock: 5.5, threshold: 3, costPerUnit: 320 },
  { id: '2', name: 'Chicken', unit: 'kg', currentStock: 2.0, threshold: 5, costPerUnit: 280 },
  { id: '3', name: 'Flour (Maida)', unit: 'kg', currentStock: 15, threshold: 10, costPerUnit: 45 },
  { id: '4', name: 'Butter', unit: 'kg', currentStock: 1.2, threshold: 2, costPerUnit: 520 },
  { id: '5', name: 'Rice (Basmati)', unit: 'kg', currentStock: 25, threshold: 10, costPerUnit: 120 },
  { id: '6', name: 'Cooking Oil', unit: 'L', currentStock: 8, threshold: 5, costPerUnit: 180 },
  { id: '7', name: 'Milk', unit: 'L', currentStock: 3, threshold: 5, costPerUnit: 60 },
  { id: '8', name: 'Onions', unit: 'kg', currentStock: 12, threshold: 8, costPerUnit: 40 },
  { id: '9', name: 'Tomatoes', unit: 'kg', currentStock: 6, threshold: 5, costPerUnit: 35 },
  { id: '10', name: 'Sugar', unit: 'kg', currentStock: 4, threshold: 3, costPerUnit: 50 },
];

const Inventory = () => {
  const [search, setSearch] = useState('');

  const filtered = DEMO_INVENTORY.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = DEMO_INVENTORY.filter((i) => i.currentStock <= i.threshold).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">Track raw materials and stock levels</p>
        </div>
        <div className="flex gap-2">
          {lowStockCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lowStockCount} Low Stock
            </Badge>
          )}
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const isLow = item.currentStock <= item.threshold;
          return (
            <Card key={item.id} className={isLow ? 'border-destructive' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{item.name}</CardTitle>
                  {isLow && (
                    <Badge variant="destructive" className="text-[10px]">
                      Low Stock
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono">{item.currentStock}</span>
                  <span className="text-sm text-muted-foreground">{item.unit}</span>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Threshold: {item.threshold} {item.unit}</span>
                  <span>₹{item.costPerUnit}/{item.unit}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Inventory;
