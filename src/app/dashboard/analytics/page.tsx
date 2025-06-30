'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, AreaChart, GitBranch } from 'lucide-react';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getCycleTimeData, type CycleTimeData } from '@/app/actions/analytics.actions';
import { useToast } from '@/hooks/use-toast';
import { CycleTimeChart } from '@/components/chorey/analytics/cycle-time-chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AnalyticsPage() {
    const { currentOrganization } = useAuth();
    const { toast } = useToast();
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<CycleTimeData | null>(null);

    const handleFetchData = async () => {
        if (!currentOrganization || !date?.from || !date?.to) return;
        setIsLoading(true);
        setData(null);

        const result = await getCycleTimeData({
            organizationId: currentOrganization.id,
            startDate: date.from.toISOString(),
            endDate: date.to.toISOString(),
        });
        
        if (result.error) {
            toast({ title: 'Fout bij ophalen data', description: result.error, variant: 'destructive' });
        } else {
            setData(result.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        handleFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentOrganization]);
    
    const averageCycleTime = useMemo(() => {
        if (!data?.cycleTime || data.cycleTime.length === 0) return 'N/A';
        const total = data.cycleTime.reduce((sum, item) => sum + item.value, 0);
        const avg = total / data.cycleTime.length;
        return `${avg.toFixed(1)} dagen`;
    }, [data]);
    
    const averageLeadTime = useMemo(() => {
        if (!data?.leadTime || data.leadTime.length === 0) return 'N/A';
        const total = data.leadTime.reduce((sum, item) => sum + item.value, 0);
        const avg = total / data.leadTime.length;
        return `${avg.toFixed(1)} dagen`;
    }, [data]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><AreaChart /> Workflow Analyse</h1>
                <p className="text-muted-foreground">Krijg inzicht in de doorlooptijden van uw taken om knelpunten te identificeren.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Analyse Periode</CardTitle>
                </CardHeader>
                <CardContent className="flex items-end gap-4">
                    <div className="grid gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                id="date"
                                variant={"outline"}
                                className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y", { locale: nl })} -{" "}
                                        {format(date.to, "LLL dd, y", { locale: nl })}
                                    </>
                                    ) : (
                                    format(date.from, "LLL dd, y", { locale: nl })
                                    )
                                ) : (
                                    <span>Kies een periode</span>
                                )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button onClick={handleFetchData} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Analyseer
                    </Button>
                </CardContent>
            </Card>

            {isLoading && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card><CardContent className="h-[400px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></CardContent></Card>
                    <Card><CardContent className="h-[400px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></CardContent></Card>
                 </div>
            )}
            
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cycle Time</CardTitle>
                            <CardDescription>
                                De tijd van 'In Uitvoering' tot 'Voltooid'. Gemiddeld: <span className="font-bold">{averageCycleTime}</span>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CycleTimeChart data={data.cycleTime} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Lead Time</CardTitle>
                            <CardDescription>
                                De tijd van creatie tot 'Voltooid'. Gemiddeld: <span className="font-bold">{averageLeadTime}</span>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CycleTimeChart data={data.leadTime} />
                        </CardContent>
                    </Card>
                </div>
            )}

            {data && data.bottlenecks.length > 0 && (
                <Alert>
                    <GitBranch className="h-4 w-4" />
                    <AlertTitle>Potentiële Knelpunten Geïdentificeerd</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            {data.bottlenecks.map((bottleneck, index) => (
                                <li key={index}>{bottleneck}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
