
'use client';

import { GitHubLinker } from '@/components/chorey/integrations/github-linker';
import { GitLabLinker } from '@/components/chorey/integrations/gitlab-linker';
import { BitbucketLinker } from '@/components/chorey/integrations/bitbucket-linker';
import { JiraLinker } from '@/components/chorey/integrations/jira-linker';
import { TogglProjectSelector } from '@/components/chorey/integrations/toggl-project-selector';
import { ClockifyProjectSelector } from '@/components/chorey/integrations/clockify-project-selector';

export function TaskFormIntegrations() {
    return (
        <div className="space-y-4">
            <TogglProjectSelector />
            <ClockifyProjectSelector />
            <GitHubLinker />
            <GitLabLinker />
            <BitbucketLinker />
            <JiraLinker />
        </div>
    );
}
