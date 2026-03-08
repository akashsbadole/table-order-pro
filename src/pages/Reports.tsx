import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, BarChart3, Package, Users, Loader2, Calendar } from 'lucide-react';
import { exportToCSV } from '@/lib/exportImport';
import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);

  // Sales report
  const { data: salesData = [], isLoading: salesLoading } = useQuery({
    queryKey: ['report-sales', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('order_number, order_type, status, subtotal, cgst_amount, sgst_amount, discount_amount, total_amount, customer_name, customer_phone, created_at, created_by')
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Inventory report
  const { data: inventoryData = [], isLoading: invLoading } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('name, current_stock, unit, cost_per_unit, low_stock_threshold')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Staff schedules report
  const { data: staffData = [], isLoading: staffLoading } = useQuery({
    queryKey: ['report-staff', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_schedules')
        .select('shift_date, start_time, end_time, role, notes, user_id')
        .gte('shift_date', dateFrom)
        .lte('shift_date', dateTo)
        .order('shift_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Stats
  const completedSales = salesData.filter((o) => o.status === 'completed');
  const totalRevenue = completedSales.reduce((s, o) => s + Number(o.total_amount), 0);
  const totalTax = completedSales.reduce((s, o) => s + Number(o.cgst_amount) + Number(o.sgst_amount), 0);
  const totalDiscount = completedSales.reduce((s, o) => s + Number(o.discount_amount), 0);
  const lowStockItems = inventoryData.filter((i) => Number(i.current_stock) <= Number(i.low_stock_threshold));
  const inventoryValue = inventoryData.reduce((s, i) => s + Number(i.current_stock) * Number(i.cost_per_unit), 0);

  const exportSalesCSV = () => {
    exportToCSV(salesData, 'sales_report', [
      { key: 'order_number', label: 'Order #' },
      { key: 'order_type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'subtotal', label: 'Subtotal (₹)' },
      { key: 'cgst_amount', label: 'CGST (₹)' },
      { key: 'sgst_amount', label: 'SGST (₹)' },
      { key: 'discount_amount', label: 'Discount (₹)' },
      { key: 'total_amount', label: 'Total (₹)' },
      { key: 'customer_name', label: 'Customer' },
      { key: 'customer_phone', label: 'Phone' },
      { key: 'created_at', label: 'Date' },
    ]);
    toast({ title: 'Exported', description: 'Sales report CSV downloaded' });
  };

  const exportInventoryCSV = () => {
    exportToCSV(inventoryData, 'inventory_report', [
      { key: 'name', label: 'Item Name' },
      { key: 'current_stock', label: 'Current Stock' },
      { key: 'unit', label: 'Unit' },
      { key: 'cost_per_unit', label: 'Cost/Unit (₹)' },
      { key: 'low_stock_threshold', label: 'Low Stock Threshold' },
    ]);
    toast({ title: 'Exported', description: 'Inventory report CSV downloaded' });
  };

  const exportStaffCSV = () => {
    exportToCSV(staffData, 'staff_schedule_report', [
      { key: 'shift_date', label: 'Date' },
      { key: 'start_time', label: 'Start Time' },
      { key: 'end_time', label: 'End Time' },
      { key: 'role', label: 'Role' },
      { key: 'notes', label: 'Notes' },
      { key: 'user_id', label: 'Staff ID' },
    ]);
    toast({ title: 'Exported', description: 'Staff schedule CSV downloaded' });
  };

  const printReport = (title: string) => {
    const win = window.open('', '', 'width=800,height=600');
    if (!win) return;
    const content = document.getElementById('report-print-area');
    win.document.write(`
      <html><head><title>${title}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        h1 { font-size: 18px; }
        .meta { color: #666; margin-bottom: 10px; }
      </style></head><body>
      <h1>${title}</h1>
      <p class="meta">Period: ${dateFrom} to ${dateTo} | Generated: ${new Date().toLocaleString('en-IN')}</p>
      ${content?.innerHTML || ''}
      </body></html>
    `);
    win.document.close();
    win.print();
    win.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Download sales, inventory, and staff reports</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36 h-9 text-xs" />
            <span className="text-muted-foreground text-xs">to</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36 h-9 text-xs" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales" className="gap-1"><BarChart3 className="h-3 w-3" /> Sales</TabsTrigger>
          <TabsTrigger value="inventory" className="gap-1"><Package className="h-3 w-3" /> Inventory</TabsTrigger>
          <TabsTrigger value="staff" className="gap-1"><Users className="h-3 w-3" /> Staff</TabsTrigger>
        </TabsList>

        {/* SALES TAB */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold font-mono">{salesData.length}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold font-mono text-primary">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Tax Collected</p>
              <p className="text-2xl font-bold font-mono">₹{totalTax.toLocaleString('en-IN')}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Discounts</p>
              <p className="text-2xl font-bold font-mono text-destructive">₹{totalDiscount.toLocaleString('en-IN')}</p>
            </CardContent></Card>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={exportSalesCSV}>
              <Download className="h-3 w-3" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => printReport('Sales Report')}>
              <FileText className="h-3 w-3" /> Print / PDF
            </Button>
          </div>

          <div id="report-print-area">
            {salesLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <Card>
                <CardContent className="p-0 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Order #</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Subtotal</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Tax</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.slice(0, 100).map((o) => (
                        <tr key={o.order_number} className="border-b border-border/50">
                          <td className="px-3 py-2 font-mono">#{o.order_number}</td>
                          <td className="px-3 py-2 text-xs">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="px-3 py-2"><Badge variant="outline" className="text-[10px] capitalize">{o.order_type.replace('_', ' ')}</Badge></td>
                          <td className="px-3 py-2"><Badge variant={o.status === 'completed' ? 'default' : o.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-[10px]">{o.status}</Badge></td>
                          <td className="px-3 py-2 text-right font-mono">₹{Number(o.subtotal).toFixed(0)}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">₹{(Number(o.cgst_amount) + Number(o.sgst_amount)).toFixed(0)}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold">₹{Number(o.total_amount).toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {salesData.length > 100 && (
                    <p className="text-xs text-muted-foreground text-center py-2">Showing first 100 of {salesData.length} orders. Export CSV for full data.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* INVENTORY TAB */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold font-mono">{inventoryData.length}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold font-mono text-destructive">{lowStockItems.length}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Inventory Value</p>
              <p className="text-2xl font-bold font-mono text-primary">₹{inventoryValue.toLocaleString('en-IN')}</p>
            </CardContent></Card>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={exportInventoryCSV}>
              <Download className="h-3 w-3" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => printReport('Inventory Report')}>
              <FileText className="h-3 w-3" /> Print / PDF
            </Button>
          </div>

          <div id="report-print-area">
            {invLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <Card>
                <CardContent className="p-0 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Item</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Stock</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Unit</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Cost/Unit</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Value</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData.map((item) => {
                        const isLow = Number(item.current_stock) <= Number(item.low_stock_threshold);
                        return (
                          <tr key={item.name} className="border-b border-border/50">
                            <td className="px-3 py-2 font-medium">{item.name}</td>
                            <td className="px-3 py-2 text-right font-mono">{Number(item.current_stock)}</td>
                            <td className="px-3 py-2">{item.unit}</td>
                            <td className="px-3 py-2 text-right font-mono">₹{Number(item.cost_per_unit)}</td>
                            <td className="px-3 py-2 text-right font-mono">₹{(Number(item.current_stock) * Number(item.cost_per_unit)).toFixed(0)}</td>
                            <td className="px-3 py-2 text-center">
                              <Badge variant={isLow ? 'destructive' : 'default'} className="text-[10px]">
                                {isLow ? 'Low' : 'OK'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* STAFF TAB */}
        <TabsContent value="staff" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Total Shifts</p>
              <p className="text-2xl font-bold font-mono">{staffData.length}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">Unique Staff</p>
              <p className="text-2xl font-bold font-mono">{new Set(staffData.map((s) => s.user_id)).size}</p>
            </CardContent></Card>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={exportStaffCSV}>
              <Download className="h-3 w-3" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => printReport('Staff Schedule Report')}>
              <FileText className="h-3 w-3" /> Print / PDF
            </Button>
          </div>

          <div id="report-print-area">
            {staffLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : staffData.length === 0 ? (
              <Card><CardContent className="flex h-32 items-center justify-center text-muted-foreground">No staff schedules in this period</CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Start</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">End</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Role</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffData.slice(0, 100).map((s, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-3 py-2 font-mono text-xs">{s.shift_date}</td>
                          <td className="px-3 py-2 font-mono">{s.start_time}</td>
                          <td className="px-3 py-2 font-mono">{s.end_time}</td>
                          <td className="px-3 py-2"><Badge variant="outline" className="text-[10px] capitalize">{s.role}</Badge></td>
                          <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[200px]">{s.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
