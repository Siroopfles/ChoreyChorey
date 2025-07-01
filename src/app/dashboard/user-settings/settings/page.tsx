
'use client';
import { redirect } from 'next/navigation';

// This route has been moved to /dashboard/settings
export default function DeprecatedPage() {
    redirect('/dashboard/settings');
    return null;
}
