import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, ShoppingCart, Minus, Trash2, IndianRupee } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  gstRate: number;
  quantity: number;
  notes: string;
}

const DEMO_CATEGORIES = ['All', 'Starters', 'Main Course', 'Breads', 'Beverages', 'Desserts'];

const DEMO_ITEMS = [
  { id: '1', name: 'Paneer Tikka', price: 280, gstRate: 5, category: 'Starters', isVeg: true },
  { id: '2', name: 'Chicken 65', price: 320, gstRate: 5, category: 'Starters', isVeg: false },
  { id: '3', name: 'Butter Chicken', price: 380, gstRate: 5, category: 'Main Course', isVeg: false },
  { id: '4', name: 'Dal Makhani', price: 260, gstRate: 5, category: 'Main Course', isVeg: true },
  { id: '5', name: 'Palak Paneer', price: 280, gstRate: 5, category: 'Main Course', isVeg: true },
  { id: '6', name: 'Butter Naan', price: 60, gstRate: 5, category: 'Breads', isVeg: true },
  { id: '7', name: 'Garlic Naan', price: 70, gstRate: 5, category: 'Breads', isVeg: true },
  { id: '8', name: 'Masala Chai', price: 40, gstRate: 5, category: 'Beverages', isVeg: true },
  { id: '9', name: 'Lassi', price: 80, gstRate: 5, category: 'Beverages', isVeg: true },
  { id: '10', name: 'Gulab Jamun', price: 120, gstRate: 5, category: 'Desserts', isVeg: true },
  { id: '11', name: 'Biryani', price: 350, gstRate: 5, category: 'Main Course', isVeg: false },
  { id: '12', name: 'Tandoori Roti', price: 40, gstRate: 5, category: 'Breads', isVeg: true },
];

const Orders = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');

  const filteredItems = DEMO_ITEMS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: typeof DEMO_ITEMS[0]) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, gstRate: item.gstRate, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((c) => c.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gstAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity * item.gstRate) / 100, 0);
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const total = subtotal + gstAmount;

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Menu Grid - Left Side */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1">
            {(['dine_in', 'takeaway', 'delivery'] as const).map((type) => (
              <Button
                key={type}
                variant={orderType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType(type)}
                className="touch-target capitalize"
              >
                {type.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Category tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {DEMO_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="touch-target shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-auto">
          <div className="pos-grid">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="flex flex-col items-start rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.98] touch-target"
              >
                <div className="mb-2 flex w-full items-start justify-between">
                  <span className="text-sm font-semibold text-card-foreground leading-tight">{item.name}</span>
                  <Badge variant={item.isVeg ? 'default' : 'destructive'} className="ml-1 shrink-0 text-[10px] px-1.5 py-0">
                    {item.isVeg ? 'V' : 'NV'}
                  </Badge>
                </div>
                <span className="text-base font-bold font-mono text-primary">₹{item.price}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart - Right Side */}
      <Card className="flex w-80 shrink-0 flex-col lg:w-96">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5" />
            Current Order
            <Badge variant="secondary" className="ml-auto capitalize">
              {orderType.replace('_', ' ')}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          {/* Cart Items */}
          <div className="flex-1 overflow-auto px-6">
            {cart.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Tap items to add to order
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">₹{item.price} × {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-border p-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">CGST</span>
              <span className="font-mono">₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">SGST</span>
              <span className="font-mono">₹{sgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
              <span>Total</span>
              <span className="font-mono flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {total.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 touch-target" disabled={cart.length === 0}>
                KOT
              </Button>
              <Button className="flex-1 touch-target" disabled={cart.length === 0}>
                Bill & Pay
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
