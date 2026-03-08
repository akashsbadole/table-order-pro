import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Users, AlertTriangle, CheckCircle, Clock, Search, Settings2 } from 'lucide-react';
import SubscriptionPlanManager from '@/components/SubscriptionPlanManager';

interface SubRecord {
  id: string;
  organization_id: string;
  org_name: string;
  status: string;
  billing_cycle: string;
  trial_ends_at: string;
  current_period_end: string | null;
  plan_name: string | null;
}

const SubscriptionAdmin = () => {
  const [subs, setSubs] = useState<SubRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, organizations(name), subscription_plans(name)');

      if (data) {
        setSubs(
          data.map((s: any) => ({
            id: s.id,
            organization_id: s.organization_id,
            org_name: s.organizations?.name ?? 'Unknown',
            status: s.status,
            billing_cycle: s.billing_cycle,
            trial_ends_at: s.trial_ends_at,
            current_period_end: s.current_period_end,
            plan_name: s.subscription_plans?.name ?? null,
          }))
        );
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const now = new Date();

  const activeCount = subs.filter((s) => s.status === 'active').length;
  const trialingCount = subs.filter((s) => s.status === 'trialing').length;
  const expiredCount = subs.filter(
    (s) => s.status === 'trialing' && new Date(s.trial_ends_at) < now
  ).length;
  const expiringIn7 = subs.filter((s) => {
    if (s.status === 'trialing') {
      const end = new Date(s.trial_ends_at);
      return end > now && end.getTime() - now.getTime() < 7 * 86400000;
    }
    if (s.status === 'active' && s.current_period_end) {
      const end = new Date(s.current_period_end);
      return end > now && end.getTime() - now.getTime() < 7 * 86400000;
    }
    return false;
  }).length;

  const filtered = subs.filter(
    (s) =>
      s.org_name.toLowerCase().includes(search.toLowerCase()) ||
      s.status.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (sub: SubRecord) => {
    if (sub.status === 'active') {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Active</Badge>;
    }
    if (sub.status === 'trialing') {
      const end = new Date(sub.trial_ends_at);
      if (end < now) {
        return <Badge variant="destructive">Expired</Badge>;
      }
      const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
          Trial ({days}d left)
        </Badge>
      );
    }
    if (sub.status === 'cancelled') {
      return <Badge variant="secondary">Cancelled</Badge>;
    }
    return <Badge variant="outline">{sub.status}</Badge>;
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Subscription Management</h1>
        <p className="text-muted-foreground">Monitor all organization subscriptions, trials, and expiries.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orgs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{subs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Trial</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{trialingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring in 7 days</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{expiringIn7}</div>
            {expiredCount > 0 && (
              <p className="text-xs text-destructive mt-1">{expiredCount} already expired</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" /> All Subscriptions
              </CardTitle>
              <CardDescription>{filtered.length} organizations</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search org or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Trial Ends</TableHead>
                <TableHead>Period Ends</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium text-foreground">{sub.org_name}</TableCell>
                    <TableCell>{getStatusBadge(sub)}</TableCell>
                    <TableCell className="text-muted-foreground">{sub.plan_name ?? 'No plan'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {sub.billing_cycle}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(sub.trial_ends_at)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(sub.current_period_end)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionAdmin;
