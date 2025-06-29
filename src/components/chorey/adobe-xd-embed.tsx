'use client';

import { cn } from "@/lib/utils";

export function AdobeXdEmbed({ url, className }: { url: string; className?: string }) {
    if (!url.includes('xd.adobe.com/view/')) {
        return <p className="text-xs text-destructive">Ongeldige Adobe XD deel-URL.</p>;
    }
    const embedUrl = url.replace('/view/', '/embed/');

    return (
        <div className={cn("aspect-video w-full rounded-md border overflow-hidden bg-muted", className)}>
            <iframe
                src={embedUrl}
                allowFullScreen
                className="w-full h-full"
            />
        </div>
    );
}
