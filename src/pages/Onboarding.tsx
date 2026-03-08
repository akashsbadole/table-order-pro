import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UtensilsCrossed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Onboarding = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '', gstin: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    setLoading(true);
    try {
      // Update the auto-created organization with real details
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          name: form.name,
          address: form.address || null,
          phone: form.phone || null,
          gstin: form.gstin || null,
        })
        .eq('id', profile.organization_id!);

      if (orgError) throw orgError;

      toast({ title: 'Welcome!', description: 'Your restaurant is set up.' });
      // Force reload to refresh profile/roles
      window.location.href = '/orders';
    } catch (error: any) {
      toast({ title: 'Setup failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <UtensilsCrossed className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set Up Your Restaurant</h1>
          <p className="mt-1 text-sm text-muted-foreground">Let's get your POS system ready</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Restaurant Details</CardTitle>
            <CardDescription>You can update these later in Settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Restaurant Name *</Label>
                <Input id="org-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Restaurant" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-address">Address</Label>
                <Input id="org-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, City" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-phone">Phone</Label>
                <Input id="org-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-gstin">GSTIN</Label>
                <Input id="org-gstin" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} placeholder="22AAAAA0000A1Z5" maxLength={15} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
