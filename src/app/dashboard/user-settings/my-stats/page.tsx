
'use client';
import { redirect } from 'next/navigation';

// This route has been moved to /dashboard/my-stats
export default function DeprecatedPage() {
    redirect('/dashboard/my-stats');
    return null;
}
