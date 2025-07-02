
'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type AiFunction<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

export function useAiSuggestion<TInput, TOutput>(
  aiFunction: AiFunction<TInput, { output: any, input: any }>, // Expect a specific return shape
  options?: {
    onSuccess?: (data: TOutput) => void;
    onError?: (error: Error) => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TOutput | null>(null);
  const { toast } = useToast();

  const trigger = useCallback(async (input: TInput) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await aiFunction(input as any); // Cast as any because TS can't infer the specific input of all AI functions
      setData(result);
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      return result;
    } catch (e: any) {
      setError(e.message);
      toast({ title: `AI Fout`, description: e.message, variant: 'destructive' });
      if (options?.onError) {
        options.onError(e);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [aiFunction, options, toast]);

  return { isLoading, error, data, trigger };
}
