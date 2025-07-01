'use client';
import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
    redirect('/dashboard/team-room');
    return null;
}
