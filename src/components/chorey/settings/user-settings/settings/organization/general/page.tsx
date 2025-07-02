// DEPRECATED: This file is a duplicate and should not be used.
// The correct page file is located at /src/app/dashboard/user-settings/settings/organization/general/page.tsx
// This file can be removed in a future cleanup.
'use client';
import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/settings/organization');
    return null;
}
