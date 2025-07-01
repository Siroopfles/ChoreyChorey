
'use client';
// This route is deprecated. Redirect to a relevant page.
import { redirect } from 'next/navigation';

export default function TeamOrganizationRootPage() {
    redirect('/dashboard/organization');
    return null;
}
