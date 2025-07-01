
'use client';

import { redirect } from 'next/navigation';

// Redirect /dashboard/general to /dashboard/general/dashboard
export default function GeneralRootPage() {
    redirect('/dashboard/general/dashboard');
    return null;
}
