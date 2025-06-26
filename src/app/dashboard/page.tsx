
'use client';
import { useTasks } from '@/contexts/task-context';
import TaskColumnsSkeleton from '@/components/chorey/task-columns-skeleton';

export default function DashboardPage() {
  const { loading } = useTasks();

  if (loading) {
      return <TaskColumnsSkeleton />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-bold">Dashboard Test</h1>
      <p className="text-muted-foreground">Als je dit ziet, werkt de basis van de pagina.</p>
      <p className="text-muted-foreground">De volgende stap is om componenten één voor één terug te zetten.</p>
    </div>
  );
}
