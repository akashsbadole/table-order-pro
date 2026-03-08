import React, { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Pricing = () => {
  const { subscription, plans, loading, isActive, trialDaysLeft } = useSubscription();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const trialExpired = subscription?.status === 'trialing' && trialDaysLeft() === 0;
  const daysLeft = trialDaysLeft();

  const handleSubscribe = (planId: string) => {
    toast({
      title: 'Razorpay coming soon',
      description: 'Payment integration will be enabled shortly. Contact support for early access.',
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Crown className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {trialExpired ? 'Your Trial Has Expired' : 'Choose Your Plan'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {trialExpired
              ? 'Subscribe to continue using FoodPOS'
              : `You have ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your free trial`}
          </p>
        </div>

        {/* Trial Warning */}
        {trialExpired && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">
              Your 14-day free trial has ended. Please subscribe to regain access to your restaurant dashboard.
            </p>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              billingCycle === 'yearly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-[10px]">Save 17%</Badge>
          </button>
        </div>

        {/* Plans */}
        {plans.map((plan) => {
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          const period = billingCycle === 'monthly' ? '/mo' : '/yr';

          return (
            <Card key={plan.id} className="mb-4 border-primary/30 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Zap className="h-5 w-5 text-primary" />
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="mt-1">{plan.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-foreground">₹{price}</span>
                    <span className="text-sm text-muted-foreground">{period}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 grid grid-cols-2 gap-2">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscription?.status === 'active'}
                >
                  {subscription?.status === 'active' ? 'Current Plan' : 'Subscribe Now'}
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {/* Sign out */}
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
