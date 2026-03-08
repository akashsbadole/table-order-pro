import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Plus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RestaurantTable {
  id: string;
  table_number: string;
  capacity: number;
  status: 'vacant' | 'occupied' | 'dirty';
  section: string | null;
  floor: string | null;
}

const statusConfig = {
  vacant: { label: 'Vacant', className: 'border-success bg-success/10 hover:bg-success/20' },
  occupied: { label: 'Occupied', className: 'border-occupied bg-occupied/10 hover:bg-occupied/20' },
  dirty: { label: 'Dirty', className: 'border-dirty bg-dirty/10 hover:bg-dirty/20' },
};

const Tables = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newTable, setNewTable] = useState({ table_number: '', capacity: '4', section: 'Main' });
  const [filterSection, setFilterSection] = useState<string | null>(null);

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['restaurant-tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number');
      if (error) throw error;
      return data as RestaurantTable[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'vacant' | 'occupied' | 'dirty' }) => {
      const { error } = await supabase.from('restaurant_tables').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] }),
  });

  const addTable = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error('No org');
      const { error } = await supabase.from('restaurant_tables').insert({
        table_number: newTable.table_number,
        capacity: parseInt(newTable.capacity),
        section: newTable.section,
        organization_id: profile.organization_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      setAddOpen(false);
      setNewTable({ table_number: '', capacity: '4', section: 'Main' });
      toast({ title: 'Table added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const nextStatus = (current: string) => {
    const cycle = { vacant: 'occupied', occupied: 'dirty', dirty: 'vacant' } as const;
    return cycle[current as keyof typeof cycle];
  };

  const sections = [...new Set(tables.map((t) => t.section).filter(Boolean))] as string[];
  const filteredTables = filterSection ? tables.filter((t) => t.section === filterSection) : tables;

  const summary = {
    total: tables.length,
    vacant: tables.filter((t) => t.status === 'vacant').length,
    occupied: tables.filter((t) => t.status === 'occupied').length,
    dirty: tables.filter((t) => t.status === 'dirty').length,
  };

  const qrUrl = qrTable ? `${window.location.origin}/menu?table=${qrTable.table_number}` : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Table Management</h1>
          <p className="text-sm text-muted-foreground">Tap a table to cycle status • Long-press for QR</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="border-success text-success">Vacant: {summary.vacant}</Badge>
          <Badge variant="outline" className="border-occupied text-occupied">Occupied: {summary.occupied}</Badge>
          <Badge variant="outline" className="border-dirty text-dirty">Dirty: {summary.dirty}</Badge>
          <Button size="sm" className="touch-target gap-1" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Table
          </Button>
        </div>
      </div>

      {/* Section filter */}
      {sections.length > 1 && (
        <div className="flex gap-2">
          <Button variant={!filterSection ? 'default' : 'secondary'} size="sm" onClick={() => setFilterSection(null)}>All</Button>
          {sections.map((s) => (
            <Button key={s} variant={filterSection === s ? 'default' : 'secondary'} size="sm" onClick={() => setFilterSection(s)}>{s}</Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filteredTables.map((table) => {
          const config = statusConfig[table.status];
          return (
            <Card
              key={table.id}
              className={cn('cursor-pointer border-2 transition-all active:scale-[0.97]', config.className)}
              onClick={() => updateStatus.mutate({ id: table.id, status: nextStatus(table.status) })}
              onContextMenu={(e) => { e.preventDefault(); setQrTable(table); }}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <span className="text-2xl font-bold font-mono">{table.table_number}</span>
                <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Users className="h-3 w-3" />{table.capacity}
                </span>
                {table.section && <span className="text-[10px] text-muted-foreground">{table.section}</span>}
                <Badge variant="secondary" className="mt-2 text-[10px]">{config.label}</Badge>
                <Button
                  variant="ghost" size="icon" className="mt-1 h-6 w-6"
                  onClick={(e) => { e.stopPropagation(); setQrTable(table); }}
                >
                  <QrCode className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={!!qrTable} onOpenChange={() => setQrTable(null)}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>QR Code — Table {qrTable?.table_number}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <QRCodeSVG value={qrUrl} size={200} level="H" includeMargin />
            </div>
            <p className="text-xs text-muted-foreground break-all">{qrUrl}</p>
            <Button variant="outline" size="sm" onClick={() => {
              const svg = document.querySelector('.qr-dialog svg');
              if (!svg) return;
              const svgData = new XMLSerializer().serializeToString(svg);
              const blob = new Blob([svgData], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `table_${qrTable?.table_number}_qr.svg`; a.click();
              URL.revokeObjectURL(url);
            }}>
              Download QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Table Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Table</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Table Number</Label>
              <Input value={newTable.table_number} onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })} placeholder="e.g. T9" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" value={newTable.capacity} onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input value={newTable.section} onChange={(e) => setNewTable({ ...newTable, section: e.target.value })} placeholder="Main" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addTable.mutate()} disabled={!newTable.table_number || addTable.isPending}>Add</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tables;
