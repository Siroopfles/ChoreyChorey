// DEPRECATED: This route has been moved to /dashboard/organization/roles.
// This file can be removed in a future cleanup.
'use client';
import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/organization/roles');
    return null;
}
