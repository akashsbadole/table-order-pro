import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, Search, Clock } from 'lucide-react';

const actionColors: Record<string, string> = {
  create: 'bg-success/10 text-success border-success/30',
  update: 'bg-info/10 text-info border-info/30',
  delete: 'bg-destructive/10 text-destructive border-destructive/30',
  void: 'bg-destructive/10 text-destructive border-destructive/30',
  cancel: 'bg-warning/10 text-warning border-warning/30',
  discount: 'bg-primary/10 text-primary border-primary/30',
  login: 'bg-muted text-muted-foreground border-border',
};

const AuditLogs = () => {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', entityFilter, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', `${dateFilter}T00:00:00`)
        .lte('created_at', `${dateFilter}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (entityFilter !== 'all') query = query.eq('entity_type', entityFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filtered = logs.filter((log) =>
    !search ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(search.toLowerCase()) ||
    (log.details as any)?.toString().toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6" /> Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">Track all system actions — voids, discounts, changes</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Entity Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="order">Orders</SelectItem>
            <SelectItem value="menu_item">Menu Items</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="table">Tables</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Badge variant="outline">{filtered.length} entries</Badge>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex h-48 flex-col items-center justify-center text-muted-foreground">
            <Shield className="h-10 w-10 mb-2 opacity-30" />
            <p>No audit logs found for this date/filter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => {
            const colorClass = actionColors[log.action] || 'bg-muted text-muted-foreground border-border';
            const details = log.details as Record<string, any> | null;
            return (
              <Card key={log.id} className="hover:border-primary/20 transition-colors">
                <CardContent className="flex items-start gap-3 p-3 sm:p-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] capitalize ${colorClass}`}>
                        {log.action}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {log.entity_type.replace('_', ' ')}
                      </Badge>
                      {log.entity_id && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ID: {log.entity_id.slice(0, 8)}…
                        </span>
                      )}
                    </div>
                    {details && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    {new Date(log.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
