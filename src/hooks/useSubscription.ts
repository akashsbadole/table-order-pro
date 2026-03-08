import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Subscription {
  id: string;
  organization_id: string;
  plan_id: string | null;
  status: string;
  billing_cycle: string;
  trial_ends_at: string;
  current_period_start: string | null;
  current_period_end: string | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
}

export const useSubscription = () => {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const [subRes, planRes] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*')
          .eq('organization_id', profile.organization_id!)
          .single(),
        supabase.from('subscription_plans').select('*').eq('is_active', true),
      ]);

      if (subRes.data) setSubscription(subRes.data as unknown as Subscription);
      if (planRes.data) {
        setPlans(
          planRes.data.map((p: any) => ({
            ...p,
            features: Array.isArray(p.features) ? p.features : [],
          }))
        );
      }
      setLoading(false);
    };

    fetch();
  }, [profile?.organization_id]);

  const isActive = (): boolean => {
    if (!subscription) return false;
    if (subscription.status === 'active') return true;
    if (subscription.status === 'trialing') {
      return new Date(subscription.trial_ends_at) > new Date();
    }
    return false;
  };

  const trialDaysLeft = (): number => {
    if (!subscription || subscription.status !== 'trialing') return 0;
    const diff = new Date(subscription.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return { subscription, plans, loading, isActive, trialDaysLeft };
};
