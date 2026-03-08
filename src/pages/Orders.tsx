import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ShoppingCart, Minus, Trash2, IndianRupee, Loader2, Split } from 'lucide-react';
import { useMenuItems, useMenuCategories } from '@/hooks/useMenuItems';
import { useCreateOrder } from '@/hooks/useOrders';
import BillingDialog from '@/components/BillingDialog';
import SplitBillDialog from '@/components/SplitBillDialog';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const tableNumber = searchParams.get('table_number');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>(tableId ? 'dine_in' : 'dine_in');
  const [billingOpen, setBillingOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
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
      if (existing) return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), gstRate: Number(item.gst_rate), quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c)).filter((c) => c.quantity > 0));
  };

  const removeItem = (id: string) => setCart((prev) => prev.filter((c) => c.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gstAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity * item.gstRate) / 100, 0);
  const total = subtotal + gstAmount;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleKOT = () => {
    createOrder.mutate({ cart, orderType, tableId: tableId || undefined }, {
      onSuccess: () => {
        setCart([]);
        setCartOpen(false);
        if (tableId) setSearchParams({});
        toast({ title: 'KOT Sent', description: 'Order sent to kitchen.' });
      },
    });
  };

  const handleBillPay = (paymentMethod: 'cash' | 'card' | 'upi', discount: number) => {
    createOrder.mutate({ cart, orderType, tableId: tableId || undefined, paymentMethod, discountAmount: discount }, {
      onSuccess: () => {
        setCart([]);
        setBillingOpen(false);
        setCartOpen(false);
        if (tableId) setSearchParams({});
      },
    });
  };

  const isLoading = catsLoading || itemsLoading;

  const cartPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="flex items-center gap-2 text-lg font-semibold flex-wrap">
          <ShoppingCart className="h-5 w-5" /> Cart
          <Badge variant="secondary" className="capitalize">{orderType.replace('_', ' ')}</Badge>
          {tableNumber && <Badge variant="outline" className="text-xs">Table {tableNumber}</Badge>}
        </h3>
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setCartOpen(false)}>✕</Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {cart.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Tap items to add</div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">₹{item.price} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border p-4 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">₹{subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">GST</span><span className="font-mono">₹{gstAmount.toFixed(2)}</span></div>
        <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
          <span>Total</span>
          <span className="font-mono flex items-center gap-1"><IndianRupee className="h-4 w-4" />{total.toFixed(2)}</span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 touch-target" disabled={cart.length === 0 || createOrder.isPending} onClick={handleKOT}>{createOrder.isPending ? 'Sending...' : 'KOT'}</Button>
          <Button variant="secondary" className="touch-target gap-1" disabled={cart.length === 0} onClick={() => setSplitOpen(true)}>
            <Split className="h-3 w-3" />
          </Button>
          <Button className="flex-1 touch-target" disabled={cart.length === 0} onClick={() => setBillingOpen(true)}>Bill & Pay</Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex h-[calc(100vh-7rem)] gap-4">
        {/* Menu Grid */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search menu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {(['dine_in', 'takeaway', 'delivery'] as const).map((type) => (
                <Button key={type} variant={orderType === type ? 'default' : 'outline'} size="sm" onClick={() => setOrderType(type)} className="touch-target capitalize text-xs sm:text-sm">
                  {type.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button variant={!activeCategory ? 'default' : 'secondary'} size="sm" onClick={() => setActiveCategory(null)} className="touch-target shrink-0 text-xs">All</Button>
            {categories.map((cat) => (
              <Button key={cat.id} variant={activeCategory === cat.id ? 'default' : 'secondary'} size="sm" onClick={() => setActiveCategory(cat.id)} className="touch-target shrink-0 text-xs">{cat.name}</Button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filteredItems.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">No menu items found</div>
            ) : (
              <div className="pos-grid">
                {filteredItems.map((item) => (
                  <button key={item.id} onClick={() => addToCart(item)} className="flex flex-col items-start rounded-xl border border-border bg-card p-3 sm:p-4 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.98] touch-target">
                    <div className="mb-1.5 flex w-full items-start justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-card-foreground leading-tight">{item.name}</span>
                      <Badge variant={item.is_veg ? 'default' : 'destructive'} className="ml-1 shrink-0 text-[9px] sm:text-[10px] px-1 py-0">{item.is_veg ? 'V' : 'NV'}</Badge>
                    </div>
                    <span className="text-sm sm:text-base font-bold font-mono text-primary">₹{Number(item.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Cart */}
        <Card className="hidden lg:flex w-80 shrink-0 flex-col xl:w-96">
          {cartPanel}
        </Card>
      </div>

      {/* Mobile Cart FAB */}
      <div className="fixed bottom-4 right-4 lg:hidden z-40">
        <Button size="lg" className="h-14 w-14 rounded-full shadow-lg touch-target relative" onClick={() => setCartOpen(true)}>
          <ShoppingCart className="h-6 w-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">{cartCount}</span>
          )}
        </Button>
      </div>

      {/* Mobile Cart Sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl bg-card border-t border-border shadow-xl">
            {cartPanel}
          </div>
        </div>
      )}

      <BillingDialog open={billingOpen} onOpenChange={setBillingOpen} cart={cart} orderType={orderType} onConfirm={handleBillPay} loading={createOrder.isPending} />
    </>
  );
};

export default Orders;
