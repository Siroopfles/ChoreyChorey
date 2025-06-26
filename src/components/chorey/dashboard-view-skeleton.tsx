
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardViewSkeleton() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-2/5" />
                    <Skeleton className="h-4 w-4/5 mt-1" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="mx-auto aspect-square h-[250px] rounded-full" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-2/5" />
                    <Skeleton className="h-4 w-4/5 mt-1" />
                </CardHeader>
                <CardContent className="space-y-2 h-[250px] pt-6">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-2/5" />
                    <Skeleton className="h-4 w-4/5 mt-1" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="mx-auto aspect-square h-[250px] rounded-full" />
                </CardContent>
            </Card>
        </div>
    )
}
