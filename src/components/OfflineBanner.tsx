import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineBanner = () => {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-destructive px-4 py-1.5 text-xs font-medium text-destructive-foreground">
      <WifiOff className="h-3.5 w-3.5" />
      You are offline — some features may be unavailable
    </div>
  );
};

export default OfflineBanner;
