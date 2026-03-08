import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Calendar, IndianRupee, Loader2, CheckCircle, Receipt } from 'lucide-react';

const EODSettlement = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [drawerOpening, setDrawerOpening] = useState('');
  const [drawerClosing, setDrawerClosing] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['eod-orders', date, profile?.organization_id],
    enabled: !!profile?.organization_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, order_type, subtotal, cgst_amount, sgst_amount, discount_amount, total_amount, created_at')
        .eq('organization_id', profile!.organization_id!)
        .gte('created_at', `${date}T00:00:00`)
        .lte('created_at', `${date}T23:59:59`)
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['eod-transactions', date, profile?.organization_id],
    enabled: !!profile?.organization_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, payment_method, amount, status, created_at')
        .eq('organization_id', profile!.organization_id!)
        .eq('status', 'completed')
        .gte('created_at', `${date}T00:00:00`)
        .lte('created_at', `${date}T23:59:59`);
      if (error) throw error;
      return data;
    },
  });

  const completedOrders = orders.filter((o) => ['completed', 'served'].includes(o.status));
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled');

  const totalSales = completedOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const totalSubtotal = completedOrders.reduce((s, o) => s + Number(o.subtotal), 0);
  const totalCGST = completedOrders.reduce((s, o) => s + Number(o.cgst_amount), 0);
  const totalSGST = completedOrders.reduce((s, o) => s + Number(o.sgst_amount), 0);
  const totalDiscount = completedOrders.reduce((s, o) => s + Number(o.discount_amount), 0);

  const paymentBreakdown = transactions.reduce((acc, tx) => {
    const method = tx.payment_method;
    acc[method] = (acc[method] || 0) + Number(tx.amount);
    return acc;
  }, {} as Record<string, number>);

  const cashSales = paymentBreakdown['cash'] || 0;
  const openingCash = parseFloat(drawerOpening) || 0;
  const closingCash = parseFloat(drawerClosing) || 0;
  const expectedCash = openingCash + cashSales;
  const cashDifference = closingCash - expectedCash;

  const orderTypeBreakdown = completedOrders.reduce((acc, o) => {
    acc[o.order_type] = (acc[o.order_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handlePrint = () => {
    const el = reportRef.current;
    if (!el) return;
    const win = window.open('', '', 'width=400,height=800');
    if (!win) return;
    win.document.write(`
      <html><head><title>Z-Report ${date}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 16px; max-width: 380px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        h2 { margin: 4px 0; font-size: 16px; }
        h3 { margin: 8px 0 4px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin: 4px 0; }
        td { padding: 2px 4px; font-size: 11px; }
        td:last-child { text-align: right; }
      </style></head><body>
      ${el.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
    win.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            {t('eod.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('eod.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> {t('eod.printZReport')}
          </Button>
        </div>
      </div>

      {/* Cash Drawer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('eod.cashDrawer')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>{t('eod.openingCash')}</Label>
              <Input type="number" placeholder="₹ 0.00" value={drawerOpening} onChange={(e) => setDrawerOpening(e.target.value)} />
            </div>
            <div>
              <Label>{t('eod.closingCash')}</Label>
              <Input type="number" placeholder="₹ 0.00" value={drawerClosing} onChange={(e) => setDrawerClosing(e.target.value)} />
            </div>
            <div className="flex flex-col justify-end">
              <Label className="text-muted-foreground">{t('eod.difference')}</Label>
              <p className={`text-2xl font-bold font-mono ${cashDifference === 0 ? 'text-green-600' : cashDifference > 0 ? 'text-blue-600' : 'text-destructive'}`}>
                {cashDifference >= 0 ? '+' : ''}₹{cashDifference.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{t('eod.totalOrders')}</p><p className="text-2xl font-bold">{completedOrders.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{t('eod.totalSales')}</p><p className="text-2xl font-bold font-mono">₹{totalSales.toFixed(0)}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{t('eod.totalTax')}</p><p className="text-2xl font-bold font-mono text-primary">₹{(totalCGST + totalSGST).toFixed(0)}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{t('eod.totalDiscount')}</p><p className="text-2xl font-bold font-mono text-destructive">₹{totalDiscount.toFixed(0)}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">{t('eod.cancelled')}</p><p className="text-2xl font-bold text-destructive">{cancelledOrders.length}</p></CardContent></Card>
      </div>

      {/* Printable Z-Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('eod.zReport')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={reportRef} className="rounded-lg border border-border bg-card p-6 space-y-4 font-mono text-sm max-w-md mx-auto">
            <div className="text-center">
              <h2 className="font-bold text-lg">Z-REPORT</h2>
              <p className="text-xs text-muted-foreground">End of Day Settlement</p>
              <p className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <Separator />

            <div className="space-y-1">
              <div className="flex justify-between"><span>Total Orders</span><span className="font-bold">{completedOrders.length}</span></div>
              <div className="flex justify-between"><span>Cancelled</span><span className="text-destructive">{cancelledOrders.length}</span></div>
            </div>
            <Separator />

            <div>
              <p className="font-bold mb-1">Order Types</p>
              {Object.entries(orderTypeBreakdown).map(([type, count]) => (
                <div key={type} className="flex justify-between text-xs">
                  <span className="capitalize">{type.replace('_', ' ')}</span><span>{count}</span>
                </div>
              ))}
            </div>
            <Separator />

            <div className="space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{totalSubtotal.toFixed(2)}</span></div>
              {totalDiscount > 0 && <div className="flex justify-between text-destructive"><span>Discounts</span><span>-₹{totalDiscount.toFixed(2)}</span></div>}
              <div className="flex justify-between"><span>CGST</span><span>₹{totalCGST.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>SGST</span><span>₹{totalSGST.toFixed(2)}</span></div>
              <Separator />
              <div className="flex justify-between text-lg font-bold"><span>NET SALES</span><span>₹{totalSales.toFixed(2)}</span></div>
            </div>
            <Separator />

            <div>
              <p className="font-bold mb-1">Payment Breakdown</p>
              {Object.entries(paymentBreakdown).map(([method, amount]) => (
                <div key={method} className="flex justify-between">
                  <span className="capitalize">{method}</span><span>₹{amount.toFixed(2)}</span>
                </div>
              ))}
              {Object.keys(paymentBreakdown).length === 0 && <p className="text-xs text-muted-foreground">No transactions</p>}
            </div>
            <Separator />

            <div className="space-y-1">
              <div className="flex justify-between"><span>Opening Cash</span><span>₹{openingCash.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Cash Sales</span><span>₹{cashSales.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold"><span>Expected in Drawer</span><span>₹{expectedCash.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Actual in Drawer</span><span>₹{closingCash.toFixed(2)}</span></div>
              <div className={`flex justify-between font-bold ${cashDifference === 0 ? '' : 'text-destructive'}`}>
                <span>Difference</span><span>{cashDifference >= 0 ? '+' : ''}₹{cashDifference.toFixed(2)}</span>
              </div>
            </div>
            <Separator />

            <div className="text-center text-xs text-muted-foreground">
              <p>Generated: {new Date().toLocaleString('en-IN')}</p>
              <p>— End of Z-Report —</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EODSettlement;
