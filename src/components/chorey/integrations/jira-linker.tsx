
'use client';

import { useFormContext } from 'react-hook-form';
import { useAuth } from '@/contexts/user/auth-context';
import type { JiraLink } from '@/lib/types';
import Link from 'next/link';
import { getJiraItemFromUrl, searchJiraItems } from '@/app/actions/integrations/jira.actions';
import { GenericLinker } from './GenericLinker';
import { JiraIcon as ProviderIcon } from '@/components/chorey/common/provider-icons';
import { CommandItem } from '@/components/ui/command';


const JiraIcon = ({ src }: { src: string }) => <img src={src} alt="Jira issue type" className="h-4 w-4 shrink-0" />;

const renderLinkItem = (item: JiraLink) => (
    <div className="flex items-center gap-2 overflow-hidden">
        <JiraIcon src={item.iconUrl} />
        <Link href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" onClick={e => e.stopPropagation()}>
            <span className="text-muted-foreground">{item.key}</span> <span className="truncate">{item.summary}</span>
        </Link>
    </div>
);

const renderSearchResult = (item: JiraLink, onSelect: (item: JiraLink) => void) => (
     <CommandItem
        key={item.key}
        value={item.key}
        onSelect={() => onSelect(item)}
        className="flex items-center gap-2"
    >
        <JiraIcon src={item.iconUrl} />
        <span>{item.key}</span>
        <span className="truncate">{item.summary}</span>
    </CommandItem>
);

export function JiraLinker() {
    const { control } = useFormContext();
    const { currentOrganization } = useAuth();

    const isJiraConfigured = !!currentOrganization?.settings?.features?.jira;
    
    // Jira search is global, so no project/repo config needed
    const searchFn = isJiraConfigured ? (orgId: string, _repo: string, term: string) => searchJiraItems(orgId, term) : undefined;
    
    return (
        <GenericLinker<JiraLink>
            linkerName="Jira"
            fieldArrayName="jiraLinks"
            denormalizedIdArrayName="jiraLinkKeys"
            getUniqueKey={(item) => item.key}
            getDisplayId={(item) => item.key}
            searchFunction={searchFn}
            getItemFromUrlFunction={getJiraItemFromUrl}
            renderLinkItem={renderLinkItem}
            renderSearchResult={renderSearchResult}
            isConfigured={isJiraConfigured}
            LinkerIcon={ProviderIcon}
        />
    );
}
