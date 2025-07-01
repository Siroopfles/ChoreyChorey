
'use client';
import { redirect } from 'next/navigation';

// This route has been moved to /dashboard/settings/organization/developer
export default function DeprecatedPage() {
    redirect('/dashboard/settings/organization/developer');
    return null;
}
