'use client';

import React from 'react';

interface AdobeXdEmbedProps {
  url: string;
}

export function AdobeXdEmbed({ url }: AdobeXdEmbedProps) {
  const getEmbedUrl = (xdUrl: string) => {
    try {
      const urlObject = new URL(xdUrl);
      const pathParts = urlObject.pathname.split('/');
      // Assuming URL format like: https://xd.adobe.com/view/some-id-goes-here/
      const viewId = pathParts.find(part => part.length > 10 && !part.includes('.'));

      if (viewId) {
        return `https://xd.adobe.com/embed/${viewId}`;
      }
      return null;
    } catch (error) {
      console.error("Invalid Adobe XD URL:", error);
      return null;
    }
  };

  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-muted rounded-lg">
        <p className="text-muted-foreground">Ongeldige Adobe XD link.</p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video">
      <iframe
        className="w-full h-full rounded-lg border"
        src={embedUrl}
        title="Adobe XD Embed"
        allowFullScreen
      ></iframe>
    </div>
  );
}
