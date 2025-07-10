
'use client';

import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/shop');
    return null;
}
