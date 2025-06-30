
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import QRCode from 'qrcode';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

interface TaskQrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
}

export function TaskQrCodeDialog({ open, onOpenChange, taskId, taskTitle }: TaskQrCodeDialogProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [taskUrl, setTaskUrl] = useState('');

  useEffect(() => {
    if (open && taskId) {
      const url = `${window.location.origin}/dashboard/focus/${taskId}`;
      setTaskUrl(url);
      QRCode.toDataURL(url, { errorCorrectionLevel: 'H', width: 256 })
        .then(dataUrl => {
          setQrCodeDataUrl(dataUrl);
        })
        .catch(err => {
          console.error('Failed to generate QR code', err);
        });
    }
  }, [open, taskId]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Taak QR Code: ${taskTitle}</title></head>
          <body style="text-align:center; padding-top: 50px;">
            <h2>${taskTitle}</h2>
            <img src="${qrCodeDataUrl}" alt="QR Code voor taak ${taskTitle}" />
            <p><small>${taskUrl}</small></p>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code voor: {taskTitle}</DialogTitle>
          <DialogDescription>
            Scan deze code met de camera op de Chorey app om direct naar deze taak te navigeren.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center py-4">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt={`QR Code voor ${taskTitle}`} />
          ) : (
            <Loader2 className="h-16 w-16 animate-spin" />
          )}
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={handlePrint}>Print</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
