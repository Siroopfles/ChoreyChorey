
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Mic } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/user/auth-context';
import { useToast } from '@/hooks/use-toast';
import { processCommand } from '@/ai/flows/core-utility/process-command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

// Declare the SpeechRecognition types for browsers that support it
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function CommandBar() {
    const [command, setCommand] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const { user, currentOrganization } = useAuth();
    const { toast } = useToast();
    const recognitionRef = useRef<any>(null);


    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            recognition.continuous = false;
            recognition.lang = 'nl-NL';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setCommand(transcript);
                // Automatically submit after voice input
                handleSubmit(transcript);
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
    }, [toast]);

    const handleSubmit = async (commandText: string | React.FormEvent<HTMLFormElement>) => {
        if (typeof commandText === 'object') {
            commandText.preventDefault();
        }
        
        const finalCommand = typeof commandText === 'string' ? commandText : command;

        if (!finalCommand.trim() || !user || !currentOrganization) return;

        setIsLoading(true);

        try {
            const result = await processCommand({ command: finalCommand, userId: user.id, organizationId: currentOrganization.id, userName: user.name });
            toast({
                title: 'AI Assistent',
                description: result,
            });
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

    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast({
                title: 'Browser niet ondersteund',
                description: 'Spraakherkenning wordt niet ondersteund in je browser.',
                variant: 'destructive',
            });
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
             <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                {isLoading ? (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                ) : (
                    <Search className="h-4 w-4 text-muted-foreground" />
                )}
             </div>
            <Input
                type="search"
                placeholder="Zoek, maak of wijzig een taak..."
                className="pl-8 pr-10 w-full bg-sidebar-accent border-sidebar-border focus-visible:ring-sidebar-ring"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={isLoading || !user || !currentOrganization}
            />
            <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={toggleListening}
                disabled={isLoading}
                className={cn("absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7", isListening && "text-destructive animate-pulse")}
            >
                <Mic className="h-4 w-4" />
                <span className="sr-only">Spraakherkenning</span>
            </Button>
        </form>
    );
}
