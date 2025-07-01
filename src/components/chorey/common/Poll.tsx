'use client';

import type { Poll as PollType, User } from '@/lib/types';
import { useTasks } from '@/contexts/feature/task-context';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useOrganization } from '@/contexts/system/organization-context';

interface PollProps {
    taskId: string;
    poll: PollType;
}

export function Poll({ taskId, poll }: PollProps) {
    const { voteOnPoll } = useTasks();
    const { user: currentUser } = useAuth();
    const { users } = useOrganization();

    const totalVotes = poll.options.reduce((sum, option) => sum + option.voterIds.length, 0);

    const handleVote = (optionId: string) => {
        if (!currentUser) return;
        voteOnPoll(taskId, optionId);
    };

    return (
        <div className="space-y-3 rounded-md border p-4">
            <h4 className="font-semibold">{poll.question}</h4>
            <div className="space-y-3">
                {poll.options.map(option => {
                    const voteCount = option.voterIds.length;
                    const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                    const hasVoted = currentUser ? option.voterIds.includes(currentUser.id) : false;

                    const voterNames = option.voterIds
                        .map(id => users.find(u => u.id === id)?.name)
                        .filter(Boolean) as string[];

                    return (
                        <div key={option.id} className="space-y-1.5">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium">{option.text}</span>
                                <span className="text-muted-foreground">{voteCount} stem(men)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Progress value={percentage} className="h-2 flex-1" />
                                <Button
                                    variant={hasVoted ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleVote(option.id)}
                                >
                                    {hasVoted && <Check className="mr-2 h-4 w-4" />}
                                    Stem
                                </Button>
                            </div>
                             {voterNames.length > 0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-xs text-muted-foreground cursor-default">
                                                Gestemd door: {voterNames.slice(0, 3).join(', ')}
                                                {voterNames.length > 3 && ` en ${voterNames.length - 3} anderen`}
                                            </p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <ul className="list-disc list-inside">
                                                {voterNames.map(name => <li key={name}>{name}</li>)}
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
                {totalVotes} stemmen in totaal. {poll.isMultiVote ? 'Meerdere stemmen per persoon toegestaan.' : 'Eén stem per persoon.'}
            </p>
        </div>
    );
}
