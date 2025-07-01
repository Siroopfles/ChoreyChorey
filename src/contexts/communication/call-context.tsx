
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, Task } from '@/lib/types';
import { useAuth } from '@/contexts/user/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, collection, addDoc, query, where, getDocs, writeBatch, deleteDoc, serverTimestamp } from 'firebase/firestore';
import Peer from 'simple-peer';

interface CallParticipant extends User {
  isMuted: boolean;
  stream?: MediaStream;
}

interface ActiveCall {
  taskId: string;
  participants: Record<string, Omit<CallParticipant, 'id'>>;
}

interface CallContextType {
  activeCall: ActiveCall | null;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  isMuted: boolean;
  startOrJoinCall: (task: Task) => void;
  leaveCall: () => void;
  toggleMute: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isMuted, setIsMuted] = useState(false);
  const peersRef = useRef<Record<string, Peer.Instance>>({});
  const taskUnsubscribeRef = useRef<() => void>();

  const cleanupCall = useCallback(() => {
    Object.values(peersRef.current).forEach(peer => peer.destroy());
    peersRef.current = {};
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStreams({});
    setActiveCall(null);
    if(taskUnsubscribeRef.current) {
        taskUnsubscribeRef.current();
        taskUnsubscribeRef.current = undefined;
    }
  }, [localStream]);

  const leaveCall = useCallback(async () => {
    if (!activeCall || !user) return;

    const taskId = activeCall.taskId;
    const taskRef = doc(db, 'tasks', taskId);
    
    // Optimistically clean up local state
    const callToLeave = activeCall;
    cleanupCall();

    try {
        const docSnap = await getDoc(taskRef);
        if (docSnap.exists()) {
            const currentParticipants = docSnap.data().callSession?.participants || {};
            delete currentParticipants[user.id];
            
            if (Object.keys(currentParticipants).length === 0) {
                await updateDoc(taskRef, { callSession: { isActive: false, participants: {} } });
            } else {
                await updateDoc(taskRef, { [`callSession.participants.${user.id}`]: undefined });
            }
        }

        const signalsQuery = query(collection(db, 'tasks', taskId, 'signals'), where('to', '==', user.id));
        const signalsSnapshot = await getDocs(signalsQuery);
        const batch = writeBatch(db);
        signalsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

    } catch (error) {
        console.error("Error leaving call:", error);
    }

  }, [activeCall, user, cleanupCall]);


  const startOrJoinCall = async (task: Task) => {
    if (!user) return;
    if (activeCall) await leaveCall(); // Leave any existing call first

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);

      const taskRef = doc(db, 'tasks', task.id);
      
      taskUnsubscribeRef.current = onSnapshot(taskRef, (taskDoc) => {
        if (!taskDoc.exists() || !taskDoc.data().callSession?.isActive) {
          if(activeCall?.taskId === task.id) cleanupCall();
          return;
        }

        const callData = taskDoc.data().callSession;
        const currentParticipants = callData.participants || {};
        const otherParticipantIds = Object.keys(currentParticipants).filter(id => id !== user.id);
        
        setActiveCall({ taskId: task.id, participants: currentParticipants });

        otherParticipantIds.forEach(peerId => {
            if (!peersRef.current[peerId] && user.id < peerId) {
                const peer = new Peer({ initiator: true, trickle: true, stream });
                peersRef.current[peerId] = peer;
                
                peer.on('signal', async signal => {
                    await addDoc(collection(db, `tasks/${task.id}/signals`), {
                        to: peerId, from: user.id, signal
                    });
                });
                peer.on('stream', remoteStream => {
                    setRemoteStreams(prev => ({...prev, [peerId]: remoteStream}));
                });
                peer.on('close', () => {
                    delete peersRef.current[peerId];
                    setRemoteStreams(prev => {
                        const newStreams = {...prev};
                        delete newStreams[peerId];
                        return newStreams;
                    });
                })
            }
        });
        
        const myPeerIds = Object.keys(peersRef.current);
        myPeerIds.forEach(peerId => {
            if(!otherParticipantIds.includes(peerId)) {
                peersRef.current[peerId].destroy();
                delete peersRef.current[peerId];
                setRemoteStreams(prev => {
                   const newStreams = {...prev};
                   delete newStreams[peerId];
                   return newStreams;
                });
            }
        })

      });
      
      // Initial update to join/start call
      await updateDoc(taskRef, {
        [`callSession.isActive`]: true,
        [`callSession.participants.${user.id}`]: {
          name: user.name,
          avatar: user.avatar,
          isMuted: false
        }
      });

      const signalsQuery = query(collection(db, 'tasks', task.id, 'signals'), where('to', '==', user.id));
      onSnapshot(signalsQuery, (snapshot) => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added') {
            const { from, signal } = change.doc.data();
            if (!peersRef.current[from]) {
              const peer = new Peer({ initiator: false, trickle: true, stream });
              peersRef.current[from] = peer;
              
              peer.on('signal', async answerSignal => {
                  await addDoc(collection(db, `tasks/${task.id}/signals`), {
                      to: from, from: user.id, signal: answerSignal
                  });
              });
              peer.on('stream', remoteStream => {
                  setRemoteStreams(prev => ({...prev, [from]: remoteStream}));
              });
              peer.on('close', () => {
                    delete peersRef.current[from];
                    setRemoteStreams(prev => {
                        const newStreams = {...prev};
                        delete newStreams[from];
                        return newStreams;
                    });
                })
            }
            peersRef.current[from].signal(signal);
            await deleteDoc(change.doc.ref);
          }
        })
      });

    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };
  
  useEffect(() => {
    window.addEventListener('beforeunload', leaveCall);
    return () => {
      window.removeEventListener('beforeunload', leaveCall);
      cleanupCall();
    }
  }, [leaveCall, cleanupCall]);


  return (
    <CallContext.Provider value={{ activeCall, localStream, remoteStreams, isMuted, startOrJoinCall, leaveCall, toggleMute }}>
      {children}
    </CallContext.Provider>
  );
}
