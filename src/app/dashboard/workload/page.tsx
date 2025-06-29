
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Loader2, GitGraph, CalendarIcon, Bot, BarChart } from 'lucide-react';
import { levelWorkload } from '@/ai/flows/level-workload-flow';
import { getWorkloadData, type GetWorkloadDataOutput } from '@/app/actions/workload.actions';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useTheme } from 'next-themes';

const CAPACITY_THRESHOLD = 8;

export default function WorkloadPage() {
    const { user, currentOrganization, users } = useAuth();
    const [isBalancerLoading, setIsBalancerLoading] = useState(false);
    const [isChartLoading, setIsChartLoading] = useState(true);
    const [balancerResult, setBalancerResult] = useState('');
    const [balancerError, setBalancerError] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    const { resolvedTheme } = useTheme();
    
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 6),
    });

    const [workloadData, setWorkloadData] = useState<GetWorkloadDataOutput>([]);

    useEffect(() => {
        if (currentOrganization && date?.from && date?.to) {
            setIsChartLoading(true);
            getWorkloadData({
                organizationId: currentOrganization.id,
                startDate: format(date.from, 'yyyy-MM-dd'),
                endDate: format(date.to, 'yyyy-MM-dd'),
            }).then(({ data }) => {
                if (data) {
                    setWorkloadData(data);
                }
                setIsChartLoading(false);
            });
        }
    }, [currentOrganization, date]);

    const { chartData, allUserNames } = useMemo(() => {
        const userNames = new Set<string>();
        const usersById = new Map(users.map(u => [u.id, u]));

        workloadData.forEach(day => {
            Object.values(day.users).forEach(u => userNames.add(u.name));
            day.unavailableUserIds.forEach(id => {
                const user = usersById.get(id);
                if (user) userNames.add(user.name);
            });
        });

        const data = workloadData.map(day => {
            const dayData: any = {
                date: format(new Date(day.date), 'EEE d', { locale: nl }),
                total: day.totalPoints,
            };
            const unavailableIdsOnThisDay = day.unavailableUserIds || [];

            userNames.forEach(name => {
                const user = users.find(u => u.name === name);
                const isUnavailable = user ? unavailableIdsOnThisDay.includes(user.id) : false;

                if (isUnavailable) {
                    dayData[name] = 0; // Don't show regular workload
                    dayData[`${name}-unavailable`] = CAPACITY_THRESHOLD; // Show unavailable bar
                } else {
                    const userWorkload = Object.values(day.users).find(u => u.name === name);
                    dayData[name] = userWorkload?.points || 0;
                    dayData[`${name}-unavailable`] = 0;
                }
            });
            return dayData;
        });

        return { chartData: data, allUserNames: Array.from(userNames) };
    }, [workloadData, users]);
    
    const userColors = useMemo(() => {
        const colors: Record<string, string> = {};
        const lightness = resolvedTheme === 'dark' ? 60 : 45;
        allUserNames.forEach((name, index) => {
            colors[name] = `hsl(${200 + index * 40}, 70%, ${lightness}%)`;
        });
        return colors;
    }, [allUserNames, resolvedTheme]);

    const handleLeveling = async () => {
        if (!user || !currentOrganization || !selectedUserId || !date?.from || !date?.to) {
            setBalancerError("Selecteer een gebruiker en een periode om de werkdruk te balanceren.");
            return;
        }

        setIsBalancerLoading(true);
        setBalancerResult('');
        setBalancerError('');

        const selectedUser = users.find(u => u.id === selectedUserId);
        if (!selectedUser) {
            setBalancerError("Geselecteerde gebruiker niet gevonden.");
            setIsBalancerLoading(false);
            return;
        }

        const input = {
            userId: selectedUserId,
            userName: selectedUser.name,
            organizationId: currentOrganization.id,
            startDate: format(date.from, 'yyyy-MM-dd'),
            endDate: format(date.to, 'yyyy-MM-dd'),
        };

        const summary = await levelWorkload(input);

        setBalancerResult(summary);
        // Refetch chart data after leveling
        if(currentOrganization && date?.from && date?.to) {
            getWorkloadData({
                organizationId: currentOrganization.id,
                startDate: format(date.from, 'yyyy-MM-dd'),
                endDate: format(date.to, 'yyyy-MM-dd'),
            }).then(({ data }) => {
                if (data) setWorkloadData(data);
            });
        }
        setIsBalancerLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><GitGraph /> Workload</h1>
                <p className="text-muted-foreground">Visualiseer de werkdruk van het team en balanceer deze met behulp van AI.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart/> Team Werkdruk Visualisatie</CardTitle>
                     <div className="grid gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full sm:w-[300px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
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
                </CardHeader>
                 <CardContent>
                    {isChartLoading ? (
                        <div className="h-[300px] flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <svg>
                                <defs>
                                    <pattern id="pattern-stripe" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                        <rect width="2.5" height="4" transform="translate(0,0)" fill="hsl(var(--muted-foreground))" opacity="0.3"></rect>
                                    </pattern>
                                </defs>
                            </svg>
                            <RechartsBarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <ReferenceLine y={CAPACITY_THRESHOLD} label={{ value: "Capaciteit", position: 'insideTopLeft' }} stroke="red" strokeDasharray="3 3" />
                                {allUserNames.map(name => (
                                    <Bar key={name} dataKey={name} stackId="a" fill={userColors[name] || '#8884d8'} />
                                ))}
                                {allUserNames.map(name => (
                                    <Bar key={`${name}-unavailable`} dataKey={`${name}-unavailable`} stackId="a" fill="url(#pattern-stripe)" />
                                ))}
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    )}
                 </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot/> Werkdruk Balanceren (AI)</CardTitle>
                    <CardDescription>Selecteer een gebruiker om hun werkdruk automatisch te laten herplannen door AI.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:flex sm:items-end sm:gap-4 sm:space-y-0">
                     <div className="grid gap-2 flex-1">
                        <label className="text-sm font-medium">Gebruiker</label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecteer een gebruiker..." />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleLeveling} disabled={isBalancerLoading || !selectedUserId || !date}>
                        {isBalancerLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitGraph className="mr-2 h-4 w-4" />}
                        Balanceer Werkdruk
                    </Button>
                </CardContent>
                {(balancerResult || balancerError) && (
                    <CardContent>
                        {balancerError ? (
                            <p className="text-sm text-destructive">{balancerError}</p>
                        ) : (
                            <Alert>
                                <Bot className="h-4 w-4" />
                                <AlertTitle>AI Samenvatting</AlertTitle>
                                <AlertDescription>{balancerResult}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                )}
            </Card>

        </div>
    );
}
