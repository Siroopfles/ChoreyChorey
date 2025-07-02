'use client';
import { redirect } from 'next/navigation';

// DEPRECATED: This page has been moved.
export default function DeprecatedPage() {
    redirect('/dashboard/headcount');
    return null;
}
