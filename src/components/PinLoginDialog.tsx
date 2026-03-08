import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2, Delete } from 'lucide-react';

interface PinLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PinLoginDialog: React.FC<PinLoginDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) setPin('');
  }, [open]);

  const handleDigit = (d: string) => {
    if (pin.length < 4) {
      const newPin = pin + d;
      setPin(newPin);
      if (newPin.length === 4) {
        handlePinSubmit(newPin);
      }
    }
  };

  const handleBackspace = () => setPin((p) => p.slice(0, -1));

  const handlePinSubmit = async (code: string) => {
    setLoading(true);
    try {
      // Find profile with this PIN
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, full_name, pin_code')
        .eq('pin_code', code)
        .eq('is_active', true);

      if (pErr) throw pErr;
      if (!profiles || profiles.length === 0) {
        toast({ title: 'Invalid PIN', description: 'No active staff found with this PIN.', variant: 'destructive' });
        setPin('');
        setLoading(false);
        return;
      }

      const profile = profiles[0];

      // We need to get the user's email to sign in. 
      // Since we can't access auth.users, we use an edge function approach.
      // For PIN login, we'll use a lookup: profiles have user_id, 
      // and we stored email in user metadata during signup.
      // Workaround: use the edge function to sign in by PIN
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('pin-login', {
        body: { pin_code: code },
      });

      if (fnErr || !fnData?.token) {
        toast({ title: 'PIN Login Failed', description: fnData?.error || 'Unable to authenticate with PIN.', variant: 'destructive' });
        setPin('');
        setLoading(false);
        return;
      }

      // Set the session from the custom token
      const { error: sessErr } = await supabase.auth.setSession({
        access_token: fnData.token.access_token,
        refresh_token: fnData.token.refresh_token,
      });

      if (sessErr) throw sessErr;

      toast({ title: 'Welcome back!', description: `Signed in as ${profile.full_name}` });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'PIN Login Failed', description: err.message, variant: 'destructive' });
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <KeyRound className="h-5 w-5" /> Quick PIN Login
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* PIN dots */}
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-4 w-4 rounded-full border-2 transition-all ${
                  i < pin.length
                    ? 'bg-primary border-primary scale-110'
                    : 'border-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <Button
                key={d}
                variant="outline"
                className="h-14 text-xl font-bold"
                disabled={loading}
                onClick={() => handleDigit(d)}
              >
                {d}
              </Button>
            ))}
            <div /> {/* empty space */}
            <Button
              variant="outline"
              className="h-14 text-xl font-bold"
              disabled={loading}
              onClick={() => handleDigit('0')}
            >
              0
            </Button>
            <Button
              variant="ghost"
              className="h-14"
              disabled={loading}
              onClick={handleBackspace}
            >
              <Delete className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Enter your 4-digit staff PIN
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PinLoginDialog;
