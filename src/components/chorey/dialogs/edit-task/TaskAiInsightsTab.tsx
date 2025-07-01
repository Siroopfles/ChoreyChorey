
'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { Task, PredictTaskCompletionOutput } from '@/lib/types';
import { predictTaskCompletion } from '@/ai/flows/risk-prediction/predict-task-completion-flow';
import { useOrganization } from '@/contexts/system/organization-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bot } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';

export function TaskAiInsightsTab({ task }: { task: Task }) {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const form = useFormContext();
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<PredictTaskCompletionOutput | null>(null);

  const handlePredictCompletion = async () => {
    if (!currentOrganization) return;
    setIsPredicting(true);
    setPrediction(null);
    try {
      const result = await predictTaskCompletion({
        organizationId: currentOrganization.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        storyPoints: task.storyPoints,
      });
      setPrediction(result);
    } catch (e: any) {
      toast({ title: 'Fout bij voorspelling', description: e.message, variant: 'destructive' });
    }
    setIsPredicting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voorspel Voltooiingsdatum</CardTitle>
        <CardDescription>Laat de AI een inschatting maken van wanneer deze taak voltooid zal zijn, op basis van historische data.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handlePredictCompletion} disabled={isPredicting}>
          {isPredicting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
          Voorspel Datum
        </Button>
      </CardContent>
      {prediction && (
        <CardFooter className="flex-col items-start gap-2">
          <Alert>
            <AlertTitle>Voorspelling: {format(new Date(prediction.predictedCompletionDate), 'd MMMM yyyy')}</AlertTitle>
            <AlertDescription>{prediction.reasoning}</AlertDescription>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-medium">Zekerheid: {prediction.confidenceScore}%</span>
              <Button size="sm" variant="outline" onClick={() => form.setValue('dueDate', new Date(prediction.predictedCompletionDate))}>
                Stel in als einddatum
              </Button>
            </div>
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
}
