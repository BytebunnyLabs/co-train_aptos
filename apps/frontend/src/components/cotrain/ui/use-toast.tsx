'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useCallback((props: ToastProps) => {
    const { title, description, variant = 'default', duration = 4000 } = props;
    
    const message = description ? `${title}: ${description}` : title;
    
    switch (variant) {
      case 'destructive':
        sonnerToast.error(message, { duration });
        break;
      case 'success':
        sonnerToast.success(message, { duration });
        break;
      default:
        sonnerToast(message, { duration });
        break;
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Simple toast hook that works without provider (fallback)
export function useSimpleToast() {
  return {
    toast: (props: ToastProps) => {
      const { title, description, variant = 'default' } = props;
      const message = description ? `${title}: ${description}` : title;
      
      switch (variant) {
        case 'destructive':
          console.error(message);
          alert(`Error: ${message}`);
          break;
        case 'success':
          console.log(message);
          alert(`Success: ${message}`);
          break;
        default:
          console.info(message);
          alert(message);
          break;
      }
    }
  };
}