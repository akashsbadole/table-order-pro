import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Save, Building2, Receipt, CreditCard } from 'lucide-react';

const SettingsPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const [form, setForm] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (org) {
      setForm({
        name: org.name || '',
        address: org.address || '',
        phone: org.phone || '',
        email: org.email || '',
        gstin: org.gstin || '',
        tax_type: (org as any).tax_type || 'gst',
        vat_rate: String((org as any).vat_rate || 0),
        upi_id: (org as any).upi_id || '',
      });
    }
  }, [org]);

  const updateOrg = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) throw new Error('No org');
      const { error } = await supabase.from('organizations').update({
        name: form.name,
        address: form.address,
        phone: form.phone,
        email: form.email,
        gstin: form.gstin,
        tax_type: form.tax_type,
        vat_rate: parseFloat(form.vat_rate) || 0,
        upi_id: form.upi_id,
      } as any).eq('id', profile.organization_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast({ title: 'Settings saved' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your restaurant configuration</p>
      </div>

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-primary" /> Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Restaurant Name</Label>
              <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {/* Tax Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-5 w-5 text-primary" /> Tax Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax System</Label>
              <Select value={form.tax_type || 'gst'} onValueChange={(v) => setForm({ ...form, tax_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gst">GST (CGST + SGST)</SelectItem>
                  <SelectItem value="vat">VAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.tax_type === 'gst' ? (
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input value={form.gstin || ''} onChange={(e) => setForm({ ...form, gstin: e.target.value })} placeholder="29ABCDE1234F1Z5" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>VAT Rate (%)</Label>
                <Input type="number" value={form.vat_rate || '0'} onChange={(e) => setForm({ ...form, vat_rate: e.target.value })} />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {form.tax_type === 'gst'
              ? 'GST rates are set per menu item. CGST and SGST are split 50/50.'
              : `VAT at ${form.vat_rate || 0}% will be applied on all items.`}
          </p>
        </CardContent>
      </Card>

      {/* UPI / Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-primary" /> Payment Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>UPI ID (for QR code payments)</Label>
            <Input value={form.upi_id || ''} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} placeholder="restaurant@upi" />
            <p className="text-xs text-muted-foreground">When set, a UPI QR code will be shown during billing for easy payment.</p>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full touch-target gap-2" onClick={() => updateOrg.mutate()} disabled={updateOrg.isPending}>
        <Save className="h-4 w-4" />
        {updateOrg.isPending ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
};

export default SettingsPage;
