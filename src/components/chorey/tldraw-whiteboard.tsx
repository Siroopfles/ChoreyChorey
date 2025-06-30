
'use client';

import { Tldraw } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { useTasks } from '@/contexts/task-context';
import { Loader2 } from 'lucide-react';
import type { Editor } from '@tldraw/tldraw';

interface TldrawWhiteboardProps {
  taskId: string;
  whiteboardData?: string;
}

// A helper component to subscribe to editor changes.
function OnChangeHandler({ editor, onChange }: { editor: Editor, onChange: (snapshot: any) => void }) {
    useEffect(() => {
        const handleChange = (change: any) => {
            // We only want to save changes that are made by the user.
            if (change.source !== 'user') return;
            const snapshot = editor.store.getSnapshot();
            onChange(snapshot);
        };

        const unsubscribe = editor.store.listen(handleChange);
        return () => {
            unsubscribe();
        };
    }, [editor, onChange]);

    return null;
}


export function TldrawWhiteboard({ taskId, whiteboardData }: TldrawWhiteboardProps) {
  const { updateTask } = useTasks();
  const [editor, setEditor] = useState<Editor | null>(null);

  const setApp = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  // Load initial data when the component mounts or data changes externally
  useEffect(() => {
    if (editor && whiteboardData) {
      try {
        const snapshot = JSON.parse(whiteboardData);
        // This check prevents overwriting local state with stale data if the user
        // started drawing before the external data came in.
        // It's a simple check; a more robust solution might use versioning.
        const currentSnapshot = editor.store.getSnapshot();
        if (JSON.stringify(currentSnapshot.store) !== JSON.stringify(snapshot.store)) {
          editor.store.loadSnapshot(snapshot);
        }
      } catch (e) {
        console.error("Failed to load whiteboard data", e);
      }
    } else if (editor && !whiteboardData) {
      // Clear the canvas if there's no data
      editor.store.loadSnapshot({ store: {}, schema: editor.store.schema });
    }
  }, [editor, whiteboardData]);

  // Debounce the saving of the whiteboard to avoid too many writes to Firestore
  const debouncedEditorChange = useDebounce((newSnapshot: any) => {
    const dataString = JSON.stringify(newSnapshot);
    // Only update if the data has actually changed
    if (dataString !== whiteboardData) {
        updateTask(taskId, { whiteboard: dataString });
    }
  }, 1000); // Debounce for 1 second

  // A guard for server-side rendering
  if (typeof window === 'undefined') {
    return (
      <div className="flex items-center justify-center h-full w-full bg-muted rounded-md">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-md overflow-hidden">
      <Tldraw
        persistenceKey={`chorey-whiteboard-${taskId}`}
        onMount={setApp}
      >
         {editor && (
            <OnChangeHandler editor={editor} onChange={debouncedEditorChange} />
        )}
      </Tldraw>
    </div>
  );
}
