'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

interface ChatBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
  userName: string;
  userAvatar: string;
}

export function ChatBubble({ message, userName, userAvatar }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex items-start gap-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarFallback><Bot /></AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-md rounded-lg p-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        )}
      >
        <p className="text-sm">{message.content}</p>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
