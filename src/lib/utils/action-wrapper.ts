'use client';

import { ToastAction } from '@/components/ui/toast';
import type { ReactElement } from 'react';
import * as React from 'react';

// Define a type for the toast function to avoid importing the whole hook
type ToastFunction = (options: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: ReactElement;
}) => void;

interface ActionOptions<T> {
  successToast?: {
    title: string;
    description: (data: T | boolean) => string;
  };
  errorContext: string;
}

// The server action can return different shapes, so we need to be flexible
type ServerActionResult<T> = { data?: T; success?: boolean; error?: string | null };

export async function handleServerAction<T>(
  actionFn: () => Promise<ServerActionResult<T>>,
  toast: ToastFunction,
  options: ActionOptions<T>
): Promise<{ data: T | boolean | null; error: Error | null }> {
  try {
    const result = await actionFn();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    const data = ('data' in result && result.data !== undefined) ? result.data : ('success' in result) ? result.success : false;
    
    if (options.successToast) {
      toast({
        title: options.successToast.title,
        description: options.successToast.description(data as T | boolean),
      });
    }
    
    return { data: data as T | boolean, error: null };
    
  } catch (error: any) {
    console.error(`Error in ${options.errorContext}:`, error);

    const isNetworkError =
      error?.code === 'unavailable' ||
      String(error?.message).toLowerCase().includes('network') ||
      String(error?.message).toLowerCase().includes('offline');

    const retry = () => {
      handleServerAction(actionFn, toast, options);
    };

    const retryAction = isNetworkError
      ? React.createElement(ToastAction, { onClick: retry }, 'Probeer opnieuw')
      : undefined;
    
    toast({
      title: `Fout bij ${options.errorContext}`,
      description: error?.message || String(error),
      variant: 'destructive',
      action: retryAction,
    });
    
    return { data: null, error };
  }
}
