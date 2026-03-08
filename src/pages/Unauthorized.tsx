import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';

const Unauthorized = () => (
  <div className="flex min-h-screen items-center justify-center bg-background p-4">
    <div className="text-center">
      <ShieldX className="mx-auto h-16 w-16 text-destructive mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
      <p className="text-muted-foreground mb-6">You don't have permission to access this page.</p>
      <Button asChild>
        <Link to="/orders">Go to Orders</Link>
      </Button>
    </div>
  </div>
);

export default Unauthorized;
