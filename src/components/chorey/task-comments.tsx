'use client';

import type { User, Comment as CommentType } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Bot, Loader2, Speaker, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { summarizeComments } from '@/ai/flows/summarize-comments';
import { multiSpeakerTextToSpeech } from '@/ai/flows/multi-speaker-tts-flow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '../ui/rich-text-editor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';

const ReadReceipt = ({ comment, users }: { comment: CommentType; users: User[] }) => {
    const readers = (comment.readBy || [])
        .map(userId => users.find(u => u.id === userId)?.name)
        .filter(Boolean);

    if (readers.length === 0) return null;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{readers.length}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="font-semibold">Gelezen door:</p>
                    <ul className="list-disc list-inside">
                        {readers.map(name => <li key={name}>{name}</li>)}
                    </ul>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const CommentItem = ({ comment, user, onVisible, allUsers }: { comment: CommentType; user?: User; onVisible: () => void; allUsers: User[] }) => {
    const commentRef = useRef<HTMLDivElement>(null);
    const { user: currentUser } = useAuth();
    
    const hasBeenReadByMe = currentUser ? comment.readBy?.includes(currentUser.id) : false;

    useEffect(() => {
        if(hasBeenReadByMe) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onVisible();
                    observer.disconnect();
                }
            },
            { threshold: 0.8 }
        );

        if (commentRef.current) {
            observer.observe(commentRef.current);
        }

        return () => observer.disconnect();
    }, [onVisible, hasBeenReadByMe]);

  return (
    <div ref={commentRef} className="flex items-start gap-3">
      <Avatar className="h-8 w-8 border">
        <AvatarImage src={user?.avatar} />
        <AvatarFallback>{user?.name.charAt(0) ?? '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{user?.name ?? 'Onbekende gebruiker'}</p>
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: nl })}
                </p>
            </div>
            <ReadReceipt comment={comment} users={allUsers} />
        </div>
        <div className="text-sm text-foreground/90 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: comment.text }} />
      </div>
    </div>
  );
};

type TaskCommentsProps = {
  taskId: string;
  comments: CommentType[];
  users: User[];
  addComment: (text: string) => void;
};

export function TaskComments({ taskId, comments, users, addComment }: TaskCommentsProps) {
  const { toast } = useToast();
  const { markSingleNotificationAsRead } = useNotifications();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  const sortedComments = [...(comments || [])].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const onSummarizeComments = async () => {
    const commentsToSummarize = sortedComments.map(c => c.text);
    if (commentsToSummarize.length < 2) {
      toast({ title: 'Niet genoeg reacties om samen te vatten.', variant: 'destructive' });
      return;
    }
    setIsSummarizing(true);
    setSummary('');
    setAudioError(null);
    setAudioSrc(null);
    
    try {
        const result = await summarizeComments({ comments: commentsToSummarize });
        setSummary(result.summary);
    } catch(e: any) {
        toast({ title: 'Fout bij samenvatten', description: e.message, variant: 'destructive' });
    }
    setIsSummarizing(false);
  };

  const onReadAloud = async () => {
    if (sortedComments.length === 0) {
      toast({ title: 'Geen reacties om voor te lezen.', variant: 'destructive' });
      return;
    }
    setIsReadingAloud(true);
    setAudioSrc(null);
    setAudioError(null);
    setSummary('');

    try {
      const commentsWithNames = sortedComments.map(comment => {
        const user = users.find(u => u.id === comment.userId);
        return {
          userId: comment.userId,
          userName: user?.name || 'Onbekend',
          text: comment.text
        };
      });

      const result = await multiSpeakerTextToSpeech({ comments: commentsWithNames });

      setAudioSrc(result.audioDataUri);
    } catch (e: any) {
      setAudioError(e.message || 'Er is een onbekende fout opgetreden.');
    } finally {
      setIsReadingAloud(false);
    }
  };

  const handleAddComment = () => {
    const plainText = newComment.replace(/<[^>]*>/g, '').trim();
    if (plainText) {
      addComment(newComment);
      setNewComment('');
    }
  };
  
  const handleCommentVisible = (commentId: string) => {
    // This action is now handled by the notification context,
    // which listens for unread notifications and marks them as read
    // when they enter the viewport.
  };

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-4">
          {sortedComments.length > 1 && (
              <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onSummarizeComments} disabled={isSummarizing || isReadingAloud} className="flex-1">
                  {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                  Samenvatten
              </Button>
              <Button variant="outline" size="sm" onClick={onReadAloud} disabled={isReadingAloud || isSummarizing} className="flex-1">
                  {isReadingAloud ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Speaker className="mr-2 h-4 w-4" />}
                  Voorlezen
              </Button>
              </div>
          )}
          {summary && (
              <Alert>
                  <Bot className="h-4 w-4" />
                  <AlertTitle>AI Samenvatting</AlertTitle>
                  <AlertDescription>{summary}</AlertDescription>
              </Alert>
          )}
          {audioSrc && (
              <div className="mt-2">
                  <audio controls autoPlay src={audioSrc} className="w-full h-10">
                      Your browser does not support the audio element.
                  </audio>
              </div>
          )}
          {audioError && (
              <Alert variant="destructive" className="mt-2">
                  <AlertTitle>Fout bij voorlezen</AlertTitle>
                  <AlertDescription>{audioError}</AlertDescription>
              </Alert>
          )}
          {sortedComments.length > 0 ? (
              sortedComments.map(comment => (
                  <CommentItem 
                    key={comment.id}
                    comment={comment}
                    user={users.find(u => u.id === comment.userId)}
                    onVisible={() => {}}
                    allUsers={users}
                  />
              ))
          ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nog geen reacties.</p>
          )}
        </div>
      </ScrollArea>
      <div className="flex flex-col gap-2 mt-auto pt-4 border-t">
          <RichTextEditor
            value={newComment}
            onChange={setNewComment}
            placeholder="Voeg een reactie toe..."
          />
          <Button onClick={handleAddComment} disabled={!newComment.replace(/<[^>]*>/g, '').trim()} className="self-end">
              Plaats
          </Button>
      </div>
    </div>
  );
}
