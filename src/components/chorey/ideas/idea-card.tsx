
'use client';

import type { Idea, Permission } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useIdeas } from '@/contexts/idea-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThumbsUp, MessageSquare, MoreVertical, Edit, CheckCircle, Clock, TrendingUp, Lightbulb } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { PERMISSIONS } from '@/lib/types';

interface IdeaCardProps {
  idea: Idea;
  currentUserPermissions: Permission[];
}

export function IdeaCard({ idea, currentUserPermissions }: IdeaCardProps) {
  const { user, users } = useAuth();
  const { toggleIdeaUpvote, updateIdeaStatus } = useIdeas();
  const creator = users.find(u => u.id === idea.creatorId);
  const hasVoted = user ? idea.upvotes?.includes(user.id) : false;

  const canManageIdeas = currentUserPermissions.includes(PERMISSIONS.MANAGE_IDEAS);

  const statusConfig = {
    new: { label: 'Nieuw', icon: Lightbulb, color: 'text-blue-500' },
    planned: { label: 'Gepland', icon: Clock, color: 'text-purple-500' },
    'in-progress': { label: 'In Uitvoering', icon: TrendingUp, color: 'text-orange-500' },
    completed: { label: 'Voltooid', icon: CheckCircle, color: 'text-green-500' },
  };

  const currentStatus = statusConfig[idea.status || 'new'];
  const StatusIcon = currentStatus.icon;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
            <CardTitle>{idea.title}</CardTitle>
            {canManageIdeas && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuSub>
                             <DropdownMenuSubTrigger>
                                Status wijzigen
                             </DropdownMenuSubTrigger>
                             <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    {Object.entries(statusConfig).map(([key, config]) => (
                                        <DropdownMenuItem key={key} onSelect={() => updateIdeaStatus(idea.id, key as Idea['status'])}>
                                            <config.icon className={cn("mr-2 h-4 w-4", config.color)} />
                                            {config.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                             </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
        <CardDescription className="line-clamp-3 h-[60px]">{idea.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
         <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <StatusIcon className={cn("h-4 w-4", currentStatus.color)} />
            <span>Status: {currentStatus.label}</span>
         </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
                <AvatarImage src={creator?.avatar} />
                <AvatarFallback>{creator?.name.charAt(0) ?? '?'}</AvatarFallback>
            </Avatar>
            <span>{creator?.name ?? 'Onbekend'}</span>
        </div>
        <Button variant={hasVoted ? 'default' : 'outline'} size="sm" onClick={() => user && toggleIdeaUpvote(idea.id)}>
          <ThumbsUp className="mr-2 h-4 w-4" /> {idea.upvotes?.length || 0}
        </Button>
      </CardFooter>
    </Card>
  );
}
