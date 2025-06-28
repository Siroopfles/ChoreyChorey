
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, PlusCircle, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/contexts/task-context";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function GettingStartedGuide() {
    const router = useRouter();
    const { setIsAddTaskDialogOpen } = useTasks();
    const [isDismissed, setIsDismissed] = useLocalStorage('getting-started-guide-dismissed', false);

    if (isDismissed) {
        return null;
    }

    return (
        <Card className="bg-primary/10 border-primary/20 relative">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => setIsDismissed(true)}
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Gids verbergen</span>
            </Button>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Welkom! Laten we beginnen.
                </CardTitle>
                <CardDescription>
                    Hier zijn een paar stappen om u op weg te helpen met uw nieuwe organisatie.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                        <h4 className="font-semibold">1. Maak uw eerste taak aan</h4>
                        <p className="text-sm text-muted-foreground">Taken zijn de kern van Chorey. Creëer een taak voor alles wat gedaan moet worden.</p>
                        <Button size="sm" className="w-fit" onClick={() => setIsAddTaskDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Taak aanmaken
                        </Button>
                    </div>
                    <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                        <h4 className="font-semibold">2. Nodig uw team uit</h4>
                        <p className="text-sm text-muted-foreground">Samenwerken is leuker. Nodig leden uit om deel te nemen aan uw organisatie.</p>
                        <Button size="sm" variant="outline" className="w-fit" onClick={() => router.push('/dashboard/organization')}>
                            <UserPlus className="mr-2 h-4 w-4"/>
                            Leden uitnodigen
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
