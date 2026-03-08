import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, Shield, Users, CreditCard, ConciergeBell, ChefHat, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PinLoginDialog from '@/components/PinLoginDialog';

const DEMO_CREDENTIALS = [
  { email: 'admin@foodpos.in', password: 'admin123', role: 'Admin', icon: Shield, color: 'bg-destructive text-destructive-foreground', access: 'Full access' },
  { email: 'manager@foodpos.in', password: 'manager123', role: 'Manager', icon: Users, color: 'bg-primary text-primary-foreground', access: 'Dashboard, Orders, Tables, Kitchen, Inventory, Menu' },
  { email: 'cashier@foodpos.in', password: 'cashier123', role: 'Cashier', icon: CreditCard, color: 'bg-success text-success-foreground', access: 'Orders & Billing' },
  { email: 'waiter@foodpos.in', password: 'waiter123', role: 'Waiter', icon: ConciergeBell, color: 'bg-warning text-warning-foreground', access: 'Orders & Tables' },
  { email: 'kitchen@foodpos.in', password: 'kitchen123', role: 'Kitchen', icon: ChefHat, color: 'bg-info text-info-foreground', access: 'Kitchen Display' },
];

const Login = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', fullName: '' });
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(loginData.email, loginData.password);
      navigate('/orders');
    } catch (error: any) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/orders');
    } catch (error: any) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(signupData.email, signupData.password, signupData.fullName);
      toast({ title: 'Account created', description: 'Check your email for verification.' });
    } catch (error: any) {
      toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <UtensilsCrossed className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">FoodPOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Restaurant Point of Sale</p>
        </div>

        <Card className="mb-6">
          <Tabs defaultValue="login">
            <CardHeader className="pb-4">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="staff@restaurant.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full touch-target" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      placeholder="John Doe"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="staff@restaurant.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full touch-target" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Demo Credentials */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Login — Demo Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.email}
                onClick={() => handleQuickLogin(cred.email, cred.password)}
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-all hover:bg-muted/50 hover:border-primary/30 active:scale-[0.99] disabled:opacity-50"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${cred.color}`}>
                  <cred.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{cred.role}</span>
                    <span className="text-xs text-muted-foreground font-mono">{cred.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{cred.access}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {cred.password}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
