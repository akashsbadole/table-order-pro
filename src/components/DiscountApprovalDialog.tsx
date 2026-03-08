import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface DiscountApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  onApproved: (discountAmount: number, discountReason: string) => void;
}

const DiscountApprovalDialog: React.FC<DiscountApprovalDialogProps> = ({
  open, onOpenChange, subtotal, onApproved,
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [reason, setReason] = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const discountAmount = discountType === 'percent'
    ? (subtotal * (parseFloat(discountValue) || 0)) / 100
    : parseFloat(discountValue) || 0;

  const handleApprove = async () => {
    if (!managerPin || managerPin.length < 4) {
      setError(t('discountApproval.pinRequired'));
      return;
    }
    if (!reason.trim()) {
      setError(t('discountApproval.reasonRequired'));
      return;
    }
    if (discountAmount <= 0) {
      setError(t('discountApproval.invalidAmount'));
      return;
    }

    setVerifying(true);
    setError('');

    try {
      // Verify PIN belongs to a manager or admin in the same org
      const { data: approver, error: pinError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .eq('organization_id', profile?.organization_id ?? '')
        .eq('pin_code', managerPin)
        .eq('is_active', true)
        .single();

      if (pinError || !approver) {
        setError(t('discountApproval.invalidPin'));
        setVerifying(false);
        return;
      }

      // Check if user has manager or admin role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', approver.user_id);

      const hasAuthority = roles?.some((r) => r.role === 'admin' || r.role === 'manager');
      if (!hasAuthority) {
        setError(t('discountApproval.notAuthorized'));
        setVerifying(false);
        return;
      }

      // Log the discount approval to audit
      await supabase.from('audit_logs').insert({
        organization_id: profile!.organization_id!,
        user_id: approver.user_id,
        entity_type: 'discount',
        action: 'discount_approved',
        details: {
          approved_by: approver.full_name,
          discount_type: discountType,
          discount_value: discountValue,
          discount_amount: discountAmount,
          reason,
          requested_by: profile?.full_name,
        },
      });

      toast({
        title: t('discountApproval.approved'),
        description: `${approver.full_name} ${t('discountApproval.approvedDiscount')} ₹${discountAmount.toFixed(2)}`,
      });

      onApproved(discountAmount, `${reason} (Approved by ${approver.full_name})`);
      // Reset
      setDiscountValue('');
      setReason('');
      setManagerPin('');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || t('discountApproval.error'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t('discountApproval.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Select value={discountType} onValueChange={(v: 'percent' | 'flat') => setDiscountType(v)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">%</SelectItem>
                <SelectItem value="flat">₹ Flat</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder={discountType === 'percent' ? '0-100' : '₹ amount'}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              min="0"
            />
          </div>

          {discountAmount > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('common.discount')}: <span className="font-mono font-semibold text-destructive">₹{discountAmount.toFixed(2)}</span> on ₹{subtotal.toFixed(2)}
            </p>
          )}

          <div>
            <Label>{t('discountApproval.reason')}</Label>
            <Textarea
              placeholder={t('discountApproval.reasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label>{t('discountApproval.managerPin')}</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              value={managerPin}
              onChange={(e) => { setManagerPin(e.target.value); setError(''); }}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleApprove} disabled={verifying} className="gap-2">
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            {verifying ? t('discountApproval.verifying') : t('discountApproval.approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountApprovalDialog;
