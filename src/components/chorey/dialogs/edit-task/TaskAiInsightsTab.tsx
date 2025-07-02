'use client';

import { useFormContext } from 'react-hook-form';
import type { Task } from '@/lib/types';
import { predictTaskCompletion } from '@/ai/flows/risk-prediction/predict-task-completion-flow';
import { useOrganization } from '@/contexts/system/organization-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bot } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { useAiSuggestion } from '@/hooks/use-ai-suggestion';
import { AIFeedback } from '@/components/chorey/common/ai-feedback';

export function TaskAiInsightsTab({ task }: { task: Task }) {
  const { currentOrganization } = useOrganization();
  const form = useFormContext();
  const { 
    trigger: triggerPrediction, 
    data: prediction, 
    isLoading: isPredicting 
  } = useAiSuggestion(predictTaskCompletion);

  const handlePredictCompletion = async () => {
    if (!currentOrganization) return;
    triggerPrediction({
      organizationId: currentOrganization.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      storyPoints: task.storyPoints,
    });
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
            <AlertTitle>Voorspelling: {format(new Date(prediction.output.predictedCompletionDate), 'd MMMM yyyy')}</AlertTitle>
            <AlertDescription>{prediction.output.reasoning}</AlertDescription>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-medium">Zekerheid: {prediction.output.confidenceScore}%</span>
              <Button size="sm" variant="outline" onClick={() => form.setValue('dueDate', new Date(prediction.output.predictedCompletionDate))}>
                Stel in als einddatum
              </Button>
            </div>
             <AIFeedback
                flowName="predictTaskCompletionFlow"
                input={prediction.input}
                output={prediction.output}
              />
          </Alert>
        </CardFooter>
      )}
    </Card>
  );
}
