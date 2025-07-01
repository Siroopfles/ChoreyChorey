
'use client';

import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/organization/roles');
    return null;
}
