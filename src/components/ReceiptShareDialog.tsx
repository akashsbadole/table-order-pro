import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReceiptShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: number;
  totalAmount: number;
  customerPhone?: string;
}

const ReceiptShareDialog = ({
  open, onOpenChange, orderId, orderNumber, totalAmount, customerPhone,
}: ReceiptShareDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [phone, setPhone] = useState(customerPhone || '');
  const [sending, setSending] = useState(false);

  const receiptUrl = `${window.location.origin}/receipt/${orderId}`;

  const shareWhatsApp = () => {
    const message = encodeURIComponent(
      `🧾 Receipt for Order #${orderNumber}\nTotal: ₹${Number(totalAmount).toFixed(2)}\nView: ${receiptUrl}`
    );
    const phoneNum = phone.replace(/\D/g, '');
    const waUrl = phoneNum
      ? `https://wa.me/${phoneNum.startsWith('91') ? phoneNum : '91' + phoneNum}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  };

  const sendSMS = async () => {
    if (!phone) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-receipt-sms', {
        body: { phone: phone.replace(/\D/g, ''), orderId, orderNumber, totalAmount, receiptUrl },
      });
      if (error) throw error;
      toast({ title: t('receipt.sent') });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: t('receipt.sendFailed'), description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('receipt.sendReceipt')} — #{orderNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('receipt.enterPhone')}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              type="tel"
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground text-xs mb-1">Receipt Link:</p>
            <p className="font-mono text-xs break-all text-primary">{receiptUrl}</p>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 gap-2" variant="outline" onClick={shareWhatsApp}>
              <MessageSquare className="h-4 w-4" />
              {t('receipt.shareWhatsApp')}
            </Button>
            <Button className="flex-1 gap-2" onClick={sendSMS} disabled={!phone || sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t('receipt.shareSMS')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptShareDialog;
