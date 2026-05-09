'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineActions, setOfflineActions] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    // Count offline actions
    const checkOfflineActions = () => {
      try {
        const queue = localStorage.getItem('campusbridge-offline-queue');
        setOfflineActions(queue ? JSON.parse(queue).length : 0);
      } catch {
        setOfflineActions(0);
      }
    };

    checkOfflineActions();
    const interval = setInterval(checkOfflineActions, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && offlineActions === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-600">You're offline</span>
        </>
      ) : offlineActions > 0 ? (
        <>
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-600">
            {offlineActions} action{offlineActions === 1 ? '' : 's'} queued
          </span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-green-600">Back online</span>
        </>
      )}
    </div>
  );
}
