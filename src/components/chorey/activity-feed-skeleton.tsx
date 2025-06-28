
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ActivityFeedSkeleton() {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <Skeleton className="h-6 w-3/5" />
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
