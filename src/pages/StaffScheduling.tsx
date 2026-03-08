import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, Plus, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Schedule {
  id: string;
  user_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  role: string;
  notes: string | null;
  profile?: { full_name: string };
}

const ROLES = ['admin', 'manager', 'cashier', 'waiter', 'kitchen_staff'];

const StaffScheduling = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({ user_id: '', shift_date: selectedDate, start_time: '09:00', end_time: '17:00', role: 'waiter', notes: '' });

  const { data: staffProfiles = [] } = useQuery({
    queryKey: ['staff-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, full_name').eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['staff-schedules', selectedDate],
    queryFn: async () => {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const { data, error } = await supabase
        .from('staff_schedules')
        .select('*')
        .gte('shift_date', weekStart.toISOString().slice(0, 10))
        .lte('shift_date', weekEnd.toISOString().slice(0, 10))
        .order('shift_date')
        .order('start_time');
      if (error) throw error;

      // Enrich with profile names
      return (data as any[]).map((s) => ({
        ...s,
        profile: staffProfiles.find((p) => p.user_id === s.user_id),
      }));
    },
    enabled: staffProfiles.length > 0,
  });

  const createSchedule = useMutation({
    mutationFn: async (schedule: typeof form) => {
      if (!profile?.organization_id) throw new Error('No organization');
      const { error } = await supabase.from('staff_schedules').insert({
        ...schedule,
        organization_id: profile.organization_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-schedules'] });
      setDialogOpen(false);
      toast({ title: 'Shift added' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff_schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-schedules'] });
      toast({ title: 'Shift removed' });
    },
  });

  // Group by date
  const groupedSchedules = schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    (acc[s.shift_date] = acc[s.shift_date] || []).push(s);
    return acc;
  }, {});

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - d.getDay() + i);
    return d.toISOString().slice(0, 10);
  });

  const roleColors: Record<string, string> = {
    admin: 'bg-destructive/10 text-destructive border-destructive/30',
    manager: 'bg-primary/10 text-primary border-primary/30',
    cashier: 'bg-success/10 text-success border-success/30',
    waiter: 'bg-warning/10 text-warning border-warning/30',
    kitchen_staff: 'bg-info/10 text-info border-info/30',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Scheduling</h1>
          <p className="text-sm text-muted-foreground">Manage shift assignments for the week</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button className="touch-target gap-2" onClick={() => { setForm({ ...form, shift_date: selectedDate }); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Shift
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const daySchedules = groupedSchedules[day] || [];
          const date = new Date(day + 'T00:00:00');
          const isToday = day === new Date().toISOString().slice(0, 10);

          return (
            <Card key={day} className={isToday ? 'border-primary' : ''}>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {daySchedules.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No shifts</p>
                ) : (
                  daySchedules.map((s) => (
                    <div key={s.id} className={`rounded-md border p-2 text-xs ${roleColors[s.role] || ''}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate">{s.profile?.full_name || 'Unknown'}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteSchedule.mutate(s.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}</span>
                      </div>
                      <Badge variant="outline" className="mt-1 text-[9px] capitalize">{s.role.replace('_', ' ')}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Shift Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger>
                <SelectContent>
                  {staffProfiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.shift_date} onChange={(e) => setForm({ ...form, shift_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">{r.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Cover for Rahul" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createSchedule.mutate(form)} disabled={!form.user_id || createSchedule.isPending}>
              {createSchedule.isPending ? 'Adding...' : 'Add Shift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffScheduling;
