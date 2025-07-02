// DEPRECATED: The route /dashboard/general/dashboard is obsolete.
// The main dashboard is now directly at /dashboard.
// This file can be removed in a future cleanup.
'use client';
import { redirect } from 'next/navigation';

export default function DeprecatedPage() {
  redirect('/dashboard');
  return null;
}
