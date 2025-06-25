import { Skeleton } from '@/components/ui/skeleton';

export default function TaskColumnsSkeleton() {
  const columns = ['Te Doen', 'In Uitvoering', 'In Review', 'Voltooid'];

  return (
    <div className="flex gap-6 pb-4">
      {columns.map((title) => (
        <div key={title} className="flex flex-col w-[320px] shrink-0">
          <div className="flex items-center gap-2 px-1 pb-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>
          <div className="flex-grow space-y-3 p-2 rounded-md bg-muted min-h-[200px]">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
