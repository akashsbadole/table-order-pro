import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2, UserCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'admin' | 'manager' | 'cashier' | 'waiter' | 'kitchen_staff';

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  is_active: boolean;
  roles: AppRole[];
}

const roleColors: Record<string, string> = {
  admin: 'destructive',
  manager: 'default',
  cashier: 'secondary',
  waiter: 'outline',
  kitchen_staff: 'outline',
};

const StaffManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('waiter');

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, is_active')
        .order('full_name');
      if (error) throw error;

      const userIds = profiles.map((p) => p.user_id);
      const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('user_id', userIds);

      return profiles.map((p) => ({
        ...p,
        roles: (roles || []).filter((r) => r.user_id === p.user_id).map((r) => r.role as AppRole),
      }));
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({ title: 'Staff status updated' });
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) throw error;
      await supabase.from('audit_logs').insert({
        organization_id: profile!.organization_id!,
        user_id: profile!.user_id,
        entity_type: 'user_role',
        action: 'role_added',
        details: { target_user: userId, role },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({ title: 'Role added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
      if (error) throw error;
      await supabase.from('audit_logs').insert({
        organization_id: profile!.organization_id!,
        user_id: profile!.user_id,
        entity_type: 'user_role',
        action: 'role_removed',
        details: { target_user: userId, role },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      toast({ title: 'Role removed' });
    },
  });

  const openEdit = (s: StaffMember) => {
    setSelectedStaff(s);
    setEditOpen(true);
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const allRoles: AppRole[] = ['admin', 'manager', 'cashier', 'waiter', 'kitchen_staff'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">Manage team members and their roles</p>
        </div>
        <Badge variant="secondary">{staff.length} members</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => (
          <Card key={member.id} className={!member.is_active ? 'opacity-50' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {member.full_name.charAt(0).toUpperCase()}
                  </div>
                  <CardTitle className="text-sm">{member.full_name}</CardTitle>
                </div>
                <Switch
                  checked={member.is_active}
                  onCheckedChange={(v) => toggleActive.mutate({ userId: member.user_id, isActive: v })}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 mb-3">
                {member.roles.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No roles assigned</span>
                ) : member.roles.map((role) => (
                  <Badge key={role} variant={roleColors[role] as any || 'secondary'} className="text-[10px] capitalize">
                    {role.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => openEdit(member)}>
                <Shield className="h-3 w-3" /> Manage Roles
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Management Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Roles — {selectedStaff?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {allRoles.map((role) => {
              const hasRole = selectedStaff?.roles.includes(role);
              return (
                <div key={role} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium capitalize">{role.replace('_', ' ')}</span>
                  <Switch
                    checked={hasRole}
                    onCheckedChange={(v) => {
                      if (!selectedStaff) return;
                      if (v) {
                        addRole.mutate({ userId: selectedStaff.user_id, role });
                      } else {
                        removeRole.mutate({ userId: selectedStaff.user_id, role });
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;
