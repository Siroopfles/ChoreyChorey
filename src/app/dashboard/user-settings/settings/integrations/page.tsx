
'use client';
import { redirect } from 'next/navigation';

// This route has been moved to /dashboard/settings/integrations
export default function DeprecatedPage() {
    redirect('/dashboard/settings/integrations');
    return null;
}
