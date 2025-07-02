
'use client';

import { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Loader2, GitPullRequest, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getGithubItemFromUrl, addCommentToGithubItem, getGithubComments, searchIssuesAndPRs } from '@/app/actions/integrations/github.actions';
import { useAuth } from '@/contexts/user/auth-context';
import type { GitHubLink } from '@/lib/types';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { GenericLinker } from './GenericLinker';
import { GitHubIcon } from '@/components/chorey/common/provider-icons';
import { CommandItem } from '@/components/ui/command';


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


    useState(() => {
        if (isOpen) {
            fetchComments();
        }
    });


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

const renderLinkItem = (item: GitHubLink) => {
    const Icon = item.type === 'pull-request' ? GitPullRequest : AlertCircle;
    return (
        <div className="flex items-center gap-2 overflow-hidden">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <Link href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" onClick={e => e.stopPropagation()}>
                <span className="text-muted-foreground">#{item.number}</span> <span className="truncate">{item.title}</span>
            </Link>
            <GitHubCommentPopover item={item} />
        </div>
    );
};

const renderSearchResult = (item: GitHubLink, onSelect: (item: GitHubLink) => void) => {
    const Icon = item.type === 'pull-request' ? GitPullRequest : AlertCircle;
    return (
        <CommandItem
            key={item.url}
            value={`${item.number} ${item.title}`}
            onSelect={() => onSelect(item)}
            className="flex items-center gap-2"
        >
            <Icon className="h-4 w-4" />
            <span>#{item.number}</span>
            <span className="truncate">{item.title}</span>
        </CommandItem>
    );
};


export function GitHubLinker() {
    const { control } = useFormContext();
    const { currentOrganization } = useAuth();
    
    const isConfigured = !!currentOrganization?.settings?.github?.owner;
    const configuredRepos = currentOrganization?.settings?.github?.repos || [];

    const searchFn = (isConfigured && searchIssuesAndPRs)
      ? (orgId: string, repo: string, term: string) => searchIssuesAndPRs(currentOrganization!.settings!.github!.owner, repo, term)
      : undefined;

    return (
        <GenericLinker<GitHubLink>
            linkerName="GitHub"
            fieldArrayName="githubLinks"
            getUniqueKey={(item) => item.url}
            getDisplayId={(item) => `#${item.number}`}
            searchFunction={searchFn}
            getItemFromUrlFunction={getGithubItemFromUrl}
            renderLinkItem={renderLinkItem}
            renderSearchResult={renderSearchResult}
            projectOrRepoConfig={{
                label: 'Repository',
                placeholder: 'Selecteer repo',
                options: configuredRepos,
            }}
            isConfigured={isConfigured}
            LinkerIcon={GitHubIcon}
        />
    );
}
