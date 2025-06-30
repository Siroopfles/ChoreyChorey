
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardViewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
            <Card className="h-[300px]">
                <CardHeader><Skeleton className="w-1/2 h-6" /></CardHeader>
                <CardContent><Skeleton className="w-40 h-40 rounded-full mx-auto" /></CardContent>
            </Card>
             <Card className="h-[300px]">
                <CardHeader><Skeleton className="w-1/2 h-6" /></CardHeader>
                <CardContent><Skeleton className="w-full h-40" /></CardContent>
            </Card>
        </div>
        <Card className="h-[300px] md:h-auto md:row-span-2">
            <CardHeader><Skeleton className="w-1/2 h-6" /></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                         <div key={i} className="flex items-start gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
        <Card className="h-[300px]">
             <CardHeader><Skeleton className="w-1/2 h-6" /></CardHeader>
             <CardContent><Skeleton className="w-40 h-40 rounded-full mx-auto" /></CardContent>
        </Card>
    </div>
  );
}
