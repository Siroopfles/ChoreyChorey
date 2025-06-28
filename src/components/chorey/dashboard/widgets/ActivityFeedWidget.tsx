
'use client';

import type { ActivityFeedItem, User, Task } from '@/lib/types';
import { ActivityFeed } from '@/components/chorey/activity-feed';
import ActivityFeedSkeleton from '@/components/chorey/activity-feed-skeleton';

interface ActivityFeedWidgetProps {
    items: ActivityFeedItem[];
    users: User[];
    tasks: Task[];
    isLoading: boolean;
    setViewedTask: (task: Task | null) => void;
    navigateToUserProfile: (userId: string) => void;
}

export function ActivityFeedWidget({ items, users, tasks, isLoading, setViewedTask, navigateToUserProfile }: ActivityFeedWidgetProps) {
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
