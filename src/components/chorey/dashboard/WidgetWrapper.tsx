
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GripVertical, Settings, Trash2 } from 'lucide-react';
import type { WidgetInstance } from '@/lib/types';
import { useAuth } from '@/contexts/user/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ManageDashboardDialog } from './ManageDashboardDialog';
import { useState } from 'react';

interface WidgetWrapperProps {
  children: React.ReactNode;
  widget: WidgetInstance;
}

export function WidgetWrapper({ children, widget }: WidgetWrapperProps) {
  const { user, updateUserDashboard } = useAuth();
  const { toast } = useToast();
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.dashboardConfig) return;

    const newConfig = user.dashboardConfig.filter(w => w.id !== widget.id);
    await updateUserDashboard({ dashboardConfig: newConfig });
    
    toast({ title: "Widget verwijderd" });
  };
  
  return (
    <>
      <Card className="h-full flex flex-col group/widget">
        <div className="react-grid-drag-handle absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors z-10 opacity-0 group-hover/widget:opacity-100">
            <GripVertical className="h-5 w-5" />
        </div>
         <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 left-2 h-7 w-7 z-10 opacity-0 group-hover/widget:opacity-100"
            onClick={() => setIsManagerOpen(true)}
            aria-label="Configureer widget"
         >
            <Settings className="h-4 w-4" />
        </Button>
         <Button
            variant="ghost"
            size="icon"
            className="absolute top-9 left-2 h-7 w-7 z-10 opacity-0 group-hover/widget:opacity-100 text-destructive hover:text-destructive"
            onClick={handleRemove}
            aria-label="Verwijder widget"
         >
            <Trash2 className="h-4 w-4" />
        </Button>
        {children}
      </Card>
      <ManageDashboardDialog open={isManagerOpen} onOpenChange={setIsManagerOpen} highlightWidgetId={widget.id} />
    </>
  );
}
