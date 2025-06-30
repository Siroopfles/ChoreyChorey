
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function GanttViewSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-1/3 mt-1" />
            </CardHeader>
            <CardContent className="h-[600px] w-full space-y-4 pr-6">
                 <div className="flex gap-4 h-full">
                    <div className="w-[150px] space-y-6 pt-2">
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-3/4" />
                         <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-5/6" />
                         <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="flex-1 space-y-6 pt-2 border-l pl-4">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3 ml-[10%]" />
                        <Skeleton className="h-4 w-1/2 ml-[5%]" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/3 ml-[40%]" />
                    </div>
                 </div>
            </CardContent>
        </Card>
    )
}
