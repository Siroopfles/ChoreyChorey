

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Camera, AlertCircle } from 'lucide-react';

export default function ScanPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader", 
            { 
                qrbox: { width: 250, height: 250 },
                fps: 10,
            },
            /* verbose= */ false
        );

        function onScanSuccess(decodedText: string, decodedResult: any) {
            scanner.clear(); // To stop scanning
            setScanResult(decodedText);

            try {
                const url = new URL(decodedText);
                if (url.origin !== window.location.origin || !url.pathname.startsWith('/dashboard/focus/')) {
                    throw new Error('QR code is not a valid Chorey task link.');
                }
                toast({ title: 'Taak Gevonden!', description: 'U wordt doorgestuurd...' });
                router.push(url.pathname);

            } catch(e) {
                 toast({ title: 'Ongeldige QR Code', description: 'De gescande code is geen geldige taaklink.', variant: 'destructive' });
                 setError('Dit is geen geldige Chorey taak QR code.');
            }
        }

        function onScanFailure(error: any) {
            // This function is called frequently, so we don't want to show errors for "QR not found"
            // console.warn(`Code scan error = ${error}`);
        }
        
        scanner.render(onScanSuccess, onScanFailure);

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5-qrcode-scanner.", error);
            });
        };
    }, [router, toast]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Camera /> Scan Taak QR Code
                </h1>
                <p className="text-muted-foreground">Richt uw camera op een QR-code om de taak te openen.</p>
            </div>
            
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Scan Fout</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            
            <div id="reader" className="w-full max-w-md mx-auto rounded-lg overflow-hidden border"></div>
        </div>
    );
}
