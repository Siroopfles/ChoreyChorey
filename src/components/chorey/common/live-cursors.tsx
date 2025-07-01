
'use client';

import React from 'react';
import { usePresence } from '@/contexts/communication/presence-context';

const Cursor = ({ x, y, name, color }: { x: number; y: number; name: string; color: string }) => {
  return (
    <div
      className="pointer-events-none absolute left-0 top-0 transition-transform duration-75 ease-linear z-[9999]"
      style={{ transform: `translateX(${x}px) translateY(${y}px)` }}
    >
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color }}
        >
            <path d="M5.65376 12.3599L18.3462 12.3599L12 18.7062L5.65376 12.3599Z" fill="currentColor" />
            <path d="M5.65376 12.3599L12 5.29378L18.3462 12.3599L12 18.7062L5.65376 12.3599Z" stroke="white" strokeWidth="1.5" />
        </svg>

      <div className="ml-2 mt-1 rounded-full px-2 py-0.5 text-xs text-primary-foreground shadow-md" style={{ backgroundColor: color }}>
        {name}
      </div>
    </div>
  );
};

// Function to generate a color based on user ID for consistency
const generateColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 90%, 65%)`;
};


export function LiveCursors() {
  const { others } = usePresence();

  return (
    <>
      {Object.entries(others).map(([id, presence]) => {
        if (presence.cursor) {
          return (
            <Cursor
              key={id}
              x={presence.cursor.x}
              y={presence.cursor.y}
              name={presence.name}
              color={generateColor(id)}
            />
          );
        }
        return null;
      })}
    </>
  );
}
