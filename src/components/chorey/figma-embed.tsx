'use client';

import { cn } from "@/lib/utils";

export function FigmaEmbed({ url, className }: { url: string; className?: string }) {
    if (!url.includes('figma.com/file/')) {
        return <p className="text-xs text-destructive">Ongeldige Figma bestands-URL.</p>;
    }
    const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;

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
