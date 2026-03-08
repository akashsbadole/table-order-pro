import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2 } from 'lucide-react';

const DEMO_KOT = [
  {
    id: '1',
    orderNumber: 101,
    tableNumber: 'T2',
    items: [
      { name: 'Paneer Tikka', qty: 2, notes: 'Extra spicy' },
      { name: 'Butter Naan', qty: 4, notes: '' },
    ],
    createdAt: new Date(Date.now() - 2 * 60000),
    status: 'pending' as const,
  },
  {
    id: '2',
    orderNumber: 102,
    tableNumber: 'T5',
    items: [
      { name: 'Butter Chicken', qty: 1, notes: 'Less oil' },
      { name: 'Biryani', qty: 2, notes: '' },
      { name: 'Masala Chai', qty: 3, notes: '' },
    ],
    createdAt: new Date(Date.now() - 8 * 60000),
    status: 'preparing' as const,
  },
  {
    id: '3',
    orderNumber: 103,
    tableNumber: 'T8',
    items: [
      { name: 'Dal Makhani', qty: 1, notes: '' },
      { name: 'Garlic Naan', qty: 2, notes: '' },
    ],
    createdAt: new Date(Date.now() - 15 * 60000),
    status: 'preparing' as const,
  },
];

const getUrgencyColor = (minutes: number) => {
  if (minutes < 5) return 'border-success';
  if (minutes < 10) return 'border-warning';
  return 'border-destructive';
};

const Kitchen = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kitchen Display</h1>
          <p className="text-sm text-muted-foreground">Active orders requiring preparation</p>
        </div>
        <Badge variant="secondary">{DEMO_KOT.length} Active Orders</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_KOT.map((kot) => {
          const minutesAgo = Math.round((Date.now() - kot.createdAt.getTime()) / 60000);
          return (
            <Card key={kot.id} className={`border-l-4 ${getUrgencyColor(minutesAgo)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">
                    #{kot.orderNumber} — {kot.tableNumber}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {minutesAgo}m ago
                  </div>
                </div>
                <Badge variant={kot.status === 'pending' ? 'destructive' : 'secondary'} className="w-fit capitalize">
                  {kot.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {kot.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 rounded-md bg-muted/50 p-2">
                    <span className="font-mono font-bold text-sm text-primary">{item.qty}×</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.notes && (
                        <p className="text-xs text-warning mt-0.5">⚠ {item.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
                <Button className="w-full mt-3 touch-target" variant="default">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Ready
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Kitchen;
