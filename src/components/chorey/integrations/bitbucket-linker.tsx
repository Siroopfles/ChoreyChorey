

'use client';

import { useFormContext } from 'react-hook-form';
import { useAuth } from '@/contexts/user/auth-context';
import type { BitbucketLink } from '@/lib/types';
import Link from 'next/link';
import { getBitbucketItemFromUrl, searchBitbucketItems } from '@/app/actions/integrations/bitbucket.actions';
import { AlertCircle } from 'lucide-react';
import { CommandItem } from '@/components/ui/command';
import { GenericLinker } from './GenericLinker';
import { BitbucketIcon } from '@/components/chorey/common/provider-icons';


const renderLinkItem = (item: BitbucketLink) => (
    <div className="flex items-center gap-2 overflow-hidden">
        <BitbucketIcon className="h-4 w-4 text-blue-600 shrink-0" />
        <Link href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" onClick={e => e.stopPropagation()}>
            <span className="text-muted-foreground">#{item.id}</span> <span className="truncate">{item.title}</span>
        </Link>
    </div>
);

const renderSearchResult = (item: BitbucketLink, onSelect: (item: BitbucketLink) => void) => (
    <CommandItem
        key={item.url}
        value={`${item.id} ${item.title}`}
        onSelect={() => onSelect(item)}
        className="flex items-center gap-2"
    >
        <BitbucketIcon className="h-4 w-4" />
        <span>#{item.id}</span>
        <span className="truncate">{item.title}</span>
    </CommandItem>
);

export function BitbucketLinker() {
    const { control } = useFormContext();
    const { currentOrganization } = useAuth();

    const isConfigured = !!currentOrganization?.settings?.features?.bitbucket && !!currentOrganization?.settings?.bitbucket?.repos?.length;
    const configuredRepos = currentOrganization?.settings?.bitbucket?.repos || [];
    
    return (
        <GenericLinker<BitbucketLink>
            linkerName="Bitbucket"
            fieldArrayName="bitbucketLinks"
            getUniqueKey={(item) => item.url}
            getDisplayId={(item) => `#${item.id}`}
            searchFunction={(orgId, repo, term) => searchBitbucketItems(orgId, repo, term)}
            getItemFromUrlFunction={getBitbucketItemFromUrl}
            renderLinkItem={renderLinkItem}
            renderSearchResult={renderSearchResult}
            projectOrRepoConfig={{
                label: 'Repository',
                placeholder: 'Selecteer repo',
                options: configuredRepos,
            }}
            isConfigured={isConfigured}
            LinkerIcon={BitbucketIcon}
        />
    );
}
