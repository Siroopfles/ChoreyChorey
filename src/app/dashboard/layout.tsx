'use client';
import { useAuth } from '@/contexts/auth-context';
import { TaskProvider } from '@/contexts/task-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, currentOrganization } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; 

    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user && !currentOrganization) {
      router.push('/dashboard/organization');
    }

  }, [user, loading, currentOrganization, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Organisatie laden...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TaskProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </TaskProvider>
  );
}
