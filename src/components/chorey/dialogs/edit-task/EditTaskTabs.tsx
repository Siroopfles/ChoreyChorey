
'use client';

import { MessageSquare, History, PenSquare, BrainCircuit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskComments } from '@/components/chorey/common/task-comments';
import { TaskHistory } from '@/components/chorey/common/task-history';
import { TaskAiInsightsTab } from './TaskAiInsightsTab';
import { TaskWhiteboardTab } from './TaskWhiteboardTab';
import { useOrganization } from '@/contexts/system/organization-context';
import { useAuth } from '@/contexts/user/auth-context';
import type { Task } from '@/lib/types';
import { addCommentAction, toggleCommentReactionAction } from '@/app/actions/core/comment.actions';
import { useToast } from '@/hooks/use-toast';
import { handleServerAction } from '@/lib/utils/action-wrapper';


export function EditTaskTabs({ task }: { task: Task }) {
  const { users, currentOrganization } = useOrganization();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const handleAddComment = (text: string, parentId: string | null = null) => {
    if (!currentUser || !currentOrganization) return;
    handleServerAction(
        () => addCommentAction(task.id, text, currentUser.id, currentUser.name, currentOrganization.id, parentId),
        toast,
        { errorContext: 'plaatsen reactie' }
    );
  };
  
  const handleToggleReaction = async (taskId: string, commentId: string, emoji: string) => {
    if (!currentUser) return;
    await handleServerAction(
        () => toggleCommentReactionAction(taskId, commentId, emoji, currentUser.id),
        toast,
        { errorContext: 'reageren op commentaar' }
    );
  };

  return (
    <Tabs defaultValue="comments" className="flex flex-col flex-1 min-h-0">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="comments"><MessageSquare className="mr-2 h-4 w-4" /> Reacties</TabsTrigger>
        <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> Geschiedenis</TabsTrigger>
        <TabsTrigger value="whiteboard"><PenSquare className="mr-2 h-4 w-4" /> Whiteboard</TabsTrigger>
        <TabsTrigger value="ai-insights"><BrainCircuit className="mr-2 h-4 w-4" /> AI</TabsTrigger>
      </TabsList>
      <TabsContent value="comments" className="flex-1 flex flex-col gap-4 min-h-0 mt-2">
        <TaskComments 
          task={task}
          users={users}
          addComment={handleAddComment}
          toggleCommentReaction={handleToggleReaction}
        />
      </TabsContent>
      <TabsContent value="history" className="flex-1 min-h-0 mt-2">
        <TaskHistory task={task} users={users} />
      </TabsContent>
      <TabsContent value="whiteboard" className="flex-1 min-h-0 mt-2 flex flex-col items-center justify-center text-center gap-4 p-4">
        <TaskWhiteboardTab taskId={task.id} />
      </TabsContent>
      <TabsContent value="ai-insights" className="flex-1 flex flex-col gap-4 min-h-0 mt-2 p-1">
        <TaskAiInsightsTab task={task} />
      </TabsContent>
    </Tabs>
  );
}
