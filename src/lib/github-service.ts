
'use server';

import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function searchIssuesAndPRs(owner: string, repo: string, query: string) {
    // Construct a query to search for issues and PRs in the specified repo
    const q = `${query} repo:${owner}/${repo}`;
    try {
        const response = await octokit.search.issuesAndPullRequests({ q });
        return response.data.items.map(item => ({
            number: item.number,
            title: item.title,
            url: item.html_url,
            state: item.state as 'open' | 'closed',
            type: item.pull_request ? 'pull-request' : 'issue',
        }));
    } catch (error) {
        console.error('GitHub API search error:', error);
        throw new Error('Failed to search GitHub.');
    }
}

export async function getIssueOrPr(owner: string, repo: string, issue_number: number) {
    try {
        const response = await octokit.issues.get({
            owner,
            repo,
            issue_number,
        });
        
        let state: 'open' | 'closed' | 'merged' = response.data.state as 'open' | 'closed';
        if (response.data.pull_request && response.data.pull_request.merged_at) {
            state = 'merged';
        }

        return {
            number: response.data.number,
            title: response.data.title,
            url: response.data.html_url,
            state: state,
            type: response.data.pull_request ? 'pull-request' : 'issue',
        };
    } catch (error) {
        console.error('GitHub API get issue/pr error:', error);
        throw new Error('Failed to get GitHub item.');
    }
}

export async function addComment(owner: string, repo: string, issue_number: number, body: string) {
    try {
        await octokit.issues.createComment({
            owner,
            repo,
            issue_number,
            body,
        });
    } catch (error) {
        console.error('GitHub API add comment error:', error);
        throw new Error('Failed to add comment to GitHub item.');
    }
}
