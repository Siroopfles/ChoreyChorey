
'use client';

import { Button } from '@/components/ui/button';
import { PenSquare } from 'lucide-react';
import Link from 'next/link';

export function TaskWhiteboardTab({ taskId }: { taskId: string }) {
  return (
    <>
      <h3 className="font-semibold text-lg">Open Whiteboard</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Werk samen op een volledig scherm canvas. Ideaal voor brainstormsessies en het visualiseren van ideeën.
      </p>
      <Button asChild>
        <Link href={`/dashboard/whiteboard/${taskId}`} target="_blank">
          <PenSquare className="mr-2 h-4 w-4" />
          Open in Nieuw Tabblad
        </Link>
      </Button>
    </>
  );
}
