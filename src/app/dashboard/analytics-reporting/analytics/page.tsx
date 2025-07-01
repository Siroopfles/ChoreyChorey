
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, AreaChart, GitBranch, DatabaseZap, AlertOctagon } from 'lucide-react';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils/utils';
import { getCycleTimeData, type CycleTimeData, getCfdData, type CfdDataPoint, getBlockerAnalysisData, type BlockerAnalysisData } from '@/app/actions/analytics.actions';
import { useToast } from '@/hooks/use-toast';
import { CycleTimeChart } from '@/components/chorey/analytics/cycle-time-chart';
import { CfdChart } from '@/components/chorey/analytics/cfd-chart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AnalyticsPage() {
    const { currentOrganization } = useAuth();
    const { toast } = useToast();
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [isLoading, setIsLoading] = useState(false);
    const [cycleTimeData, setCycleTimeData] = useState<CycleTimeData | null>(null);
    const [cfdData, setCfdData] = useState<CfdDataPoint[] | null>(null);
    const [cfdStatuses, setCfdStatuses] = useState<string[] | null>(null);
    const [blockerData, setBlockerData] = useState<BlockerAnalysisData | null>(null);

    const handleFetchData = async () => {
        if (!currentOrganization || !date?.from || !date?.to) return;
        setIsLoading(true);
        setCycleTimeData(null);
        setCfdData(null);
        setCfdStatuses(null);
        setBlockerData(null);

        const [cycleTimeResult, cfdResult, blockerResult] = await Promise.all([
            getCycleTimeData({
                organizationId: currentOrganization.id,
                startDate: date.from.toISOString(),
                endDate: date.to.toISOString(),
            }),
            getCfdData({
                organizationId: currentOrganization.id,
                startDate: date.from.toISOString(),
                endDate: date.to.toISOString(),
            }),
            getBlockerAnalysisData({
                organizationId: currentOrganization.id,
            }),
        ]);
        
        if (cycleTimeResult.error) {
            toast({ title: 'Fout bij ophalen Cycle Time data', description: cycleTimeResult.error, variant: 'destructive' });
        } else {
            setCycleTimeData(cycleTimeResult.data);
        }

        if (cfdResult.error) {
            toast({ title: 'Fout bij ophalen CFD data', description: cfdResult.error, variant: 'destructive' });
        } else {
            setCfdData(cfdResult.data);
            setCfdStatuses(cfdResult.statuses);
        }
        
        if (blockerResult.error) {
            toast({ title: 'Fout bij ophalen Blocker data', description: blockerResult.error, variant: 'destructive' });
        } else {
            setBlockerData(blockerResult.data);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        handleFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentOrganization]);
    
    const averageCycleTime = useMemo(() => {
        if (!cycleTimeData?.cycleTime || cycleTimeData.cycleTime.length === 0) return 'N/A';
        const total = cycleTimeData.cycleTime.reduce((sum, item) => sum + item.value, 0);
        const avg = total / cycleTimeData.cycleTime.length;
        return `${avg.toFixed(1)} dagen`;
    }, [cycleTimeData]);
    
    const averageLeadTime = useMemo(() => {
        if (!cycleTimeData?.leadTime || cycleTimeData.leadTime.length === 0) return 'N/A';
        const total = cycleTimeData.leadTime.reduce((sum, item) => sum + item.value, 0);
        const avg = total / cycleTimeData.leadTime.length;
        return `${avg.toFixed(1)} dagen`;
    }, [cycleTimeData]);

    const renderCycleTimeContent = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Cycle Time</CardTitle>
                        <CardDescription>
                            De tijd van 'In Uitvoering' tot 'Voltooid'. Gemiddeld: <span className="font-bold">{averageCycleTime}</span>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CycleTimeChart data={cycleTimeData?.cycleTime || []} />
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
                        <CycleTimeChart data={cycleTimeData?.leadTime || []} />
                    </CardContent>
                </Card>
            </div>
             {cycleTimeData && cycleTimeData.bottlenecks.length > 0 && (
                <Alert>
                    <GitBranch className="h-4 w-4" />
                    <AlertTitle>Potentiële Knelpunten Geïdentificeerd</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            {cycleTimeData.bottlenecks.map((bottleneck, index) => (
                                <li key={index}>{bottleneck}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
    
    const renderCfdContent = () => (
        <Card>
            <CardHeader>
                <CardTitle>Cumulative Flow Diagram (CFD)</CardTitle>
                <CardDescription>
                    Visualiseer de voortgang van taken door de verschillende workflow-statussen over tijd. Dit helpt bij het identificeren van knelpunten en het managen van werk-in-uitvoering (WIP).
                </CardDescription>
            </CardHeader>
            <CardContent>
                {cfdData && cfdStatuses ? (
                    <CfdChart data={cfdData} statuses={cfdStatuses} />
                ) : <p>Geen data om weer te geven.</p>}
            </CardContent>
        </Card>
    );

    const renderBlockerContent = () => (
        <Card>
            <CardHeader>
                <CardTitle>Top 10 Blokkades</CardTitle>
                <CardDescription>
                   Taken die het vaakst de voortgang van andere taken blokkeren.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {blockerData && blockerData.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Blokkerende Taak</TableHead>
                                <TableHead className="text-right">Aantal Taken Geblokkeerd</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {blockerData.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell className="text-right font-bold">{item.blockedCount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Geen blokkerende taken gevonden in deze organisatie.</p>
                )}
            </CardContent>
        </Card>
    );

    const renderSkeleton = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardContent className="h-[400px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></CardContent></Card>
            <Card><CardContent className="h-[400px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></CardContent></Card>
         </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><AreaChart /> Workflow Analyse</h1>
                <p className="text-muted-foreground">Krijg inzicht in de flow en doorlooptijden van uw taken.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Analyse Periode</CardTitle>
                    <CardDescription>De Blocker Analyse kijkt naar alle taken, ongeacht de periode.</CardDescription>
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

            <Tabs defaultValue="cycle-time" className="w-full">
                <TabsList>
                    <TabsTrigger value="cycle-time"><GitBranch className="mr-2 h-4 w-4" /> Cycle & Lead Time</TabsTrigger>
                    <TabsTrigger value="cfd"><DatabaseZap className="mr-2 h-4 w-4" /> Cumulative Flow</TabsTrigger>
                    <TabsTrigger value="blockers"><AlertOctagon className="mr-2 h-4 w-4" /> Blocker Analyse</TabsTrigger>
                </TabsList>
                <TabsContent value="cycle-time" className="mt-6">
                    {isLoading ? renderSkeleton() : renderCycleTimeContent()}
                </TabsContent>
                <TabsContent value="cfd" className="mt-6">
                    {isLoading ? renderSkeleton() : renderCfdContent()}
                </TabsContent>
                 <TabsContent value="blockers" className="mt-6">
                    {isLoading ? renderSkeleton() : renderBlockerContent()}
                </TabsContent>
            </Tabs>
        </div>
    );
}
