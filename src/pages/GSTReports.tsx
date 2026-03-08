import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, Download, IndianRupee, Loader2, Calendar } from 'lucide-react';

const GSTReports = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const startDate = `${month}-01`;
  const endDate = (() => {
    const [y, m] = month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return `${month}-${String(last).padStart(2, '0')}`;
  })();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['gst-report', month, profile?.organization_id],
    enabled: !!profile?.organization_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, created_at, subtotal, cgst_amount, sgst_amount, discount_amount, total_amount, status, order_type')
        .eq('organization_id', profile!.organization_id!)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .in('status', ['completed', 'served'])
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ['gst-report-items', month, profile?.organization_id],
    enabled: !!profile?.organization_id && orders.length > 0,
    queryFn: async () => {
      const orderIds = orders.map((o) => o.id);
      const { data, error } = await supabase
        .from('order_items')
        .select('order_id, item_name, quantity, unit_price, gst_rate')
        .in('order_id', orderIds);
      if (error) throw error;
      return data;
    },
  });

  // GST rate-wise summary
  const gstSummary = orderItems.reduce((acc, item) => {
    const rate = Number(item.gst_rate);
    if (!acc[rate]) acc[rate] = { taxableValue: 0, cgst: 0, sgst: 0, total: 0, count: 0 };
    const taxable = Number(item.unit_price) * item.quantity;
    const gst = (taxable * rate) / 100;
    acc[rate].taxableValue += taxable;
    acc[rate].cgst += gst / 2;
    acc[rate].sgst += gst / 2;
    acc[rate].total += taxable + gst;
    acc[rate].count += item.quantity;
    return acc;
  }, {} as Record<number, { taxableValue: number; cgst: number; sgst: number; total: number; count: number }>);

  const totalTaxable = Object.values(gstSummary).reduce((s, v) => s + v.taxableValue, 0);
  const totalCGST = Object.values(gstSummary).reduce((s, v) => s + v.cgst, 0);
  const totalSGST = Object.values(gstSummary).reduce((s, v) => s + v.sgst, 0);
  const totalGST = totalCGST + totalSGST;
  const grandTotal = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const totalDiscount = orders.reduce((s, o) => s + Number(o.discount_amount), 0);

  const exportCSV = () => {
    const rows = [
      ['GST Rate (%)', 'Taxable Value (₹)', 'CGST (₹)', 'SGST (₹)', 'Total Tax (₹)', 'Items Sold'],
      ...Object.entries(gstSummary).map(([rate, v]) => [
        rate, v.taxableValue.toFixed(2), v.cgst.toFixed(2), v.sgst.toFixed(2), (v.cgst + v.sgst).toFixed(2), v.count,
      ]),
      ['TOTAL', totalTaxable.toFixed(2), totalCGST.toFixed(2), totalSGST.toFixed(2), totalGST.toFixed(2), ''],
      [],
      ['Invoice-wise Summary'],
      ['Order #', 'Date', 'Type', 'Subtotal', 'Discount', 'CGST', 'SGST', 'Total'],
      ...orders.map((o) => [
        o.order_number, new Date(o.created_at).toLocaleDateString('en-IN'), o.order_type,
        Number(o.subtotal).toFixed(2), Number(o.discount_amount).toFixed(2),
        Number(o.cgst_amount).toFixed(2), Number(o.sgst_amount).toFixed(2), Number(o.total_amount).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST_Report_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            {t('gstReports.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('gstReports.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="pl-10 w-48" />
          </div>
          <Button onClick={exportCSV} disabled={orders.length === 0} className="gap-2">
            <Download className="h-4 w-4" /> {t('gstReports.exportCSV')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t('gstReports.totalInvoices')}</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t('gstReports.taxableValue')}</p>
            <p className="text-2xl font-bold font-mono">₹{totalTaxable.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t('gstReports.totalGST')}</p>
            <p className="text-2xl font-bold font-mono text-primary">₹{totalGST.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t('gstReports.grandTotal')}</p>
            <p className="text-2xl font-bold font-mono">₹{grandTotal.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* GST Rate-wise Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('gstReports.rateWise')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : Object.keys(gstSummary).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('gstReports.noData')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('gstReports.gstRate')}</TableHead>
                  <TableHead className="text-right">{t('gstReports.taxableValue')}</TableHead>
                  <TableHead className="text-right">CGST</TableHead>
                  <TableHead className="text-right">SGST</TableHead>
                  <TableHead className="text-right">{t('gstReports.totalTax')}</TableHead>
                  <TableHead className="text-right">{t('gstReports.itemsSold')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(gstSummary)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([rate, v]) => (
                    <TableRow key={rate}>
                      <TableCell><Badge variant="secondary">{rate}%</Badge></TableCell>
                      <TableCell className="text-right font-mono">₹{v.taxableValue.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">₹{v.cgst.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">₹{v.sgst.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">₹{(v.cgst + v.sgst).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{v.count}</TableCell>
                    </TableRow>
                  ))}
                <TableRow className="font-bold border-t-2">
                  <TableCell>{t('common.total')}</TableCell>
                  <TableCell className="text-right font-mono">₹{totalTaxable.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">₹{totalCGST.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">₹{totalSGST.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">₹{totalGST.toFixed(2)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice-wise Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('gstReports.invoiceWise')}</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('gstReports.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{t('gstReports.date')}</TableHead>
                    <TableHead>{t('gstReports.type')}</TableHead>
                    <TableHead className="text-right">{t('common.subtotal')}</TableHead>
                    <TableHead className="text-right">{t('common.discount')}</TableHead>
                    <TableHead className="text-right">CGST</TableHead>
                    <TableHead className="text-right">SGST</TableHead>
                    <TableHead className="text-right">{t('common.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">#{o.order_number}</TableCell>
                      <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{o.order_type.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="text-right font-mono text-sm">₹{Number(o.subtotal).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">{Number(o.discount_amount) > 0 ? `-₹${Number(o.discount_amount).toFixed(2)}` : '—'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">₹{Number(o.cgst_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">₹{Number(o.sgst_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">₹{Number(o.total_amount).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GSTReports;
