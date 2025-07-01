
'use client';

import { useState, useMemo } from 'react';
import { useTasks } from '@/contexts/feature/task-context';
import { useReports } from '@/contexts/feature/report-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilePieChart, BarChart, Settings2, Users as UsersIcon, ListChecks, ArrowUpNarrowWide, Hash, Database, Trophy, CalendarClock, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { Task, User, ReportConfig, ScheduledReport } from '@/lib/types';
import { calculatePoints } from '@/lib/utils/gamification-utils';
import { cn } from '@/lib/utils/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogCancel, AlertDialogAction, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { ScheduleReportDialog } from '@/components/chorey/reports/ScheduleReportDialog';


const chartOptions: { value: 'bar' | 'pie'; label: string; icon: React.ElementType }[] = [
    { value: 'bar', label: 'Staafdiagram', icon: BarChart },
    { value: 'pie', label: 'Cirkeldiagram', icon: FilePieChart }
];

const groupOptions: { value: 'status' | 'priority' | 'assignee'; label: string; icon: React.ElementType }[] = [
    { value: 'status', label: 'Status', icon: ListChecks },
    { value: 'priority', label: 'Prioriteit', icon: ArrowUpNarrowWide },
    { value: 'assignee', label: 'Toegewezen aan', icon: UsersIcon }
];

const metricOptions: { value: 'count' | 'storyPoints' | 'points'; label: string; icon: React.ElementType }[] = [
    { value: 'count', label: 'Aantal taken', icon: Hash },
    { value: 'storyPoints', label: 'Totaal Story Points', icon: Database },
    { value: 'points', label: 'Totaal Punten', icon: Trophy }
];


const OptionCard = ({ option, selected, onSelect }: { option: { value: any; label: string; icon: React.ElementType }, selected: boolean, onSelect: () => void }) => {
    const Icon = option.icon;
    return (
        <button
            onClick={onSelect}
            className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-center transition-colors hover:bg-accent",
                selected && "bg-primary/10 border-primary ring-2 ring-primary text-primary"
            )}
        >
            <Icon className="h-8 w-8" />
            <span className="text-sm font-semibold">{option.label}</span>
        </button>
    )
}

export default function ReportsPage() {
    const { tasks, users, loading } = useTasks();
    const { scheduledReports, manageScheduledReport } = useReports();
    const { resolvedTheme } = useTheme();
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<ScheduledReport | null>(null);

    const [config, setConfig] = useState<ReportConfig>({
        name: 'Nieuw Rapport',
        chartType: 'bar',
        groupBy: 'status',
        metric: 'count',
    });
    const [reportData, setReportData] = useState<any[] | null>(null);

    const handleGenerateReport = () => {
        const dataMap: { [key: string]: { count: number; storyPoints: number, points: number } } = {};
        
        const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Onbekend';

        tasks.forEach(task => {
            let keys: string[] = [];
            if (config.groupBy === 'assignee') {
                if (task.assigneeIds.length > 0) {
                    keys = task.assigneeIds.map(getUserName);
                } else {
                    keys = ['Niet toegewezen'];
                }
            } else {
                keys = [task[config.groupBy]];
            }

            keys.forEach(key => {
                if (!dataMap[key]) {
                    dataMap[key] = { count: 0, storyPoints: 0, points: 0 };
                }
                dataMap[key].count += 1;
                dataMap[key].storyPoints += task.storyPoints || 0;
                dataMap[key].points += calculatePoints(task.priority, task.storyPoints);
            });
        });

        const lightness = resolvedTheme === 'dark' ? 60 : 45;
        const generatedData = Object.entries(dataMap).map(([name, values], index) => ({
            name,
            value: values[config.metric],
            fill: `hsl(${200 + index * 40}, 70%, ${lightness}%)`
        }));
        
        setReportData(generatedData);
    };
    
    const handleEditSchedule = (schedule: ScheduledReport) => {
        setEditingSchedule(schedule);
        setScheduleDialogOpen(true);
    };

    const handleDeleteSchedule = (scheduleId: string) => {
        manageScheduledReport('delete', undefined, scheduleId);
    };


    const renderChart = () => {
        if (!reportData) return null;

        if (config.chartType === 'pie') {
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <RechartsTooltip />
                        <Pie data={reportData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {reportData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            );
        }

        return (
             <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" name={config.metric}>
                         {reportData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                </RechartsBarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <>
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><FilePieChart /> Rapportagebouwer</h1>
                <p className="text-muted-foreground">Creëer en visualiseer aangepaste rapporten op basis van uw taakgegevens.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings2 />Rapport Configuratie</CardTitle>
                    <CardDescription>Stel uw rapport samen door opties te selecteren en klik op 'Genereer'.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label>1. Kies een grafiektype</Label>
                        <div className="grid grid-cols-2 gap-4">
                            {chartOptions.map(option => (
                                <OptionCard 
                                    key={option.value}
                                    option={option}
                                    selected={config.chartType === option.value}
                                    onSelect={() => setConfig(c => ({...c, chartType: option.value}))}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>2. Kies hoe te groeperen</Label>
                        <div className="grid grid-cols-3 gap-4">
                            {groupOptions.map(option => (
                                <OptionCard 
                                    key={option.value}
                                    option={option}
                                    selected={config.groupBy === option.value}
                                    onSelect={() => setConfig(c => ({...c, groupBy: option.value}))}
                                />
                            ))}
                        </div>
                    </div>
                    
                     <div className="space-y-2">
                        <Label>3. Kies een meetwaarde</Label>
                        <div className="grid grid-cols-3 gap-4">
                            {metricOptions.map(option => (
                                <OptionCard 
                                    key={option.value}
                                    option={option}
                                    selected={config.metric === option.value}
                                    onSelect={() => setConfig(c => ({...c, metric: option.value}))}
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4">
                    <div className="space-y-1 w-full max-w-sm">
                        <Label htmlFor="report-name">4. Geef uw rapport een naam</Label>
                        <Input id="report-name" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} />
                    </div>
                     <Button onClick={handleGenerateReport} disabled={loading}>
                        <BarChart className="mr-2 h-4 w-4" />
                        Genereer Rapport
                    </Button>
                </CardFooter>
            </Card>

            {reportData && (
                <Card>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div>
                            <CardTitle>{config.name}</CardTitle>
                            <CardDescription>Gegevens gebaseerd op de huidige filters.</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => { setEditingSchedule(null); setScheduleDialogOpen(true); }}>
                            <CalendarClock className="mr-2 h-4 w-4" />
                            Rapport Inplannen
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-[350px]">
                            {renderChart()}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Gegevens</h3>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="capitalize">{config.groupBy}</TableHead>
                                            <TableHead className="text-right capitalize">{config.metric.replace('storyPoints', 'Story Points')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportData.map(row => (
                                            <TableRow key={row.name}>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell className="text-right">{row.value.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarClock/>Geplande Rapporten</CardTitle>
                    <CardDescription>Overzicht van alle rapporten die automatisch worden verzonden.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Naam</TableHead>
                                    <TableHead>Frequentie</TableHead>
                                    <TableHead>Ontvangers</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scheduledReports.length > 0 ? scheduledReports.map(schedule => (
                                    <TableRow key={schedule.id}>
                                        <TableCell className="font-medium">{schedule.name}</TableCell>
                                        <TableCell className="capitalize">{schedule.schedule}</TableCell>
                                        <TableCell className="text-muted-foreground truncate max-w-xs">{schedule.recipients.join(', ')}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={() => handleEditSchedule(schedule)}><Edit className="mr-2 h-4 w-4"/>Bewerken</DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4"/>Verwijderen</DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Weet je zeker?</AlertDialogTitle>
                                                                <AlertDialogDescription>Deze actie kan niet ongedaan worden gemaakt.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteSchedule(schedule.id)} className="bg-destructive hover:bg-destructive/90">Verwijderen</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">Geen geplande rapporten.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
             </Card>
        </div>
        <ScheduleReportDialog
            open={scheduleDialogOpen}
            onOpenChange={setScheduleDialogOpen}
            schedule={editingSchedule}
            reportConfig={config}
        />
        </>
    );
}
