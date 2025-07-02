// DEPRECATED: This route has been moved to /dashboard/settings/organization/developer.
// This file can be removed in a future cleanup.
'use client';
import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/settings/organization/developer');
    return null;
}
