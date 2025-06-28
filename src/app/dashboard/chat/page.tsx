'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleProcessCommand } from '@/app/actions/ai.actions';
import { ChatBubble } from '@/components/chorey/chat-bubble';
import { ScrollArea } from '@/components/ui/scroll-area';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, currentOrganization } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !user || !currentOrganization) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const response = await handleProcessCommand(input, user.id, currentOrganization.id, user.name);
    
    let assistantMessageContent = '';
    if (response.error) {
      assistantMessageContent = `Er is een fout opgetreden: ${response.error}`;
      toast({
        title: 'AI Fout',
        description: response.error,
        variant: 'destructive',
      });
    } else if (response.result) {
      assistantMessageContent = response.result;
    } else {
      assistantMessageContent = "Sorry, ik kon je verzoek niet verwerken.";
    }

    const assistantMessage: Message = { role: 'assistant', content: assistantMessageContent };
    setMessages(prev => [...prev, assistantMessage]);
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
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
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
