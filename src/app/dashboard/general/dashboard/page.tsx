
'use client';

import { redirect } from 'next/navigation';

export default function DeprecatedDashboardPage() {
  redirect('/dashboard');
  return null;
}
