
'use client';
import { redirect } from 'next/navigation';

// This route has been moved to /dashboard/settings/organization/limits which contains security settings.
export default function DeprecatedPage() {
    redirect('/dashboard/settings/organization/limits');
    return null;
}
