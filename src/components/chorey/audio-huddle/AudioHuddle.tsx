'use client';

import React, { useEffect } from 'react';
import { useCall } from '@/contexts/communication/call-context';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export function AudioHuddle() {
  const { activeCall, isMuted, toggleMute, leaveCall, remoteStreams } = useCall();

  useEffect(() => {
    const currentAudioElements = new Set(Object.keys(remoteStreams));

    // Add/Update audio elements
    Object.entries(remoteStreams).forEach(([userId, stream]) => {
      let audio = document.getElementById(`audio-${userId}`) as HTMLAudioElement;
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = `audio-${userId}`;
        audio.autoplay = true;
        document.body.appendChild(audio);
      }
      if (audio.srcObject !== stream) {
        audio.srcObject = stream;
      }
    });

    // Remove old audio elements
    document.querySelectorAll('audio[id^="audio-"]').forEach(el => {
      const userId = el.id.split('-')[1];
      if (!currentAudioElements.has(userId)) {
        el.remove();
      }
    });
  }, [remoteStreams]);

  if (!activeCall) {
    return null;
  }

  const participants = Object.entries(activeCall.participants || {});

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm">
      <Card className="p-3 shadow-2xl animate-in fade-in-50 slide-in-from-bottom-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="font-semibold text-sm">Audio Huddle</p>
            <div className="flex items-center -space-x-2">
              <TooltipProvider>
                {participants.map(([userId, participant]) => (
                  <Tooltip key={userId}>
                    <TooltipTrigger>
                      <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={participant.avatar} />
                        <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{participant.name}</TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleMute} className="h-9 w-9">
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button variant="destructive" size="icon" onClick={leaveCall} className="h-9 w-9">
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
