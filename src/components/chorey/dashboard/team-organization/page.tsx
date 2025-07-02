// DEPRECATED: This file is a duplicate and should not be used.
// The correct page file is located at /src/app/dashboard/team-organization/page.tsx
// This file can be removed in a future cleanup.
'use client';
import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/organization');
    return null;
}
