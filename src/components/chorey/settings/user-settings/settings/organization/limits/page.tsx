'use client';
import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/settings/organization/limits');
    return null;
}
