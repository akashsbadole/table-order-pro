import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface ManageSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: SubRecord | null;
  onUpdated: () => void;
}

const ManageSubscriptionDialog: React.FC<ManageSubscriptionDialogProps> = ({
  open,
  onOpenChange,
  subscription,
  onUpdated,
}) => {
  const { toast } = useToast();
  const [action, setAction] = useState<'extend_trial' | 'activate' | 'cancel'>('extend_trial');
  const [extendDays, setExtendDays] = useState(14);
  const [periodDays, setPeriodDays] = useState(30);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && subscription) {
      setAction(subscription.status === 'trialing' ? 'extend_trial' : 'activate');
      setExtendDays(14);
      setPeriodDays(30);
    }
  }, [open, subscription]);

  if (!subscription) return null;

  const handleSave = async () => {
    setSaving(true);
    let updateData: Record<string, any> = {};

    if (action === 'extend_trial') {
      if (extendDays < 1 || extendDays > 365) {
        toast({ title: 'Invalid days', description: 'Enter between 1 and 365 days', variant: 'destructive' });
        setSaving(false);
        return;
      }
      const newEnd = new Date(subscription.trial_ends_at);
      // If trial already expired, extend from now
      if (newEnd < new Date()) {
        newEnd.setTime(Date.now());
      }
      newEnd.setDate(newEnd.getDate() + extendDays);
      updateData = {
        status: 'trialing',
        trial_ends_at: newEnd.toISOString(),
      };
    } else if (action === 'activate') {
      if (periodDays < 1 || periodDays > 365) {
        toast({ title: 'Invalid period', description: 'Enter between 1 and 365 days', variant: 'destructive' });
        setSaving(false);
        return;
      }
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + periodDays);
      updateData = {
        status: 'active',
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString(),
      };
    } else if (action === 'cancel') {
      updateData = { status: 'cancelled' };
    }

    const { error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription.id);

    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Subscription updated',
        description: `${subscription.org_name} subscription has been updated.`,
      });
      onUpdated();
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage: {subscription.org_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Status</span>
              <span className="font-medium text-foreground capitalize">{subscription.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trial Ends</span>
              <span className="font-medium text-foreground">
                {new Date(subscription.trial_ends_at).toLocaleDateString('en-IN')}
              </span>
            </div>
            {subscription.current_period_end && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period Ends</span>
                <span className="font-medium text-foreground">
                  {new Date(subscription.current_period_end).toLocaleDateString('en-IN')}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Action</Label>
            <Select value={action} onValueChange={(v) => setAction(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="extend_trial">Extend Trial</SelectItem>
                <SelectItem value="activate">Activate Subscription</SelectItem>
                <SelectItem value="cancel">Cancel Subscription</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === 'extend_trial' && (
            <div className="space-y-1.5">
              <Label>Extend by (days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Adds days to the current trial end date (or from now if expired).
              </p>
            </div>
          )}

          {action === 'activate' && (
            <div className="space-y-1.5">
              <Label>Subscription Period (days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={periodDays}
                onChange={(e) => setPeriodDays(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Sets status to active with a period starting today.
              </p>
            </div>
          )}

          {action === 'cancel' && (
            <p className="text-sm text-destructive">
              This will cancel the subscription. The organization will lose access.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            variant={action === 'cancel' ? 'destructive' : 'default'}
          >
            {saving ? 'Saving...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSubscriptionDialog;
