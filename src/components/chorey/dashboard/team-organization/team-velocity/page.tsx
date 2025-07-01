

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, BarChartHorizontal, TrendingUp } from 'lucide-react';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils/utils';
import { getTeamVelocityData, type VelocityDataPoint } from '@/app/actions/analytics.actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useTheme } from 'next-themes';

export default function TeamVelocityPage() {
    const { currentOrganization } = useAuth();
    const { teams } = useOrganization();
    const { toast } = useToast();
    const { resolvedTheme } = useTheme();

    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -8 * 7), // last 8 weeks
        to: new Date(),
    });
    const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>(teams?.[0]?.id);
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<VelocityDataPoint[] | null>(null);

    const handleFetchData = async () => {
        if (!currentOrganization || !selectedTeamId || !date?.from || !date?.to) return;
        setIsLoading(true);
        setData(null);

        const result = await getTeamVelocityData({
            organizationId: currentOrganization.id,
            teamId: selectedTeamId,
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
        // Automatically select the first team if none is selected
        if (!selectedTeamId && teams && teams.length > 0) {
            setSelectedTeamId(teams[0].id);
        }
    }, [teams, selectedTeamId]);
    
    useEffect(() => {
        handleFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentOrganization, selectedTeamId, date]);
    
    const averageVelocity = useMemo(() => {
        if (!data || data.length === 0) return 0;
        const total = data.reduce((sum, item) => sum + item.velocity, 0);
        return (total / data.length).toFixed(1);
    }, [data]);
    
    const chartColor = resolvedTheme === 'dark' ? '#3b82f6' : '#2563eb';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><BarChartHorizontal /> Team Velocity</h1>
                <p className="text-muted-foreground">Monitor de hoeveelheid werk (in Story Points) die uw team per week voltooit.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Analyse Periode & Team</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="grid gap-2 w-full sm:w-auto">
                        <label className="text-sm font-medium">Team</label>
                        <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Selecteer een team..." />
                            </SelectTrigger>
                            <SelectContent>
                                {teams.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2 w-full sm:w-auto">
                         <label className="text-sm font-medium">Periode</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                id="date"
                                variant={"outline"}
                                className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
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
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Velocity Overzicht</CardTitle>
                    <CardDescription>
                        De gemiddelde velocity van het team in de geselecteerde periode is <span className="font-bold">{averageVelocity} punten</span> per week.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoading ? (
                        <div className="flex h-[300px] items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : data && data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsBarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="period" />
                                <YAxis allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                                <ReferenceLine y={Number(averageVelocity)} label="Gemiddeld" stroke="red" strokeDasharray="3 3" />
                                <Bar dataKey="velocity" name="Story Points" fill={chartColor} />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    ) : (
                        <Alert>
                            <TrendingUp className="h-4 w-4" />
                            <AlertTitle>Geen Data Gevonden</AlertTitle>
                            <AlertDescription>
                                Er zijn geen voltooide taken met story points gevonden voor dit team in de geselecteerde periode.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
