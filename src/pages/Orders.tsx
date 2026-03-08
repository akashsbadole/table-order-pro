import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ShoppingCart, Minus, Trash2, IndianRupee, Loader2 } from 'lucide-react';
import { useMenuItems, useMenuCategories } from '@/hooks/useMenuItems';
import { useCreateOrder } from '@/hooks/useOrders';
import BillingDialog from '@/components/BillingDialog';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  gstRate: number;
  quantity: number;
  notes: string;
}

const Orders = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [billingOpen, setBillingOpen] = useState(false);
  const { toast } = useToast();

  const { data: categories = [], isLoading: catsLoading } = useMenuCategories();
  const { data: menuItems = [], isLoading: itemsLoading } = useMenuItems();
  const createOrder = useCreateOrder();

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !activeCategory || item.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (item: typeof menuItems[0]) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), gstRate: Number(item.gst_rate), quantity: 1, notes: '' }];
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

  const handleKOT = () => {
    createOrder.mutate(
      { cart, orderType },
      {
        onSuccess: () => {
          setCart([]);
          toast({ title: 'KOT Sent', description: 'Order sent to kitchen.' });
        },
      }
    );
  };

  const handleBillPay = (paymentMethod: 'cash' | 'card' | 'upi') => {
    createOrder.mutate(
      { cart, orderType, paymentMethod },
      {
        onSuccess: () => {
          setCart([]);
          setBillingOpen(false);
        },
      }
    );
  };

  const isLoading = catsLoading || itemsLoading;

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Menu Grid */}
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
          <Button
            variant={!activeCategory ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setActiveCategory(null)}
            className="touch-target shrink-0"
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className="touch-target shrink-0"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="pos-grid">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="flex flex-col items-start rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.98] touch-target"
                >
                  <div className="mb-2 flex w-full items-start justify-between">
                    <span className="text-sm font-semibold text-card-foreground leading-tight">{item.name}</span>
                    <Badge variant={item.is_veg ? 'default' : 'destructive'} className="ml-1 shrink-0 text-[10px] px-1.5 py-0">
                      {item.is_veg ? 'V' : 'NV'}
                    </Badge>
                  </div>
                  <span className="text-base font-bold font-mono text-primary">₹{Number(item.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
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
              <Button
                variant="outline"
                className="flex-1 touch-target"
                disabled={cart.length === 0 || createOrder.isPending}
                onClick={handleKOT}
              >
                {createOrder.isPending ? 'Sending...' : 'KOT'}
              </Button>
              <Button
                className="flex-1 touch-target"
                disabled={cart.length === 0}
                onClick={() => setBillingOpen(true)}
              >
                Bill & Pay
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <BillingDialog
        open={billingOpen}
        onOpenChange={setBillingOpen}
        cart={cart}
        orderType={orderType}
        onConfirm={handleBillPay}
        loading={createOrder.isPending}
      />
    </div>
  );
};

export default Orders;
