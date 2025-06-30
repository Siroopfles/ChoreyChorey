

'use client';

import type { User, Task as TaskType, Comment as CommentType, Subtask } from '@/lib/types';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Bot, Loader2, Speaker, Eye, CornerUpRight, SmilePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { summarizeComments } from '@/ai/flows/summarize-comments';
import { multiSpeakerTextToSpeech } from '@/ai/flows/multi-speaker-tts-flow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '../ui/rich-text-editor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notification-context';
import { updateTypingStatusAction } from '@/app/actions/task.actions';
import { useTasks } from '@/contexts/task-context';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

const EMOJI_LIST = ['👍', '❤️', '😂', '🎉', '🤔', '🙏'];

const EmojiPickerPopover = ({ onSelect }: { onSelect: (emoji: string) => void }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className="h-6 w-6"><SmilePlus className="h-4 w-4" /></Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-1">
      <div className="flex gap-1">
        {EMOJI_LIST.map(emoji => (
          <Button key={emoji} variant="ghost" size="icon" className="h-8 w-8 text-lg" onClick={() => onSelect(emoji)}>
            {emoji}
          </Button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
);

const ReactionBadge = ({ emoji, count, users, hasReacted, onClick }: { emoji: string, count: number, users: string[], hasReacted: boolean, onClick: () => void }) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="secondary"
                        size="sm"
                        className={cn(
                            "h-7 px-2.5 py-1 text-xs",
                            hasReacted && "bg-primary/20 border border-primary/50"
                        )}
                        onClick={onClick}
                    >
                        <span className="text-sm mr-1.5">{emoji}</span>
                        <span>{count}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <ul className="list-disc list-inside">
                        {users.map(name => <li key={name}>{name}</li>)}
                    </ul>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};


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

const CommentItem = ({ comment, user, onVisible, allUsers, onConvertToSubtask, toggleCommentReaction, task }: { comment: CommentType; user?: User; onVisible: () => void; allUsers: User[]; onConvertToSubtask: (text: string) => void; toggleCommentReaction: (taskId: string, commentId: string, emoji: string) => void; task: TaskType }) => {
    const commentRef = useRef<HTMLLIElement>(null);
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
    <li ref={commentRef} className="flex items-start gap-3 group/comment">
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
            <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
              <ReadReceipt comment={comment} users={allUsers} />
              <EmojiPickerPopover onSelect={(emoji) => toggleCommentReaction(task.id, comment.id, emoji)} />
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onConvertToSubtask(comment.text)}
                  title="Converteer naar subtaak"
              >
                  <CornerUpRight className="h-4 w-4" />
              </Button>
            </div>
        </div>
        <div className="text-sm text-foreground/90 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: comment.text }} />
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {Object.entries(comment.reactions || {}).map(([emoji, userIds]) => {
              if (userIds.length === 0) return null;
              const reactedUsers = userIds.map(id => allUsers.find(u => u.id === id)?.name).filter(Boolean) as string[];
              return (
                  <ReactionBadge
                      key={emoji}
                      emoji={emoji}
                      count={userIds.length}
                      users={reactedUsers}
                      hasReacted={currentUser ? userIds.includes(currentUser.id) : false}
                      onClick={() => toggleCommentReaction(task.id, comment.id, emoji)}
                  />
              );
          })}
        </div>
      </div>
    </li>
  );
};

type TaskCommentsProps = {
  task: TaskType;
  users: User[];
  addComment: (text: string) => void;
  toggleCommentReaction: (taskId: string, commentId: string, emoji: string) => void;
};

export function TaskComments({ task, users, addComment, toggleCommentReaction }: TaskCommentsProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { updateTask } = useTasks();
  const { markSingleNotificationAsRead } = useNotifications();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();
  
  const sortedComments = [...(task.comments || [])].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

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

  const updateTypingStatus = useCallback((isTyping: boolean) => {
    if (!currentUser || !task?.id) return;
    updateTypingStatusAction(task.id, currentUser.id, isTyping);
  }, [currentUser, task?.id]);

  useEffect(() => {
    return () => {
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        updateTypingStatus(false);
    };
  }, [updateTypingStatus]);

  useEffect(() => {
    if (newComment.length > 0) {
        updateTypingStatus(true);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            updateTypingStatus(false);
        }, 3000); // 3 seconds of inactivity
    }
  }, [newComment, updateTypingStatus]);

  const handleAddComment = () => {
    const plainText = newComment.replace(/<[^>]*>/g, '').trim();
    if (plainText) {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      updateTypingStatus(false);
      addComment(newComment);
      setNewComment('');
    }
  };
  
  const handleCommentVisible = (commentId: string) => {
    // This action is now handled by the notification context,
    // which listens for unread notifications and marks them as read
    // when they enter the viewport.
  };

  const handleConvertCommentToSubtask = (commentText: string) => {
    const plainText = commentText.replace(/<[^>]*>/g, '').trim();
    if (!plainText) return;

    const newSubtask: Omit<Subtask, 'id'> = {
      text: plainText,
      completed: false,
      isPrivate: false,
    };
    
    const updatedSubtasks = [...task.subtasks, { ...newSubtask, id: crypto.randomUUID() }];
    
    updateTask(task.id, { subtasks: updatedSubtasks });

    toast({
        title: 'Subtaak aangemaakt',
        description: `De reactie is omgezet naar een nieuwe subtaak.`,
    });
  };

  const typingUsers = useMemo(() => {
    if (!task?.typing || !currentUser) return [];
    
    const now = new Date();
    return Object.entries(task.typing)
      .filter(([userId, timestamp]) => {
        const isOld = (now.getTime() - (timestamp as Date).getTime()) > 5000;
        return userId !== currentUser.id && !isOld;
      })
      .map(([userId]) => users.find(u => u.id === userId)?.name)
      .filter(Boolean) as string[];
  }, [task?.typing, users, currentUser]);

  return (
    <div className="flex-1 flex flex-col gap-2 min-h-0">
      <ScrollArea className="flex-1 pr-2">
        <ul className="space-y-4">
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
                    onConvertToSubtask={handleConvertCommentToSubtask}
                    toggleCommentReaction={toggleCommentReaction}
                    task={task}
                  />
              ))
          ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nog geen reacties.</p>
          )}
        </ul>
      </ScrollArea>
       <div className="h-4 px-1 text-xs text-muted-foreground italic flex items-center gap-1">
        {typingUsers.length > 0 && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>
              {typingUsers.join(', ')} {typingUsers.length > 1 ? 'zijn' : 'is'} aan het typen...
            </span>
          </>
        )}
      </div>
      <div className="flex flex-col gap-2 pt-2 border-t">
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
