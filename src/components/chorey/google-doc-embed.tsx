'use client';

import { cn } from "@/lib/utils";

export function GoogleDocEmbed({ url, className }: { url: string; className?: string }) {
    if (!url.includes('docs.google.com')) {
        return <p className="text-xs text-destructive">Ongeldige Google Workspace URL.</p>;
    }

    // Transform the URL to a preview/embeddable format
    const embedUrl = url.replace(/\/edit\b.*/, '/preview');

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
