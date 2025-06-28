'use client';

import * as React from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ value, onChange, placeholder, className }, ref) => {
    const editorRef = React.useRef<HTMLDivElement>(null);

    // This effect synchronizes the external `value` prop with the editor's content.
    // It only updates the content if it's different, preventing the cursor from jumping
    // during normal typing.
    React.useEffect(() => {
      if (editorRef.current && value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value;
      }
    }, [value]);

    const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
      onChange(event.currentTarget.innerHTML);
    };

    const execCommand = (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
    };

    return (
      <div className={cn('w-full rounded-md border border-input bg-background ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2', className)}>
        <div className="p-1 border-b flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('bold')} aria-label="Vetgedrukt">
              <Bold className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('italic')} aria-label="Cursief">
              <Italic className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('insertUnorderedList')} aria-label="Ongeordende lijst">
              <List className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('insertOrderedList')} aria-label="Geordende lijst">
              <ListOrdered className="h-4 w-4" />
            </Button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          data-placeholder={placeholder}
          // IMPORTANT: dangerouslySetInnerHTML is removed to prevent cursor jumps.
          // The useEffect hook now manages the content.
          className="min-h-[120px] w-full rounded-b-md px-3 py-2 text-base placeholder:text-muted-foreground [&[data-placeholder]:empty:before]:content-[attr(data-placeholder)] [&[data-placeholder]:empty:before]:text-muted-foreground [&[data-placeholder]:empty:before]:pointer-events-none"
        />
      </div>
    );
  }
);
RichTextEditor.displayName = 'RichTextEditor';

export { RichTextEditor };
