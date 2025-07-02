// DEPRECATED: This route has been moved to /dashboard/my-stats.
// This file can be removed in a future cleanup.
'use client';
import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/my-stats');
    return null;
}
