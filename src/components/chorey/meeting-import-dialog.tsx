'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bot, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { handleMeetingToTasks } from '@/app/actions/ai.actions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type MeetingImportDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function MeetingImportDialog({ open, onOpenChange }: MeetingImportDialogProps) {
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resultSummary, setResultSummary] = useState('');
    const { toast } = useToast();
    const { user, currentOrganization } = useAuth();

    const resetState = () => {
        setNotes('');
        setIsLoading(false);
        setResultSummary('');
    };

    const handleProcessNotes = async () => {
        if (!notes.trim()) {
            toast({ title: 'Notulen zijn leeg', description: 'Plak de notulen in het tekstveld.', variant: 'destructive' });
            return;
        }
        if (!user || !currentOrganization) {
            toast({ title: 'Authenticatiefout', description: 'U moet ingelogd zijn en een organisatie geselecteerd hebben.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        setResultSummary('');
        
        const result = await handleMeetingToTasks({
            notes,
            organizationId: currentOrganization.id,
            creatorId: user.id
        });

        if (result.error) {
            toast({ title: 'AI Fout', description: result.error, variant: 'destructive' });
        } else if (result.summary) {
            toast({ title: 'Verwerking voltooid!', description: 'De AI heeft de notulen geanalyseerd.' });
            setResultSummary(result.summary);
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetState(); onOpenChange(isOpen); }}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Importeer Taken uit Notulen</DialogTitle>
                    <DialogDescription>Plak uw vergader- of gespreksnotulen hieronder. De AI zal actiepunten identificeren en er taken van maken.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Textarea
                        placeholder="Plak hier uw notulen...&#10;Voorbeeld: 'Actiepunt: Jan moet de kwartaalcijfers voor vrijdag voorbereiden.'"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[250px] font-mono text-sm"
                        disabled={isLoading}
                    />
                    {resultSummary && (
                        <Alert>
                            <Bot className="h-4 w-4" />
                            <AlertTitle>AI Samenvatting</AlertTitle>
                            <AlertDescription>{resultSummary}</AlertDescription>
                        </Alert>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleProcessNotes} disabled={isLoading || !notes.trim()} className="w-full sm:w-auto">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                        Verwerk Notulen
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}