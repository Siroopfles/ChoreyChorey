'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Loader2, GitGraph, CalendarIcon, Bot } from 'lucide-react';
import { handleLevelWorkload } from '@/app/actions/ai.actions';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function WorkloadPage() {
    const { user, currentOrganization } = useAuth();
    const { users } = useTasks();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 6),
    });

    const handleLeveling = async () => {
        if (!user || !currentOrganization || !selectedUserId || !date?.from || !date?.to) {
            setError("Selecteer een gebruiker en een periode om de werkdruk te balanceren.");
            return;
        }

        setIsLoading(true);
        setResult('');
        setError('');

        const selectedUser = users.find(u => u.id === selectedUserId);
        if (!selectedUser) {
            setError("Geselecteerde gebruiker niet gevonden.");
            setIsLoading(false);
            return;
        }

        const input = {
            userId: selectedUserId,
            userName: selectedUser.name,
            organizationId: currentOrganization.id,
            startDate: format(date.from, 'yyyy-MM-dd'),
            endDate: format(date.to, 'yyyy-MM-dd'),
        };

        const response = await handleLevelWorkload(input);

        if (response.error) {
            setError(response.error);
        } else if (response.summary) {
            setResult(response.summary);
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><GitGraph /> Workload Balanceren</h1>
                <p className="text-muted-foreground">Laat AI de werkdruk van een teamlid analyseren en automatisch balanceren door taken te herplannen.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configureer Analyse</CardTitle>
                    <CardDescription>Selecteer een gebruiker en een periode om te analyseren.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
                     <div className="grid gap-2 flex-1">
                        <label className="font-medium text-sm">Gebruiker</label>
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
                    <div className="grid gap-2">
                        <label className="font-medium text-sm">Periode</label>
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
                    <Button onClick={handleLeveling} disabled={isLoading || !selectedUserId || !date}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitGraph className="mr-2 h-4 w-4" />}
                        Balanceer Werkdruk
                    </Button>
                </CardContent>
            </Card>

            {(result || error) && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {error ? 'Er is een fout opgetreden' : 'Analyse Resultaat'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error ? (
                            <p className="text-destructive">{error}</p>
                        ) : (
                            <Alert>
                                <Bot className="h-4 w-4" />
                                <AlertTitle>AI Samenvatting</AlertTitle>
                                <AlertDescription>{result}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
