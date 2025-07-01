
'use client';
import { redirect } from 'next/navigation';

// This route has been moved to /dashboard/settings/organization/workflow
export default function DeprecatedPage() {
    redirect('/dashboard/settings/organization/workflow');
    return null;
}
