
'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, TableProperties } from 'lucide-react';
import { useAuth } from '@/contexts/user/auth-context';
import { handleImportTasks } from '@/app/actions/project/task-import.actions';

type ImportTasksDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type Step = 'upload' | 'mapping' | 'importing';

export default function ImportTasksDialog({ open, onOpenChange }: ImportTasksDialogProps) {
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const { toast } = useToast();
    const { user, currentOrganization } = useAuth();
    
    const taskFields = ['title', 'description', 'priority', 'status', 'dueDate', 'assigneeEmail', 'labels'];

    const resetState = () => {
        setStep('upload');
        setFile(null);
        setHeaders([]);
        setMapping({});
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (!file) {
            toast({ title: 'Geen bestand geselecteerd', variant: 'destructive' });
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setHeaders(results.meta.fields || []);
                setStep('mapping');
            },
            error: (error) => {
                toast({ title: 'Fout bij parsen CSV', description: error.message, variant: 'destructive' });
            },
        });
    };

    const handleMappingChange = (csvHeader: string, taskField: string) => {
        setMapping(prev => ({ ...prev, [csvHeader]: taskField }));
    };

    const handleImport = async () => {
        if (!user || !currentOrganization) {
            toast({ title: 'Authenticatie Fout', description: 'U moet ingelogd zijn en een organisatie geselecteerd hebben.', variant: 'destructive' });
            return;
        }
        setStep('importing');
        const csvContent = await file!.text();
        const result = await handleImportTasks(csvContent, mapping, currentOrganization.id, user.id);
        
        if (result.error) {
            toast({ title: 'Import Fout', description: result.error, variant: 'destructive' });
            setStep('mapping');
        } else if (result.data) {
            toast({ title: 'Import Succesvol', description: `${result.data.successCount} taken geïmporteerd, ${result.data.errorCount} mislukt.` });
            onOpenChange(false);
            resetState();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetState(); onOpenChange(isOpen); }}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Taken Importeren van CSV</DialogTitle>
                    <DialogDescription>Importeer taken in bulk door een CSV-bestand te uploaden.</DialogDescription>
                </DialogHeader>
                {step === 'upload' && (
                    <div className="py-4 space-y-4">
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">{file ? file.name : 'Klik om te uploaden of sleep een bestand'}</p>
                                    <p className="text-xs text-muted-foreground">CSV-bestand</p>
                                </div>
                                <Input id="csv-upload" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                            </label>
                        </div>
                        <Button onClick={handleUpload} disabled={!file} className="w-full">Volgende</Button>
                    </div>
                )}
                {step === 'mapping' && (
                    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                         <h3 className="font-semibold flex items-center gap-2"><TableProperties className="h-5 w-5"/> Koppel kolommen</h3>
                        <p className="text-sm text-muted-foreground">Koppel de kolommen uit uw CSV-bestand aan de taakvelden in Chorey.</p>
                        <div className="grid grid-cols-2 gap-4">
                            {headers.map(header => (
                                <div key={header} className="space-y-2">
                                    <label className="text-sm font-medium">{header}</label>
                                    <Select onValueChange={(value) => handleMappingChange(header, value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecteer veld..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ignore">Negeer</SelectItem>
                                            {taskFields.map(field => (
                                                <SelectItem key={field} value={field}>{field}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                         <DialogFooter className="sticky bottom-0 bg-background pt-4">
                            <Button variant="ghost" onClick={() => setStep('upload')}>Terug</Button>
                            <Button onClick={handleImport}>Importeer Taken</Button>
                        </DialogFooter>
                    </div>
                )}
                {step === 'importing' && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">Taken worden geïmporteerd...</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
