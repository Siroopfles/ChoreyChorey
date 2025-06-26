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
import { useTasks } from '@/contexts/task-context';
import { Separator } from '@/components/ui/separator';
import { TemplateCard } from '@/components/chorey/templates/template-card';
import { TemplateDialog } from '@/components/chorey/templates/template-dialog';

export default function TemplatesPage() {
  const { templates, loading, users } = useTasks();

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Taaktemplates</h1>
        <TemplateDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nieuw Template
          </Button>
        </TemplateDialog>
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
            <TemplateDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nieuw Template
              </Button>
            </TemplateDialog>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
