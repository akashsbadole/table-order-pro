import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IndianRupee, Printer, CreditCard, Banknote, Smartphone, Percent, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
  onConfirm: (paymentMethod: 'cash' | 'card' | 'upi', discount: number) => void;
  loading?: boolean;
  orderNumber?: number;
  taxType?: 'gst' | 'vat';
  vatRate?: number;
  upiId?: string;
}

const BillingDialog: React.FC<BillingDialogProps> = ({
  open, onOpenChange, cart, orderType, onConfirm, loading, orderNumber,
  taxType = 'gst', vatRate = 0, upiId,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discountType === 'percent'
    ? (subtotal * (parseFloat(discountValue) || 0)) / 100
    : parseFloat(discountValue) || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);

  // Tax calculation based on type
  let taxLabel1 = '', taxLabel2 = '', tax1 = 0, tax2 = 0, totalTax = 0;
  if (taxType === 'gst') {
    totalTax = cart.reduce((sum, item) => sum + (item.price * item.quantity * item.gstRate) / 100, 0);
    // Adjust tax proportionally if discount applied
    const taxRatio = subtotal > 0 ? afterDiscount / subtotal : 0;
    totalTax = totalTax * taxRatio;
    tax1 = totalTax / 2;
    tax2 = totalTax / 2;
    taxLabel1 = 'CGST (2.5%)';
    taxLabel2 = 'SGST (2.5%)';
  } else {
    totalTax = (afterDiscount * vatRate) / 100;
    tax1 = totalTax;
    tax2 = 0;
    taxLabel1 = `VAT (${vatRate}%)`;
    taxLabel2 = '';
  }

  const total = afterDiscount + totalTax;

  const upiPaymentString = upiId ? `upi://pay?pa=${upiId}&pn=Restaurant&am=${total.toFixed(2)}&cu=INR` : '';

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    const win = window.open('', '', 'width=300,height=700');
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Bill & Payment
          </DialogTitle>
        </DialogHeader>

        {/* Discount Section */}
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1"><Percent className="h-4 w-4" /> Discount</p>
          <div className="flex gap-2">
            <Select value={discountType} onValueChange={(v: 'percent' | 'flat') => setDiscountType(v)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percent %</SelectItem>
                <SelectItem value="flat">Flat ₹</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder={discountType === 'percent' ? '0-100' : '₹ amount'}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="flex-1"
              min="0"
            />
          </div>
        </div>

        {/* Receipt */}
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
            <Badge variant="outline" className="text-[10px] capitalize">{orderType.replace('_', ' ')}</Badge>
          </div>
          {orderNumber && <p className="text-xs font-mono text-muted-foreground">Order #{orderNumber}</p>}
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
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Discount {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
                <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{taxLabel1}</span>
              <span className="font-mono">₹{tax1.toFixed(2)}</span>
            </div>
            {taxLabel2 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{taxLabel2}</span>
                <span className="font-mono">₹{tax2.toFixed(2)}</span>
              </div>
            )}
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

        {/* UPI QR Code */}
        {paymentMethod === 'upi' && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium flex items-center gap-1"><QrCode className="h-4 w-4" /> Scan to Pay</p>
            <div className="bg-card rounded-lg p-3">
              <QRCodeSVG
                value={upiPaymentString || `upi://pay?pn=Restaurant&am=${total.toFixed(2)}&cu=INR`}
                size={160}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono">₹{total.toFixed(2)}</p>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" className="flex-1 touch-target gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button
            className="flex-1 touch-target"
            onClick={() => onConfirm(paymentMethod, discountAmount)}
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
