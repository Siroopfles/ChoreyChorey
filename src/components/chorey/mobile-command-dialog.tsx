'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mic, Send } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { processCommand } from '@/ai/flows/process-command';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface MobileCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileCommandDialog({ open, onOpenChange }: MobileCommandDialogProps) {
    const [command, setCommand] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const { user, currentOrganization } = useAuth();
    const { toast } = useToast();
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (!open) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({
                title: 'Browser niet ondersteund',
                description: 'Spraakherkenning wordt niet ondersteund in je browser.',
                variant: 'destructive',
            });
            return;
        }

        if (!recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            recognition.continuous = false;
            recognition.lang = 'nl-NL';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setCommand(transcript);
            };

            recognition.onerror = (event: any) => {
                toast({
                    title: 'Fout bij spraakherkenning',
                    description: event.error,
                    variant: 'destructive',
                });
                setIsListening(false);
            };
            
            recognition.onend = () => {
                setIsListening(false);
            };
        }
        
        // Auto-start listening when dialog opens
        if (open) {
            toggleListening(true);
        }

        // Cleanup function
        return () => {
            if (recognitionRef.current && isListening) {
                recognitionRef.current.stop();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, toast]);

    const toggleListening = (start?: boolean) => {
        if (!recognitionRef.current) return;
        
        const shouldStart = start ?? !isListening;

        if (shouldStart) {
            recognitionRef.current.start();
        } else {
            recognitionRef.current.stop();
        }
        setIsListening(shouldStart);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!command.trim() || !user || !currentOrganization) return;

        setIsLoading(true);

        try {
            const result = await processCommand({ command, userId: user.id, organizationId: currentOrganization.id, userName: user.name });
            toast({
                title: 'AI Assistent',
                description: result,
            });
            onOpenChange(false); // Close dialog on success
        } catch(error: any) {
             toast({
                title: 'AI Fout',
                description: error.message,
                variant: 'destructive',
            });
        }
        
        setCommand('');
        setIsLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Spraakcommando</DialogTitle>
                    <DialogDescription>
                        {isListening ? "Luisteren..." : "Geef een commando of typ hieronder."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Input 
                            placeholder="bijv. Maak een taak aan..."
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            disabled={isLoading}
                        />
                         <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => toggleListening()}
                            disabled={isLoading}
                            className={cn(isListening && "text-destructive ring-2 ring-destructive")}
                        >
                            <Mic className="h-4 w-4" />
                        </Button>
                    </div>
                     <DialogFooter>
                        <Button type="submit" disabled={isLoading || !command.trim()} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                            Verstuur Commando
                        </Button>
                     </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
