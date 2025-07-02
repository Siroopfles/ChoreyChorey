
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processCommand } from '@/ai/flows/core-utility/process-command';
import { ChatBubble } from '@/components/chorey/common/chat-bubble';
import { ScrollArea } from '@/components/ui/scroll-area';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !currentOrganization) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
        const assistantMessageContent = await processCommand({ command: currentInput, userId: user.id, organizationId: currentOrganization.id, userName: user.name });
        const assistantMessage: Message = { role: 'assistant', content: assistantMessageContent };
        
        setMessages(prev => [...prev, assistantMessage]);

    } catch (e: any) {
        let detailedError = `Er is een onverwachte fout opgetreden bij het verwerken van uw commando.\n\nFoutmelding: ${e.message}`;

        // Check for specific Firestore permission error
        if (e.code === 'permission-denied' || (e.message && e.message.includes('PERMISSION_DENIED'))) {
            detailedError = `Firestore permissie geweigerd.\n\nDit betekent meestal dat de beveiligingsregels de actie blokkeren.\n\nContext:\n- Actie: Poging om een taak aan te maken via AI.\n- Gebruiker: ${user?.email}\n- Organisatie: ${currentOrganization?.name} (${currentOrganization?.id})\n\nControleer of de Firestore-regels correct zijn geconfigureerd om schrijfacties voor de 'tasks' collectie toe te staan voor leden van de organisatie.`;
        } else if (e.message && e.message.includes('Schema validation failed')) {
            detailedError = `Validatiefout van AI-data.\n\nDe AI heeft data in een incorrect formaat teruggestuurd. Dit kan een tijdelijk probleem zijn.\n\nDetails:\n${e.message}`;
        }
        
        const errorMessage: Message = { role: 'assistant', content: detailedError };
        
        setMessages(prev => [...prev, errorMessage]);
        
        toast({
            title: 'AI Fout',
            description: 'De AI kon het commando niet correct verwerken.',
            variant: 'destructive',
        });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-10rem)]">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-6">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                    <MessageCircle className="h-16 w-16 mb-4" />
                    <h2 className="text-2xl font-bold">Chorey Chat</h2>
                    <p className="max-w-md mt-2">Begin een gesprek met de AI-assistent. Je kunt taken aanmaken, vragen stellen en meer. Probeer bijvoorbeeld: "Maak een taak aan om morgen de planten water te geven".</p>
                </div>
            )}
            {messages.map((msg, index) => (
              <ChatBubble
                key={index}
                message={msg}
                userName={user?.name || 'User'}
                userAvatar={user?.avatar || ''}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Stel een vraag of geef een commando..."
            disabled={isLoading}
            autoComplete="off"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Verstuur</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
