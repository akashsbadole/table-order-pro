import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Zap, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
}

const SubscriptionPlanManager = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_monthly', { ascending: true });

    if (data) {
      setPlans(
        data.map((p: any) => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : [],
        }))
      );
    }
    if (error) {
      toast({ title: 'Error loading plans', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleToggle = async (planId: string, currentActive: boolean) => {
    setToggling(planId);
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: !currentActive })
      .eq('id', planId);

    if (error) {
      toast({ title: 'Failed to update plan', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: `Plan ${!currentActive ? 'enabled' : 'disabled'}`,
        description: `The plan has been ${!currentActive ? 'activated' : 'deactivated'} successfully.`,
      });
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, is_active: !currentActive } : p))
      );
    }
    setToggling(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No subscription plans found. Add plans from the database to manage them here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`transition-all ${plan.is_active ? 'border-primary/30' : 'opacity-60 border-muted'}`}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={`h-5 w-5 ${plan.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                <CardTitle className="text-lg">{plan.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? 'Active' : 'Disabled'}
                </Badge>
                <Switch
                  checked={plan.is_active}
                  onCheckedChange={() => handleToggle(plan.id, plan.is_active)}
                  disabled={toggling === plan.id}
                />
              </div>
            </div>
            {plan.description && (
              <CardDescription className="mt-1">{plan.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-baseline gap-4">
              <div>
                <span className="text-2xl font-bold text-foreground">₹{plan.price_monthly}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">₹{plan.price_yearly}</span>
                <span className="text-sm text-muted-foreground">/yr</span>
              </div>
            </div>
            {plan.features.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SubscriptionPlanManager;
