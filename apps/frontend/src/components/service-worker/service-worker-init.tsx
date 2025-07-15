'use client';

import React from 'react';
import { serviceWorkerManager } from '@/lib/service-worker';

export function ServiceWorkerInit() {
  React.useEffect(() => {
    // Only register service worker in production or when explicitly enabled
    const shouldRegister = process.env.NODE_ENV === 'production' || 
                          process.env.NEXT_PUBLIC_SW_ENABLED === 'true';

    if (shouldRegister && typeof window !== 'undefined') {
      console.log('Registering Service Worker...');
      
      // Register with a small delay to avoid blocking the main thread
      setTimeout(() => {
        serviceWorkerManager.register().then((registration: ServiceWorkerRegistration | null) => {
          if (registration) {
            console.log('Service Worker registered successfully');
          } else {
            console.log('Service Worker registration failed or not supported');
          }
        }).catch((error: Error) => {
          console.error('Service Worker registration error:', error);
        });
      }, 1000);
    } else {
      console.log('Service Worker registration skipped (development mode)');
    }
  }, []);

  // This component doesn't render anything
  return null;
}

// Higher-order component to wrap the app with service worker initialization
export function withServiceWorker<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ServiceWorkerWrapper(props: P) {
    return (
      <>
        <ServiceWorkerInit />
        <Component {...props} />
      </>
    );
  };
}