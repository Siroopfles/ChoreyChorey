
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
    description?: (data: T) => string;
  };
  errorContext: string;
}

// The server action can return different shapes, so we need to be flexible
type ServerActionResult<T> = { data?: T | null; success?: boolean; error?: string | null };

export async function handleServerAction<T>(
  actionFn: () => Promise<ServerActionResult<T>>,
  toast: ToastFunction,
  options: ActionOptions<T>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await actionFn();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    const data = result.data !== undefined ? result.data : null;
    
    if (options.successToast) {
      toast({
        title: options.successToast.title,
        description: options.successToast.description ? options.successToast.description(data as T) : undefined,
      });
    }
    
    return { data, error: null };
    
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
      ? React.createElement(ToastAction, { onClick: retry, altText: "Probeer opnieuw" }, 'Probeer opnieuw')
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
