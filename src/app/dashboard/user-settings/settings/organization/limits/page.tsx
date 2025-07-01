
'use client';
import { redirect } from 'next/navigation';

// This route has been moved to /dashboard/settings/organization/limits
export default function DeprecatedPage() {
    redirect('/dashboard/settings/organization/limits');
    return null;
}
