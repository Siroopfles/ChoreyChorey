// DEPRECATED: This route has been moved to /dashboard/settings/profile.
// This file can be removed in a future cleanup.
'use client';
import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/settings/profile');
    return null;
}
