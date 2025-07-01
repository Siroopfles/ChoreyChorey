
'use client';

import { useEffect, useState } from 'react';
import type { Task, User, Project, StatusDefinition } from '@/lib/types';
import { getPublicProjectData } from '@/app/actions/core/public.actions';
import { Loader2 } from 'lucide-react';
import PublicDashboardView from '@/components/chorey/views/PublicDashboardView';
import LandingHeader from '@/components/landing/header';
import LandingFooter from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';

export default function PublicProjectPage({ params }: { params: { projectId: string }}) {
    const { projectId } = params;
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [statuses, setStatuses] = useState<StatusDefinition[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (projectId) {
            getPublicProjectData(projectId)
                .then(result => {
                    if (result.error) {
                        setError(result.error);
                    } else if (result.data) {
                        setProject(result.data.project);
                        setTasks(result.data.tasks as Task[]); // Cast is needed because of partial User type
                        setUsers(result.data.users as User[]); // Cast is needed
                        setStatuses(result.data.statuses);
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [projectId]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            )
        }
        if (error) {
            return (
                 <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                    <h2 className="text-2xl font-bold">Toegang Geweigerd</h2>
                    <p className="text-muted-foreground">{error}</p>
                    <Button asChild><Link href="/"><Home className="mr-2 h-4 w-4"/>Naar Home</Link></Button>
                 </div>
            )
        }
        if (project) {
            return (
                <>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">{project.name}</h1>
                        <p className="text-muted-foreground">Publiek dashboard</p>
                    </div>
                    <div className="mt-8 h-[70vh]">
                        <PublicDashboardView tasks={tasks} users={users} statuses={statuses} />
                    </div>
                </>
            )
        }
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-secondary">
            <LandingHeader />
            <main className="container mx-auto py-8">
                {renderContent()}
            </main>
            <LandingFooter />
        </div>
    );
}

