
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateTwoFactorSecret, verifyAndEnableTwoFactor } from '@/app/actions/user.actions';
import { useAuth } from '@/contexts/auth-context';
import type { User } from '@/lib/types';
import QRCode from 'qrcode';
import { Loader2, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TwoFactorSetupDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: User;
}

export function TwoFactorSetupDialog({ isOpen, setIsOpen, user }: TwoFactorSetupDialogProps) {
    const { refreshUser } = useAuth();
    const { toast } = useToast();
    const [step, setStep] = useState<'generate' | 'verify' | 'codes'>('generate');
    const [qrCode, setQrCode] = useState('');
    const [otpAuthUrl, setOtpAuthUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const resetState = () => {
        setStep('generate');
        setQrCode('');
        setOtpAuthUrl('');
        setSecret('');
        setVerificationCode('');
        setRecoveryCodes([]);
        setError('');
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen && step === 'generate') {
            setIsLoading(true);
            const handleGenerate = async () => {
                const result = await generateTwoFactorSecret(user.id, user.email);
                if (result.error) {
                    setError(result.error);
                } else if (result.otpauth) {
                    setOtpAuthUrl(result.otpauth);
                    const secretFromUrl = new URL(result.otpauth).searchParams.get('secret');
                    setSecret(secretFromUrl || '');
                    QRCode.toDataURL(result.otpauth)
                        .then(url => setQrCode(url))
                        .catch(err => setError(err.message));
                    setStep('verify');
                }
                setIsLoading(false);
            };
            handleGenerate();
        } else if (!isOpen) {
            resetState();
        }
    }, [isOpen, step, user.id, user.email]);

    const handleVerify = async () => {
        setIsLoading(true);
        setError('');
        const result = await verifyAndEnableTwoFactor(user.id, verificationCode);
        if (result.error) {
            setError(result.error);
        } else if (result.success && result.recoveryCodes) {
            setRecoveryCodes(result.recoveryCodes);
            setStep('codes');
            await refreshUser();
        }
        setIsLoading(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Gekopieerd!", description: "De tekst is naar je klembord gekopieerd." });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Twee-Factor Authenticatie Instellen</DialogTitle>
                </DialogHeader>
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}
                {!isLoading && step === 'verify' && (
                    <div className="space-y-4">
                        <DialogDescription>
                            Scan de onderstaande QR-code met uw authenticator-app (zoals Google Authenticator of Authy). Als u de QR-code niet kunt scannen, voer dan de sleutel handmatig in.
                        </DialogDescription>
                        <div className="flex justify-center">
                            {qrCode ? <img src={qrCode} alt="2FA QR Code" /> : <Loader2 className="h-8 w-8 animate-spin" />}
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Handmatige Sleutel</label>
                             <div className="flex items-center gap-2">
                                <Input value={secret} readOnly />
                                <Button size="icon" variant="outline" onClick={() => copyToClipboard(secret)}><Copy className="h-4 w-4"/></Button>
                             </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="verification-code" className="text-sm font-medium">Verificatiecode</label>
                            <Input 
                                id="verification-code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Voer de 6-cijferige code in"
                            />
                             {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>
                        <DialogFooter>
                            <Button onClick={handleVerify} disabled={isLoading}>Verifiëren en Inschakelen</Button>
                        </DialogFooter>
                    </div>
                )}
                {!isLoading && step === 'codes' && (
                     <div className="space-y-4">
                        <Alert variant="destructive">
                            <AlertTitle>Bewaar deze herstelcodes!</AlertTitle>
                            <AlertDescription>
                                Bewaar deze codes op een veilige plek. Als je de toegang tot je authenticator-app verliest, zijn deze codes de enige manier om weer toegang tot je account te krijgen.
                            </AlertDescription>
                        </Alert>
                        <div className="grid grid-cols-2 gap-2 p-4 border rounded-md font-mono text-sm">
                            {recoveryCodes.map(code => <span key={code}>{code}</span>)}
                        </div>
                         <DialogFooter>
                            <Button onClick={() => copyToClipboard(recoveryCodes.join('\n'))}>Kopieer Codes</Button>
                            <DialogClose asChild>
                                <Button>Sluiten</Button>
                            </DialogClose>
                        </DialogFooter>
                     </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

