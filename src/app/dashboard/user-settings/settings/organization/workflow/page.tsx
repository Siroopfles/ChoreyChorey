// DEPRECATED: This route has been moved to /dashboard/settings/organization/workflow.
// This file can be removed in a future cleanup.
'use client';
import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/settings/organization/workflow');
    return null;
}
