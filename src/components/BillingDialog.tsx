import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { IndianRupee, Printer, CreditCard, Banknote, Smartphone } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  gstRate: number;
  quantity: number;
  notes: string;
}

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  onConfirm: (paymentMethod: 'cash' | 'card' | 'upi') => void;
  loading?: boolean;
  orderNumber?: number;
}

const BillingDialog: React.FC<BillingDialogProps> = ({
  open, onOpenChange, cart, orderType, onConfirm, loading, orderNumber,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const receiptRef = useRef<HTMLDivElement>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gstAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity * item.gstRate) / 100, 0);
  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const total = subtotal + gstAmount;

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    const win = window.open('', '', 'width=300,height=600');
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 280px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; }
        .item-row { margin: 4px 0; }
        h2 { margin: 4px 0; font-size: 16px; }
        p { margin: 2px 0; }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
    win.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Bill & Payment
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Preview */}
        <div ref={receiptRef} className="rounded-lg border border-border bg-card p-4 space-y-3 text-sm">
          <div className="text-center">
            <h2 className="font-bold text-lg">Demo Restaurant</h2>
            <p className="text-xs text-muted-foreground">123 MG Road, Bengaluru</p>
            <p className="text-xs text-muted-foreground">GSTIN: 29ABCDE1234F1Z5</p>
            <p className="text-xs text-muted-foreground">Tel: +91 9876543210</p>
          </div>

          <Separator />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{new Date().toLocaleString('en-IN')}</span>
            <Badge variant="outline" className="text-[10px] capitalize">
              {orderType.replace('_', ' ')}
            </Badge>
          </div>
          {orderNumber && (
            <p className="text-xs font-mono text-muted-foreground">Order #{orderNumber}</p>
          )}

          <Separator />

          <div className="space-y-1">
            <div className="flex text-xs font-semibold text-muted-foreground">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-16 text-right">Amount</span>
            </div>
            {cart.map((item) => (
              <div key={item.id} className="flex text-sm">
                <span className="flex-1 truncate">{item.name}</span>
                <span className="w-8 text-center font-mono">{item.quantity}</span>
                <span className="w-16 text-right font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">CGST (2.5%)</span>
              <span className="font-mono">₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">SGST (2.5%)</span>
              <span className="font-mono">₹{sgst.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="font-mono">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-2">
            <p>Thank you for dining with us!</p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Payment Method</p>
          <div className="flex gap-2">
            {[
              { value: 'cash' as const, label: 'Cash', icon: Banknote },
              { value: 'card' as const, label: 'Card', icon: CreditCard },
              { value: 'upi' as const, label: 'UPI', icon: Smartphone },
            ].map((method) => (
              <Button
                key={method.value}
                variant={paymentMethod === method.value ? 'default' : 'outline'}
                className="flex-1 touch-target gap-2"
                onClick={() => setPaymentMethod(method.value)}
              >
                <method.icon className="h-4 w-4" />
                {method.label}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1 touch-target gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          <Button
            className="flex-1 touch-target"
            onClick={() => onConfirm(paymentMethod)}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BillingDialog;
