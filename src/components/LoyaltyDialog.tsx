import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Star, Trophy, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LoyaltyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerPhone: string;
  orderTotal: number;
  onRedeemPoints: (points: number, discountAmount: number) => void;
}

const POINTS_PER_RUPEE = 1; // 1 point per ₹1 spent
const RUPEES_PER_POINT = 0.25; // 1 point = ₹0.25 discount

const LoyaltyDialog: React.FC<LoyaltyDialogProps> = ({
  open, onOpenChange, customerPhone, orderTotal, onRedeemPoints,
}) => {
  const [redeemAmount, setRedeemAmount] = useState('');

  const { data: loyalty, isLoading } = useQuery({
    queryKey: ['loyalty', customerPhone],
    queryFn: async () => {
      if (!customerPhone) return null;
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('customer_phone', customerPhone)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open && !!customerPhone,
  });

  const availablePoints = loyalty ? loyalty.total_points - loyalty.redeemed_points : 0;
  const pointsToEarn = Math.floor(orderTotal * POINTS_PER_RUPEE);
  const maxRedeemable = Math.min(availablePoints, Math.floor(orderTotal / RUPEES_PER_POINT));
  const redeemPoints = Math.min(parseInt(redeemAmount) || 0, maxRedeemable);
  const discountFromPoints = redeemPoints * RUPEES_PER_POINT;

  const handleRedeem = () => {
    onRedeemPoints(redeemPoints, discountFromPoints);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" /> Loyalty Points
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !customerPhone ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add customer phone number to use loyalty points.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Current balance */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available Points</span>
                <Badge variant="default" className="gap-1 text-base px-3 py-1">
                  <Star className="h-3 w-3" /> {availablePoints}
                </Badge>
              </div>
              {loyalty && (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total Visits</span>
                    <span className="font-mono">{loyalty.total_visits}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total Spent</span>
                    <span className="font-mono">₹{Number(loyalty.total_spent).toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
              {!loyalty && (
                <p className="text-xs text-muted-foreground">New customer — first visit!</p>
              )}
            </div>

            <Separator />

            {/* Points to earn */}
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div>
                <p className="text-sm font-medium">Points to Earn</p>
                <p className="text-xs text-muted-foreground">₹{orderTotal.toFixed(0)} × {POINTS_PER_RUPEE} pt/₹</p>
              </div>
              <Badge variant="secondary" className="gap-1 text-lg">
                <Trophy className="h-4 w-4" /> +{pointsToEarn}
              </Badge>
            </div>

            {/* Redeem */}
            {availablePoints > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Redeem Points (max {maxRedeemable})</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    min="0"
                    max={maxRedeemable}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={() => setRedeemAmount(String(maxRedeemable))}>
                    Max
                  </Button>
                </div>
                {redeemPoints > 0 && (
                  <p className="text-sm text-primary font-medium">
                    Discount: ₹{discountFromPoints.toFixed(2)} ({redeemPoints} pts × ₹{RUPEES_PER_POINT})
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {availablePoints > 0 && redeemPoints > 0 && (
            <Button onClick={handleRedeem}>
              Redeem {redeemPoints} pts (−₹{discountFromPoints.toFixed(2)})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoyaltyDialog;
