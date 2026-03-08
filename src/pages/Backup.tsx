import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Database, Download, RefreshCw, Clock, CheckCircle2 } from 'lucide-react';
import { exportToJSON } from '@/lib/exportImport';

interface BackupRecord {
  id: string;
  type: string;
  record_count: number;
  created_at: string;
}

const BACKUP_TABLES = [
  { key: 'menu_categories', label: 'Menu Categories', icon: '📂' },
  { key: 'menu_items', label: 'Menu Items', icon: '🍽️' },
  { key: 'inventory_items', label: 'Inventory', icon: '📦' },
  { key: 'restaurant_tables', label: 'Tables', icon: '🪑' },
  { key: 'orders', label: 'Orders', icon: '🧾' },
  { key: 'order_items', label: 'Order Items', icon: '📋' },
  { key: 'transactions', label: 'Transactions', icon: '💳' },
  { key: 'staff_schedules', label: 'Staff Schedules', icon: '📅' },
  { key: 'profiles', label: 'Staff Profiles', icon: '👤' },
];

const BackupPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [backingUp, setBackingUp] = useState(false);
  const [backupResults, setBackupResults] = useState<BackupRecord[]>([]);

  const handleFullBackup = async () => {
    if (!profile?.organization_id) return;
    setBackingUp(true);
    const results: BackupRecord[] = [];

    try {
      for (const table of BACKUP_TABLES) {
        let query = supabase.from(table.key as any).select('*');

        // Filter org-scoped tables
        if (!['order_items', 'profiles'].includes(table.key)) {
          query = query.eq('organization_id', profile.organization_id);
        }

        const { data, error } = await query;
        if (error) {
          console.error(`Backup error for ${table.key}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          exportToJSON(data, `backup_${table.key}`);
          results.push({
            id: table.key,
            type: table.label,
            record_count: data.length,
            created_at: new Date().toISOString(),
          });
        }
      }

      setBackupResults(results);
      toast({
        title: 'Backup Complete',
        description: `${results.length} tables exported as JSON files.`,
      });
    } catch (err: any) {
      toast({ title: 'Backup failed', description: err.message, variant: 'destructive' });
    } finally {
      setBackingUp(false);
    }
  };

  const handleSingleBackup = async (tableKey: string, label: string) => {
    if (!profile?.organization_id) return;

    try {
      let query = supabase.from(tableKey as any).select('*');
      if (!['order_items', 'profiles'].includes(tableKey)) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ title: 'No data', description: `${label} has no records to export.` });
        return;
      }

      exportToJSON(data, `backup_${tableKey}`);
      toast({ title: 'Exported', description: `${data.length} ${label} records downloaded.` });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Backup & Restore</h1>
          <p className="text-sm text-muted-foreground">Export your restaurant data for safekeeping</p>
        </div>
        <Button className="touch-target gap-2" onClick={handleFullBackup} disabled={backingUp}>
          {backingUp ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          {backingUp ? 'Backing up...' : 'Full Backup (All Tables)'}
        </Button>
      </div>

      {/* Individual table backups */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {BACKUP_TABLES.map((table) => (
          <Card key={table.key}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="text-2xl">{table.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{table.label}</p>
                <p className="text-xs text-muted-foreground">{table.key}</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => handleSingleBackup(table.key, table.label)}>
                <Download className="h-3 w-3" /> Export
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Backup results */}
      {backupResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Last Backup Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {backupResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm font-medium">{r.type}</span>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{r.record_count} records</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(r.created_at).toLocaleTimeString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BackupPage;
