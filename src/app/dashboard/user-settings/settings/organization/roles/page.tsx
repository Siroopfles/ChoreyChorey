
'use client';
import { redirect } from 'next/navigation';

// This route has been moved to /dashboard/organization/roles
export default function DeprecatedPage() {
    redirect('/dashboard/organization/roles');
    return null;
}
