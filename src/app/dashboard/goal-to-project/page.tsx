
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/user/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Bot, Briefcase, PlusCircle, Check, CircleDot } from 'lucide-react';
import { goalToProject } from '@/ai/flows/task-management/goal-to-project-flow';
import type { GoalToProjectOutput } from '@/ai/schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { createProjectFromAi } from '@/app/actions/project/project-creation.actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function GoalToProjectPage() {
  const { user, currentOrganization } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [goalDescription, setGoalDescription] = useState('');
  const [result, setResult] = useState<GoalToProjectOutput | null>(null);
  const [error, setError] = useState('');

  const handleAnalysis = async () => {
    if (!currentOrganization || !goalDescription.trim()) return;

    setIsLoading(true);
    setResult(null);
    setError('');

    try {
      const projectPlan = await goalToProject({ organizationId: currentOrganization.id, goalDescription });
      setResult(projectPlan);
    } catch (e: any) {
      setError(e.message);
    }

    setIsLoading(false);
  };
  
  const handleCreateProject = async () => {
    if (!user || !currentOrganization || !result) return;
    setIsCreatingProject(true);
    
    const { data, error } = await createProjectFromAi(currentOrganization.id, user.id, result);
    
    if(error) {
        toast({ title: 'Fout', description: error, variant: 'destructive' });
    } else {
        toast({ title: 'Project Aangemaakt!', description: `Project "${result.projectName}" en de bijbehorende taken zijn succesvol aangemaakt.`});
        router.push('/dashboard');
    }
    setIsCreatingProject(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles /> AI Project Planner
        </h1>
        <p className="text-muted-foreground">Transformeer een hoog-over doel in een compleet, gestructureerd projectplan.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Beschrijf uw Doel</CardTitle>
          <CardDescription>
            Wat wilt u bereiken? Wees zo beschrijvend mogelijk. De AI zal dit gebruiken om een projectvoorstel te genereren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Bijvoorbeeld: 'We willen een nieuwe mobiele app voor iOS en Android lanceren in Q4. De app moet gebruikers in staat stellen taken te beheren, moet een donkere modus hebben en integreren met Google Calendar. De marketingwebsite moet ook worden bijgewerkt.'"
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
            className="min-h-[150px]"
          />
          <Button onClick={handleAnalysis} disabled={isLoading || !goalDescription.trim()}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
            Genereer Projectplan
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Er is een fout opgetreden</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase/> Projectvoorstel: {result.projectName}</CardTitle>
                <CardDescription>De AI heeft het volgende projectplan gegenereerd. U kunt dit plan nu aanmaken.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full space-y-2">
                    {result.tasks.map((task, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border rounded-md px-4">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                    <CircleDot className="h-4 w-4 text-muted-foreground" />
                                    <span>{task.title}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2 pt-2">
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                                <div className="flex gap-2 text-xs">
                                    <Badge variant="outline">Prioriteit: {task.priority}</Badge>
                                    <Badge variant="outline">Story Points: {task.storyPoints}</Badge>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
             <CardFooter>
                <Button onClick={handleCreateProject} disabled={isCreatingProject}>
                    {isCreatingProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Creëer Project en Taken
                </Button>
             </CardFooter>
        </Card>
      )}
    </div>
  );
}
