
'use client';

import { useState } from 'react';
import type { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { setProjectPublicStatus } from '@/app/actions/project.actions';

interface ShareProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function ShareProjectDialog({ open, onOpenChange, project }: ShareProjectDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  
  // Memoize publicLink to avoid re-calculating on every render, but only when it needs to.
  const publicLink = typeof window !== 'undefined' ? `${window.location.origin}/public/project/${project.id}` : '';

  const handleTogglePublic = async (isPublic: boolean) => {
    if (!user) return;
    setIsLoading(true);
    const result = await setProjectPublicStatus(project.id, project.organizationId, user.id, isPublic);
    if (result.error) {
      toast({ title: "Fout", description: result.error, variant: 'destructive' });
    } else {
      toast({ title: `Project is nu ${isPublic ? 'publiek' : 'privé'}.` });
    }
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicLink);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deelbaar Dashboard</DialogTitle>
          <DialogDescription>
            Genereer een openbare, alleen-lezen link naar het bord van dit project. Iedereen met de link kan het bord bekijken.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-4">
          <Switch
            id="public-toggle"
            checked={!!project.isPublic}
            onCheckedChange={handleTogglePublic}
            disabled={isLoading}
          />
          <Label htmlFor="public-toggle">Publiek delen inschakelen</Label>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        {project.isPublic && (
          <div className="space-y-2">
            <Label htmlFor="public-link">Deelbare Link</Label>
            <div className="flex items-center space-x-2">
              <Input id="public-link" value={publicLink} readOnly />
              <Button onClick={handleCopy} size="icon" variant="outline" aria-label="Kopieer link">
                {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
