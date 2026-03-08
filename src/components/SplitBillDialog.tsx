import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Users, IndianRupee, Split } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  gstRate: number;
  quantity: number;
  notes: string;
}

interface SplitBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  total: number;
  onConfirmSplit: (splits: { amount: number; label: string }[]) => void;
}

const SplitBillDialog: React.FC<SplitBillDialogProps> = ({
  open, onOpenChange, cart, total, onConfirmSplit,
}) => {
  const [splitType, setSplitType] = useState<'equal' | 'item' | 'custom'>('equal');
  const [numPeople, setNumPeople] = useState(2);
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});
  const [customAmounts, setCustomAmounts] = useState<string[]>(['', '']);
  const [personCount, setPersonCount] = useState(2);

  // Equal split
  const equalAmount = total / numPeople;

  // Item-based split
  const toggleItemPerson = (itemId: string, person: string) => {
    setSelectedItems((prev) => {
      const current = prev[person] || [];
      if (current.includes(itemId)) {
        return { ...prev, [person]: current.filter((id) => id !== itemId) };
      }
      return { ...prev, [person]: [...current, itemId] };
    });
  };

  const getItemSplitAmounts = () => {
    const people = Array.from({ length: personCount }, (_, i) => `Person ${i + 1}`);
    return people.map((person) => {
      const items = selectedItems[person] || [];
      const amount = cart
        .filter((item) => items.includes(item.id))
        .reduce((sum, item) => sum + item.price * item.quantity * (1 + item.gstRate / 100), 0);
      return { label: person, amount: Math.round(amount * 100) / 100 };
    });
  };

  const handleConfirm = () => {
    let splits: { amount: number; label: string }[] = [];
    if (splitType === 'equal') {
      splits = Array.from({ length: numPeople }, (_, i) => ({
        label: `Person ${i + 1}`,
        amount: Math.round(equalAmount * 100) / 100,
      }));
    } else if (splitType === 'item') {
      splits = getItemSplitAmounts();
    } else {
      splits = customAmounts.map((amt, i) => ({
        label: `Person ${i + 1}`,
        amount: parseFloat(amt) || 0,
      }));
    }
    onConfirmSplit(splits);
  };

  const customTotal = customAmounts.reduce((s, a) => s + (parseFloat(a) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" /> Split Bill
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="font-mono text-sm">
            Total: ₹{total.toFixed(2)}
          </Badge>
        </div>

        <Tabs value={splitType} onValueChange={(v) => setSplitType(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="equal" className="flex-1">Equal Split</TabsTrigger>
            <TabsTrigger value="item" className="flex-1">By Item</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="equal" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Number of People</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setNumPeople(Math.max(2, numPeople - 1))} disabled={numPeople <= 2}>-</Button>
                <span className="text-2xl font-bold font-mono w-10 text-center">{numPeople}</span>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setNumPeople(numPeople + 1)}>+</Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              {Array.from({ length: numPeople }, (_, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                  <span className="text-sm flex items-center gap-2">
                    <Users className="h-3 w-3" /> Person {i + 1}
                  </span>
                  <span className="font-mono font-bold text-primary">₹{equalAmount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="item" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Number of People</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPersonCount(Math.max(2, personCount - 1))} disabled={personCount <= 2}>-</Button>
                <span className="text-lg font-bold font-mono w-10 text-center">{personCount}</span>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPersonCount(personCount + 1)}>+</Button>
              </div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: personCount }, (_, pi) => {
                const person = `Person ${pi + 1}`;
                const items = selectedItems[person] || [];
                return (
                  <div key={pi} className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-sm font-semibold">{person}</p>
                    {cart.map((item) => (
                      <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={items.includes(item.id)} onCheckedChange={() => toggleItemPerson(item.id, person)} />
                        <span className="flex-1">{item.name} ×{item.quantity}</span>
                        <span className="font-mono text-xs">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </label>
                    ))}
                    <div className="text-right text-xs font-mono text-primary font-bold">
                      ₹{cart.filter((item) => items.includes(item.id)).reduce((s, item) => s + item.price * item.quantity, 0).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Number of People</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => {
                  const n = Math.max(2, customAmounts.length - 1);
                  setCustomAmounts(customAmounts.slice(0, n));
                }} disabled={customAmounts.length <= 2}>-</Button>
                <span className="text-lg font-bold font-mono w-10 text-center">{customAmounts.length}</span>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCustomAmounts([...customAmounts, ''])}>+</Button>
              </div>
            </div>
            <div className="space-y-2">
              {customAmounts.map((amt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Label className="w-20 shrink-0 text-xs">Person {i + 1}</Label>
                  <div className="relative flex-1">
                    <IndianRupee className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <Input type="number" className="pl-7" value={amt} onChange={(e) => {
                      const updated = [...customAmounts];
                      updated[i] = e.target.value;
                      setCustomAmounts(updated);
                    }} placeholder="0.00" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Assigned</span>
              <span className={`font-mono font-bold ${Math.abs(customTotal - total) < 0.01 ? 'text-success' : 'text-destructive'}`}>
                ₹{customTotal.toFixed(2)} / ₹{total.toFixed(2)}
              </span>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm Split</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SplitBillDialog;
