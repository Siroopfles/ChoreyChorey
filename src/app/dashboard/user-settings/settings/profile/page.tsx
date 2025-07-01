
'use client';
import { redirect } from 'next/navigation';

// This route has been moved to /dashboard/settings/profile
export default function DeprecatedPage() {
    redirect('/dashboard/settings/profile');
    return null;
}
