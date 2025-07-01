

'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import { useTemplates } from '@/contexts/feature/template-context';
import { useAuth } from '@/contexts/user/auth-context';
import { Separator } from '@/components/ui/separator';
import { TemplateCard } from '@/components/chorey/templates/template-card';
import { TemplateDialog } from '@/components/chorey/templates/template-dialog';
import { PERMISSIONS } from '@/lib/types';
import { PermissionProtectedButton } from '@/components/ui/permission-protected-button';


export default function TemplatesPage() {
  const { templates, loading } = useTemplates();
  const { users } = useAuth();
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
          <h1 className="font-semibold text-lg md:text-2xl">Taaktemplates</h1>
           <PermissionProtectedButton
              requiredPermission={PERMISSIONS.MANAGE_TEMPLATES}
              onClick={() => setIsDialogOpen(true)}
           >
              <Plus className="mr-2 h-4 w-4" /> Nieuw Template
           </PermissionProtectedButton>
        </div>

        <Separator />

        {templates.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} users={users} />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center py-12">
            <CardHeader className="text-center">
              <CardTitle>Nog geen templates</CardTitle>
              <CardDescription>
                Maak je eerste template aan om taken sneller aan te maken.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <PermissionProtectedButton
                  requiredPermission={PERMISSIONS.MANAGE_TEMPLATES}
                  onClick={() => setIsDialogOpen(true)}
               >
                  <Plus className="mr-2 h-4 w-4" /> Nieuw Template
               </PermissionProtectedButton>
            </CardContent>
          </Card>
        )}
      </main>
      <TemplateDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
