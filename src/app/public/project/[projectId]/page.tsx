

import { getPublicProjectData } from '@/app/actions/public.actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import PublicDashboardView from '@/components/chorey/public/PublicDashboardView';

export default async function PublicProjectPage({ params }: { params: { projectId: string } }) {
    const { data, error } = await getPublicProjectData(params.projectId);

    if (error || !data) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Fout bij laden</AlertTitle>
                    <AlertDescription>
                        {error || 'Het project kon niet worden geladen. Controleer of de link correct is en of het project openbaar is.'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    
    const { project, tasks, users, statuses } = data;
    
    return (
         <div className="flex flex-col min-h-screen bg-muted/40">
            <header className="py-4 px-6 border-b bg-background sticky top-0 z-10">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-muted-foreground">Publiek Dashboard</p>
            </header>
            <main className="flex-1 p-4 md:p-6 overflow-x-auto">
                <PublicDashboardView tasks={tasks} users={users} statuses={statuses} />
            </main>
        </div>
    );
}

