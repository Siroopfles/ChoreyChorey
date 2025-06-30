
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Bookmark, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function BookmarkletPage() {
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');

    // Eagerly get base URL on client
    useState(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    const bookmarkletCode = `javascript:(function(){const title=encodeURIComponent(document.title);const url=encodeURIComponent(window.location.href);window.open('${baseUrl}/dashboard?addTask=true&title='+title+'&url='+url,'chorey-task','width=800,height=700');})();`;

    const handleCopy = () => {
        navigator.clipboard.writeText(bookmarkletCode);
        setHasCopied(true);
        toast({ title: 'Code gekopieerd!', description: 'De bookmarklet-code is naar je klembord gekopieerd.' });
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/settings/integrations">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Terug naar Integraties</span>
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Bookmark /> Chorey Bookmarklet
                    </h1>
                    <p className="text-muted-foreground">Maak taken aan vanaf elke webpagina met één klik.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stap 1: Kopieer de code</CardTitle>
                    <CardDescription>Klik op de knop om de onderstaande code naar je klembord te kopiëren.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <pre className="p-4 bg-muted rounded-md text-xs overflow-x-auto">
                        <code>{bookmarkletCode}</code>
                    </pre>
                    <Button onClick={handleCopy}>
                        {hasCopied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                        {hasCopied ? 'Gekopieerd!' : 'Kopieer Code'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Stap 2: Maak een nieuwe favoriet (bookmark) aan</CardTitle>
                    <CardDescription>
                        Maak een nieuwe favoriet aan in de favorietenbalk van je browser. De meeste browsers gebruiken <kbd>Ctrl+D</kbd> of <kbd>Cmd+D</kbd>.
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    <Alert>
                        <AlertTitle>Tip voor Chrome</AlertTitle>
                        <AlertDescription>
                            Klik met de rechtermuisknop op je favorietenbalk en kies 'Pagina toevoegen'.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Stap 3: Plak de code in het URL-veld</CardTitle>
                    <CardDescription>
                        Bewerk de zojuist aangemaakte favoriet. Geef het een naam (bijv. "Taak Toevoegen") en vervang de inhoud van het URL- of Adres-veld met de gekopieerde code.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <img src="https://placehold.co/600x400.png" data-ai-hint="screenshot browser bookmark" alt="Voorbeeld van het bewerken van een favoriet" className="rounded-md border"/>
                </CardContent>
            </Card>

            <Alert>
                <Bookmark className="h-4 w-4" />
                <AlertTitle>Klaar voor gebruik!</AlertTitle>
                <AlertDescription>
                    Navigeer nu naar een willekeurige webpagina en klik op je nieuwe "Taak Toevoegen" favoriet. Er verschijnt een pop-upvenster waarin je direct een taak kunt aanmaken, met de titel en URL al ingevuld!
                </AlertDescription>
            </Alert>
        </div>
    );
}
