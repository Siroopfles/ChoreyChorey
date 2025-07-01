
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Trash2, Github, GitPullRequest, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getGithubItemFromUrl, addCommentToGithubItem, getGithubComments } from '@/app/actions/integrations/github.actions';
import { useAuth } from '@/contexts/user/auth-context';
import type { GitHubLink } from '@/lib/types';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

function GitHubCommentPopover({ item }: { item: GitHubLink }) {
    const [comment, setComment] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [isFetchingComments, setIsFetchingComments] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchComments = useCallback(async () => {
        setIsFetchingComments(true);
        const urlParts = item.url.match(/github\.com\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)/);
        if (!urlParts) {
            setIsFetchingComments(false);
            return;
        }
        const [, owner, repo] = urlParts;
        const result = await getGithubComments(owner, repo, item.number);
        if (result.data?.comments) {
            setComments(result.data.comments);
        }
        setIsFetchingComments(false);
    }, [item.number, item.url]);


    useEffect(() => {
        if (isOpen) {
            fetchComments();
        }
    }, [isOpen, fetchComments]);


    const handleCommentSubmit = async () => {
        if (!comment.trim() || !user) return;
        
        const urlParts = item.url.match(/github\.com\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)/);
        if (!urlParts) {
            toast({ title: "Fout", description: "Kon eigenaar en repo niet uit URL halen.", variant: "destructive" });
            return;
        }
        const [, owner, repo] = urlParts;

        setIsSubmitting(true);
        const result = await addCommentToGithubItem(owner, repo, item.number, comment, user.name);

        if (result.error) {
            toast({ title: "Fout bij verzenden", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Reactie geplaatst", description: "Je reactie is op GitHub geplaatst." });
            setComment('');
            await fetchComments();
        }
        setIsSubmitting(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={e => e.stopPropagation()} aria-label="Reageer op GitHub">
                    <MessageSquare className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" onClick={e => e.stopPropagation()}>
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Reageer op GitHub</h4>
                        <p className="text-sm text-muted-foreground">Je reactie wordt geplaatst op issue #{item.number}.</p>
                    </div>
                    <div className="grid gap-2">
                        <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Typ je reactie..." />
                        <Button onClick={handleCommentSubmit} disabled={isSubmitting || !comment.trim()}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verstuur
                        </Button>
                    </div>
                     <Separator className="my-2" />
                    <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-muted-foreground">Recente Reacties</h5>
                        {isFetchingComments ? (
                            <div className="flex justify-center p-2"><Loader2 className="h-4 w-4 animate-spin"/></div>
                        ) : (
                            <ScrollArea className="h-[150px]">
                                <div className="space-y-3 pr-2">
                                {comments.length > 0 ? comments.map(c => (
                                    <div key={c.id} className="flex items-start gap-2 text-xs">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={c.user.avatar_url} />
                                            <AvatarFallback>{c.user.login.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1 rounded-md bg-muted p-2">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold">{c.user.login}</p>
                                                <p className="text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: nl })}</p>
                                            </div>
                                            <div className="prose prose-sm max-w-none prose-p:my-1" dangerouslySetInnerHTML={{ __html: c.body_html }} />
                                        </div>
                                    </div>
                                )) : <p className="text-center text-muted-foreground text-xs py-4">Nog geen reacties.</p>}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function GitHubLinker() {
    const { control, getValues } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'githubLinks',
    });
    const { currentOrganization } = useAuth();
    const { toast } = useToast();
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLinkItem = async () => {
        if (!inputValue.trim() || !currentOrganization) return;
        setIsLoading(true);

        const result = await getGithubItemFromUrl(currentOrganization.id, inputValue);

        if (result.error) {
            toast({ title: 'Fout bij koppelen', description: result.error, variant: 'destructive' });
        } else if (result.data?.item) {
            const currentLinks = getValues('githubLinks') || [];
            if (currentLinks.some((link: GitHubLink) => link.url === result.data.item.url)) {
                toast({ title: 'Al gekoppeld', description: 'Dit item is al aan de taak gekoppeld.', variant: 'default' });
            } else {
                append(result.data.item);
                toast({ title: 'Item gekoppeld!', description: `GitHub item #${result.data.item.number} is gekoppeld.` });
            }
            setInputValue('');
        }
        setIsLoading(false);
    };

    const isConfigured = !!currentOrganization?.settings?.github?.owner;

    if (!isConfigured) {
        return null; // Don't render if not configured
    }

    return (
        <div>
            <Separator />
            <div className="space-y-4 pt-4">
                <Label>GitHub Koppelingen</Label>
                <div className="space-y-2">
                    {fields.map((field, index) => {
                        const item = field as unknown as GitHubLink & { id: string };
                        const Icon = item.type === 'pull-request' ? GitPullRequest : AlertCircle;
                        return (
                            <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <Link href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" onClick={e => e.stopPropagation()}>
                                        <span className="text-muted-foreground">#{item.number}</span> <span className="truncate">{item.title}</span>
                                    </Link>
                                </div>
                                <div className="flex items-center">
                                    <GitHubCommentPopover item={item} />
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Plak GitHub issue/PR URL..."
                    />
                    <Button type="button" onClick={handleLinkItem} disabled={isLoading || !inputValue.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Koppel'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
