'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { useEffect } from 'react';

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="p-1 border-b flex items-center gap-1 flex-wrap">
      <Button
        type="button"
        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="Vetgedrukt"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Cursief"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Ongeordende lijst"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Geordende lijst"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  );
};

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable heading as it might conflict with task titles
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Don't emit an update if the content is just an empty paragraph
      if (editor.getHTML() === '<p></p>') {
        onChange('');
      } else {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[120px] w-full rounded-b-md px-3 py-2 text-base ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 prose dark:prose-invert max-w-none prose-p:my-2',
      },
    },
  });

  // Effect to synchronize external value changes into the editor
  useEffect(() => {
    if (editor) {
      // Check if the content is different to prevent unnecessary updates
      // and cursor jumps.
      const isSame = editor.getHTML() === value;
      if (!isSame) {
        // Use `false` for emitUpdate to prevent an infinite loop
        editor.commands.setContent(value, false);
      }
    }
  }, [value, editor]);

  return (
    <div className={cn('w-full rounded-md border border-input bg-background ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2', className)}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
