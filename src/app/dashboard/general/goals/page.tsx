'use client';
import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/goals');
    return null;
}
