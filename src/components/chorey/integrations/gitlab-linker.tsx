
'use client';

import { useFormContext } from 'react-hook-form';
import { useAuth } from '@/contexts/user/auth-context';
import type { GitLabLink } from '@/lib/types';
import Link from 'next/link';
import { getGitLabItemFromUrl, searchGitLabItems } from '@/app/actions/integrations/gitlab.actions';
import { Gitlab, GitMerge, AlertCircle } from 'lucide-react';
import { CommandItem } from '@/components/ui/command';
import { GenericLinker } from './GenericLinker';


const renderLinkItem = (item: GitLabLink) => {
    const Icon = item.type === 'merge_request' ? GitMerge : AlertCircle;
    return (
        <div className="flex items-center gap-2 overflow-hidden">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <Link href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" onClick={e => e.stopPropagation()}>
                <span className="text-muted-foreground">!{item.iid}</span> <span className="truncate">{item.title}</span>
            </Link>
        </div>
    );
};

const renderSearchResult = (item: GitLabLink, onSelect: (item: GitLabLink) => void) => (
     <CommandItem
        key={item.url}
        value={`${item.iid} ${item.title}`}
        onSelect={() => onSelect(item)}
        className="flex items-center gap-2"
    >
        <Gitlab className="h-4 w-4 text-orange-500" />
        <span>!{item.iid}</span>
        <span className="truncate">{item.title}</span>
    </CommandItem>
);


export function GitLabLinker() {
    const { control } = useFormContext();
    const { currentOrganization } = useAuth();

    const isConfigured = !!currentOrganization?.settings?.gitlab?.projects?.length;
    const configuredProjects = currentOrganization?.settings?.gitlab?.projects || [];

    return (
        <GenericLinker<GitLabLink>
            linkerName="GitLab"
            fieldArrayName="gitlabLinks"
            getUniqueKey={(item) => item.url}
            getDisplayId={(item) => `!${item.iid}`}
            searchFunction={searchGitLabItems}
            getItemFromUrlFunction={getGitLabItemFromUrl}
            renderLinkItem={renderLinkItem}
            renderSearchResult={renderSearchResult}
            projectOrRepoConfig={{
                label: 'Project',
                placeholder: 'Selecteer project',
                options: configuredProjects,
            }}
            isConfigured={isConfigured}
            LinkerIcon={Gitlab}
        />
    );
}
