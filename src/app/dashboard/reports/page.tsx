
'use client';

import { useState, useMemo } from 'react';
import { useTasks } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilePieChart, BarChart3, Settings2, Users as UsersIcon, ListChecks, ArrowUpNarrowWide, Hash, Database, Trophy } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { Task, User } from '@/lib/types';
import { calculatePoints } from '@/lib/utils';
import { cn } from '@/lib/utils';

type ReportConfig = {
    name: string;
    chartType: 'bar' | 'pie';
    groupBy: 'status' | 'priority' | 'assignee';
    metric: 'count' | 'storyPoints' | 'points';
};

type ReportData = {
    name: string;
    value: number;
    fill?: string;
}[];

const chartOptions: { value: 'bar' | 'pie'; label: string; icon: React.ElementType }[] = [
    { value: 'bar', label: 'Staafdiagram', icon: BarChart3 },
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
    const { resolvedTheme } = useTheme();

    const [config, setConfig] = useState<ReportConfig>({
        name: 'Nieuw Rapport',
        chartType: 'bar',
        groupBy: 'status',
        metric: 'count',
    });
    const [reportData, setReportData] = useState<ReportData | null>(null);

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
                <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" name={config.metric}>
                         {reportData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
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
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Genereer Rapport
                    </Button>
                </CardFooter>
            </Card>

            {reportData && (
                <Card>
                    <CardHeader>
                        <CardTitle>{config.name}</CardTitle>
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

        </div>
    );
}
