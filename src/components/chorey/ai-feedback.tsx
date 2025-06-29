'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { submitAiFeedback } from '@/app/actions/feedback.actions';

interface AIFeedbackProps {
  flowName: string;
  input: any;
  output: any;
}

export function AIFeedback({ flowName, input, output }: AIFeedbackProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const { user, currentOrganization } = useAuth();
  const { toast } = useToast();

  const handleFeedback = async (feedback: 'positive' | 'negative') => {
    if (!user || !currentOrganization || feedbackGiven) return;
    setFeedbackGiven(true);

    const result = await submitAiFeedback({
      flowName,
      input,
      output,
      feedback,
      userId: user.id,
      organizationId: currentOrganization.id,
    });

    if (result.data?.success) {
      toast({ title: 'Feedback ontvangen!', description: 'Bedankt voor je hulp om de AI te verbeteren.' });
    } else {
      toast({ title: 'Fout', description: 'Kon feedback niet verzenden.', variant: 'destructive' });
      setFeedbackGiven(false); // Allow user to try again
    }
  };

  if (feedbackGiven) {
    return <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">Bedankt voor je feedback!</p>;
  }

  return (
    <div className="flex items-center gap-1 mt-2 pt-2 border-t">
      <p className="text-xs text-muted-foreground mr-auto">Nuttig?</p>
      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback('positive')} aria-label="Positieve feedback">
        <ThumbsUp className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleFeedback('negative')} aria-label="Negatieve feedback">
        <ThumbsDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
