
'use client';

import { useState, useMemo } from 'react';
import type { Task, User } from '@/lib/types';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCopy, Phone, PhoneOff, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { usePresence } from '@/contexts/communication/presence-context';
import { useCall } from '@/contexts/communication/call-context';
import { TaskQrCodeDialog } from '../TaskQrCodeDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const LiveViewers = ({ taskId }: { taskId: string }) => {
    const { user: currentUser } = useAuth();
    const { users } = useOrganization();
    const { others } = usePresence();

    const viewers = useMemo(() => 
        Object.values(others)
            .filter(p => p.viewingTaskId === taskId && p.id !== currentUser?.id)
            .map(p => users.find(u => u.id === p.id))
            .filter(Boolean) as User[],
        [others, taskId, users, currentUser]
    );

    if (viewers.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center -space-x-2">
            <TooltipProvider>
                {viewers.slice(0, 3).map(viewer => (
                    <Tooltip key={viewer.id}>
                        <TooltipTrigger asChild>
                             <Avatar className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={viewer.avatar} />
                                <AvatarFallback>{viewer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{viewer.name} bekijkt dit ook</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
            {viewers.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold border-2 border-background">
                    +{viewers.length - 3}
                </div>
            )}
        </div>
    );
};

export function EditTaskHeader({ task }: { task: Task }) {
  const { toast } = useToast();
  const { startOrJoinCall, leaveCall, activeCall } = useCall();
  const [isQrCodeOpen, setIsQrCodeOpen] = useState(false);

  const isHuddleActive = task.callSession?.isActive;
  const isInThisHuddle = activeCall?.taskId === task.id;

  const handleCopyId = () => {
    navigator.clipboard.writeText(task.id);
    toast({
        title: "Taak ID Gekopieerd!",
        description: `ID ${task.id} is naar je klembord gekopieerd.`
    });
  };

  return (
    <>
      <DialogHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <DialogTitle className="font-headline flex items-center gap-2">
              <span>Taak Bewerken: {task.title}</span>
              <Badge variant="outline">{task.status}</Badge>
            </DialogTitle>
            <DialogDescription>
              <button onClick={handleCopyId} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                ID: {task.id}
                <ClipboardCopy className="h-3 w-3" />
              </button>
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <LiveViewers taskId={task.id} />
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setIsQrCodeOpen(true)}>
              <QrCode className="h-4 w-4" />
            </Button>
            <Button
              variant={isHuddleActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => isInThisHuddle ? leaveCall() : startOrJoinCall(task)}
              className="shrink-0"
            >
              {isInThisHuddle ? <PhoneOff className="mr-2 h-4 w-4" /> : <Phone className="mr-2 h-4 w-4" />}
              {isInThisHuddle ? 'Verlaat Huddle' : (isHuddleActive ? 'Neem Deel' : 'Start Huddle')}
            </Button>
          </div>
        </div>
      </DialogHeader>
      <TaskQrCodeDialog
        open={isQrCodeOpen}
        onOpenChange={setIsQrCodeOpen}
        taskId={task.id}
        taskTitle={task.title}
      />
    </>
  );
}
