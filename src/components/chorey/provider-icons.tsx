
'use client';

import { Gitlab } from 'lucide-react';

export const JiraIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.516 13.313l-9.219-9.219c-.438-.438-1.125-.438-1.563 0l-9.219 9.219c-.438-.438-.438 1.125 0 1.563l9.219 9.219c.438.438 1.125.438 1.563 0l9.219-9.219c.438-.438.438-1.125 0-1.563zm-10.781 7.438l-7.438-7.438 7.438-7.438 7.438 7.438-7.438 7.438z"></path>
    </svg>
);

export const BitbucketIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M2.531 2.375l8.594 19.25-2.093 0.938-6.5-14.563v13.625h-2.125v-19.25h2.125zM22.563 15.188l-4.125-2.531-2.031 3.406 6.156-3.75zM12.969 4.313l-1.031 2.313-4.5-2.75 5.531-3.625z"></path>
    </svg>
);

export const ClockifyIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path><path d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586z"></path>
    </svg>
);

export const GitLabIcon = ({ className }: { className?: string }) => <Gitlab className={className}/>;
