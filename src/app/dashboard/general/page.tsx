
'use client';

import { redirect } from 'next/navigation';

// Redirect /dashboard/general to /dashboard
export default function GeneralRootPage() {
    redirect('/dashboard');
    return null;
}
