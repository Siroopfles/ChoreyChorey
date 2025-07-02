// DEPRECATED: This route has been moved to /dashboard/profile/[userId].
// This file can be removed in a future cleanup.
'use client';
import { redirect } from 'next/navigation';

export default function DeprecatedPage({ params }: { params: { userId: string } }) {
    redirect(`/dashboard/profile/${params.userId}`);
    return null;
}
