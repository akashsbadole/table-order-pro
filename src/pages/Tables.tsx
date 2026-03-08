import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const DEMO_TABLES = [
  { id: '1', number: 'T1', capacity: 2, status: 'vacant' as const },
  { id: '2', number: 'T2', capacity: 4, status: 'occupied' as const },
  { id: '3', number: 'T3', capacity: 4, status: 'dirty' as const },
  { id: '4', number: 'T4', capacity: 6, status: 'vacant' as const },
  { id: '5', number: 'T5', capacity: 2, status: 'occupied' as const },
  { id: '6', number: 'T6', capacity: 8, status: 'vacant' as const },
  { id: '7', number: 'T7', capacity: 4, status: 'vacant' as const },
  { id: '8', number: 'T8', capacity: 4, status: 'occupied' as const },
  { id: '9', number: 'T9', capacity: 2, status: 'dirty' as const },
  { id: '10', number: 'T10', capacity: 6, status: 'vacant' as const },
  { id: '11', number: 'T11', capacity: 4, status: 'vacant' as const },
  { id: '12', number: 'T12', capacity: 8, status: 'occupied' as const },
];

const statusConfig = {
  vacant: { label: 'Vacant', className: 'border-success bg-success/10 hover:bg-success/20' },
  occupied: { label: 'Occupied', className: 'border-occupied bg-occupied/10 hover:bg-occupied/20' },
  dirty: { label: 'Dirty', className: 'border-dirty bg-dirty/10 hover:bg-dirty/20' },
};

const Tables = () => {
  const summary = {
    total: DEMO_TABLES.length,
    vacant: DEMO_TABLES.filter((t) => t.status === 'vacant').length,
    occupied: DEMO_TABLES.filter((t) => t.status === 'occupied').length,
    dirty: DEMO_TABLES.filter((t) => t.status === 'dirty').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Table Management</h1>
          <p className="text-sm text-muted-foreground">Floor Plan — Ground Floor</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-success text-success">Vacant: {summary.vacant}</Badge>
          <Badge variant="outline" className="border-occupied text-occupied">Occupied: {summary.occupied}</Badge>
          <Badge variant="outline" className="border-dirty text-dirty">Dirty: {summary.dirty}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {DEMO_TABLES.map((table) => {
          const config = statusConfig[table.status];
          return (
            <Card
              key={table.id}
              className={cn(
                'cursor-pointer border-2 transition-all active:scale-[0.97]',
                config.className
              )}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <span className="text-2xl font-bold font-mono">{table.number}</span>
                <span className="text-xs text-muted-foreground mt-1">{table.capacity} seats</span>
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  {config.label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Tables;
