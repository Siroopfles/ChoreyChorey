
'use client';
import { redirect } from 'next/navigation';

// This route has been moved to /dashboard/settings/features
export default function DeprecatedPage() {
    redirect('/dashboard/settings/features');
    return null;
}
