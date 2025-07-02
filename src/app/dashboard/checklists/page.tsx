'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, ClipboardList } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PERMISSIONS } from '@/lib/types';
import { PermissionProtectedButton } from '@/components/ui/permission-protected-button';
import { useChecklists } from '@/contexts/feature/checklist-context';
import { ChecklistTemplateCard } from '@/components/chorey/checklists/checklist-template-card';
import { ChecklistTemplateDialog } from '@/components/chorey/checklists/checklist-template-dialog';

export default function ChecklistsPage() {
  const { checklists, loading } = useChecklists();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-lg md:text-2xl flex items-center gap-2"><ClipboardList/> Checklist Templates</h1>
           <PermissionProtectedButton
              requiredPermission={PERMISSIONS.MANAGE_CHECKLISTS}
              onClick={() => setIsDialogOpen(true)}
           >
              <Plus className="mr-2 h-4 w-4" /> Nieuwe Checklist
           </PermissionProtectedButton>
        </div>
        <Separator />
        {checklists.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {checklists.map((template) => (
              <ChecklistTemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[400px]">
             <h3 className="mt-4 text-2xl font-bold tracking-tight">Geen checklists</h3>
             <p className="mt-2 text-sm text-muted-foreground">Maak je eerste checklist template aan om workflows te standaardiseren.</p>
             <PermissionProtectedButton
                requiredPermission={PERMISSIONS.MANAGE_CHECKLISTS}
                onClick={() => setIsDialogOpen(true)}
                className="mt-6"
             >
                <Plus className="mr-2 h-4 w-4" /> Nieuwe Checklist
             </PermissionProtectedButton>
          </div>
        )}
      </main>
      <ChecklistTemplateDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
