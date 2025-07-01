
'use client';
import { redirect } from 'next/navigation';

// This route has been moved to /dashboard/settings/bookmarklet
export default function DeprecatedPage() {
    redirect('/dashboard/settings/bookmarklet');
    return null;
}
