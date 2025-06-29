
'use client';

import { GitHubLinker } from '../github-linker';
import { GitLabLinker } from '../gitlab-linker';
import { BitbucketLinker } from '../bitbucket-linker';
import { JiraLinker } from '../jira-linker';
import { TogglProjectSelector } from '../toggl-project-selector';
import { ClockifyProjectSelector } from '../clockify-project-selector';

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
