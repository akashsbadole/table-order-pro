import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, FileSpreadsheet, Package, Users, ShoppingCart } from 'lucide-react';
import { exportToCSV, exportToJSON, parseCSV, readFileAsText } from '@/lib/exportImport';
import { useToast } from '@/hooks/use-toast';

const ExportImport = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importTarget, setImportTarget] = useState<string>('');

  const { data: menuItems = [] } = useQuery({
    queryKey: ['export-menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('menu_items').select('name, price, gst_rate, is_veg, is_available, description');
      if (error) throw error;
      return data;
    },
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['export-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_items').select('name, current_stock, unit, cost_per_unit, low_stock_threshold');
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['export-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('order_number, order_type, status, subtotal, cgst_amount, sgst_amount, total_amount, customer_name, customer_phone, created_at').order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });

  const handleExport = (type: string, format: 'csv' | 'json') => {
    const exportFn = format === 'csv' ? exportToCSV : exportToJSON;
    switch (type) {
      case 'menu':
        exportFn(menuItems, 'menu_items', format === 'csv' ? [
          { key: 'name', label: 'Name' }, { key: 'price', label: 'Price (₹)' },
          { key: 'gst_rate', label: 'GST Rate %' }, { key: 'is_veg', label: 'Vegetarian' },
          { key: 'is_available', label: 'Available' }, { key: 'description', label: 'Description' },
        ] : undefined);
        break;
      case 'inventory':
        exportFn(inventory, 'inventory', format === 'csv' ? [
          { key: 'name', label: 'Name' }, { key: 'current_stock', label: 'Stock' },
          { key: 'unit', label: 'Unit' }, { key: 'cost_per_unit', label: 'Cost/Unit (₹)' },
          { key: 'low_stock_threshold', label: 'Low Stock Threshold' },
        ] : undefined);
        break;
      case 'orders':
        exportFn(orders, 'orders', format === 'csv' ? [
          { key: 'order_number', label: 'Order #' }, { key: 'order_type', label: 'Type' },
          { key: 'status', label: 'Status' }, { key: 'subtotal', label: 'Subtotal (₹)' },
          { key: 'cgst_amount', label: 'CGST (₹)' }, { key: 'sgst_amount', label: 'SGST (₹)' },
          { key: 'total_amount', label: 'Total (₹)' }, { key: 'customer_name', label: 'Customer' },
          { key: 'customer_phone', label: 'Phone' }, { key: 'created_at', label: 'Date' },
        ] : undefined);
        break;
    }
    toast({ title: 'Export complete', description: `${type} exported as ${format.toUpperCase()}` });
  };

  const handleImportClick = (target: string) => {
    setImportTarget(target);
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.organization_id) return;

    try {
      const text = await readFileAsText(file);
      const rows = parseCSV(text);
      if (rows.length === 0) throw new Error('No data found in CSV');

      switch (importTarget) {
        case 'menu': {
          const items = rows.map((r) => ({
            name: r['Name'] || r['name'],
            price: parseFloat(r['Price (₹)'] || r['price'] || '0'),
            gst_rate: parseFloat(r['GST Rate %'] || r['gst_rate'] || '5'),
            is_veg: (r['Vegetarian'] || r['is_veg'] || 'true').toLowerCase() === 'true',
            is_available: (r['Available'] || r['is_available'] || 'true').toLowerCase() === 'true',
            description: r['Description'] || r['description'] || null,
            organization_id: profile.organization_id!,
          }));
          const { error } = await supabase.from('menu_items').insert(items);
          if (error) throw error;
          break;
        }
        case 'inventory': {
          const items = rows.map((r) => ({
            name: r['Name'] || r['name'],
            current_stock: parseFloat(r['Stock'] || r['current_stock'] || '0'),
            unit: r['Unit'] || r['unit'] || 'kg',
            cost_per_unit: parseFloat(r['Cost/Unit (₹)'] || r['cost_per_unit'] || '0'),
            low_stock_threshold: parseFloat(r['Low Stock Threshold'] || r['low_stock_threshold'] || '10'),
            organization_id: profile.organization_id!,
          }));
          const { error } = await supabase.from('inventory_items').insert(items);
          if (error) throw error;
          break;
        }
      }
      toast({ title: 'Import complete', description: `${rows.length} records imported` });
    } catch (err: any) {
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    }
    e.target.value = '';
  };

  const sections = [
    { key: 'menu', label: 'Menu Items', icon: FileSpreadsheet, count: menuItems.length, importable: true },
    { key: 'inventory', label: 'Inventory', icon: Package, count: inventory.length, importable: true },
    { key: 'orders', label: 'Orders', icon: ShoppingCart, count: orders.length, importable: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Export & Import</h1>
        <p className="text-sm text-muted-foreground">Manage your data with CSV and JSON exports</p>
      </div>

      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileImport} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Card key={section.key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <section.icon className="h-5 w-5 text-primary" />
                {section.label}
                <Badge variant="secondary" className="ml-auto">{section.count} records</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleExport(section.key, 'csv')}>
                  <Download className="h-3 w-3" /> CSV
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleExport(section.key, 'json')}>
                  <Download className="h-3 w-3" /> JSON
                </Button>
              </div>
              {section.importable && (
                <Button variant="secondary" size="sm" className="w-full gap-1" onClick={() => handleImportClick(section.key)}>
                  <Upload className="h-3 w-3" /> Import CSV
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExportImport;
