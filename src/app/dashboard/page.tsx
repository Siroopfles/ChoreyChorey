
import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
  redirect('/dashboard/general/dashboard');
  // This return is needed to satisfy TypeScript, but the redirect will happen before it's ever rendered.
  return null;
}
