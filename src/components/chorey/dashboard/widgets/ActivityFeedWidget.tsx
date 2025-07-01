
'use client';

import type { ActivityFeedItem, User, Task } from '@/lib/types';
import { ActivityFeed } from '@/components/chorey/common/activity-feed';
import ActivityFeedSkeleton from '@/components/chorey/common/activity-feed-skeleton';
import { useTasks } from '@/contexts/feature/task-context';
import { useOrganization } from '@/contexts/system/organization-context';

interface ActivityFeedWidgetProps {
    items: ActivityFeedItem[];
    isLoading: boolean;
}

export function ActivityFeedWidget({ items, isLoading }: ActivityFeedWidgetProps) {
    const { users } = useOrganization();
    const { tasks, setViewedTask, navigateToUserProfile } = useTasks();

    if (isLoading) {
        return <ActivityFeedSkeleton />;
    }

    return (
        <ActivityFeed
            items={items}
            users={users}
            tasks={tasks}
            setViewedTask={setViewedTask}
            navigateToUserProfile={navigateToUserProfile}
        />
    );
}
