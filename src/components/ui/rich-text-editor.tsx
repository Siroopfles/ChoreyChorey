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

    const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
      onChange(event.currentTarget.innerHTML);
    };

    const execCommand = (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
    };
    
    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    React.useEffect(() => {
        if(editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    return (
      <div className={cn('w-full rounded-md border border-input bg-background ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2', className)}>
        <div className="p-1 border-b flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('bold')}>
              <Bold className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('italic')}>
              <Italic className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('insertUnorderedList')}>
              <List className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('insertOrderedList')}>
              <ListOrdered className="h-4 w-4" />
            </Button>
        </div>
        {isMounted ? (
            <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            data-placeholder={placeholder}
            dangerouslySetInnerHTML={{ __html: value }}
            className="min-h-[120px] w-full rounded-b-md px-3 py-2 text-base placeholder:text-muted-foreground [&[data-placeholder]:empty:before]:content-[attr(data-placeholder)] [&[data-placeholder]:empty:before]:text-muted-foreground [&[data-placeholder]:empty:before]:pointer-events-none"
            />
        ) : (
            <div className="min-h-[120px] w-full px-3 py-2 text-base"></div>
        )}
      </div>
    );
  }
);
RichTextEditor.displayName = 'RichTextEditor';

export { RichTextEditor };
