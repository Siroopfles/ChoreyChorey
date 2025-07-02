// DEPRECATED: This page has been moved.
'use client';

import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/settings/organization');
    return null;
}
