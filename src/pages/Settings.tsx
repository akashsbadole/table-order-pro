import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const SettingsPage = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your restaurant configuration</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Manage restaurant name, GSTIN, address, and branding.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Staff Management</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add users, assign roles, and manage permissions.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tax Configuration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Configure GST rates, GSTIN, and tax settings.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audit Logs</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            View all system activity including voids, discounts, and role changes.
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
