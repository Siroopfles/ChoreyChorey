'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { HelpCircle } from 'lucide-react';

const shortcuts = [
  { keys: ['?'], description: 'Toon dit overzicht' },
  { keys: ['Cmd/Ctrl', 'K'], description: 'Nieuwe taak aanmaken' },
  { keys: ['Cmd/Ctrl', 'B'], description: 'Zijbalk in/uitklappen' },
];

interface ShortcutHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutHelpDialog({ open, onOpenChange }: ShortcutHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle /> Sneltoetsen
          </DialogTitle>
          <DialogDescription>
            Navigeer sneller door de applicatie met deze sneltoetsen.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.description} className="flex items-center justify-between rounded-md border p-3">
              <p className="text-sm">{shortcut.description}</p>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
