'use client';

import { useState, useEffect } from 'react';
import { useTasks } from '@/contexts/feature/task-context';
import { useDebounce } from '@/hooks/use-debounce';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { Task } from '@/lib/types';
import { Label } from '@/components/ui/label';

interface LiveDescriptionEditorProps {
  task: Task;
}

export function LiveDescriptionEditor({ task }: LiveDescriptionEditorProps) {
  const { updateTask } = useTasks();
  const [content, setContent] = useState(task.description || '');
  const debouncedContent = useDebounce(content, 750);

  useEffect(() => {
    // This check prevents an infinite loop on initialization or external updates
    if (debouncedContent !== (task.description || '')) {
      updateTask(task.id, { description: debouncedContent });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent, task.id]);

  useEffect(() => {
    const externalContent = task.description || '';
    // Only update local state if the incoming prop is different from the debounced content.
    // This avoids overwriting what the user is currently typing.
    if (externalContent !== debouncedContent) {
       setContent(externalContent);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.description]);

  return (
    <div className="space-y-2">
        <Label>Omschrijving (Live)</Label>
        <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Voeg een meer gedetailleerde omschrijving toe..."
        />
    </div>
  );
}
