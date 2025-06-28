
'use client';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';

// Import Widgets
import { TasksByStatusWidget } from './dashboard/widgets/TasksByStatusWidget';
import { TasksByPriorityWidget } from './dashboard/widgets/TasksByPriorityWidget';
import { LeaderboardWidget } from './dashboard/widgets/LeaderboardWidget';
import { ActivityFeedWidget } from './dashboard/widgets/ActivityFeedWidget';

// Import Types
import type { Task, User, ActivityFeedItem } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useMemo } from 'react';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardViewProps {
  tasks: Task[];
  users: User[];
  activityFeedItems: ActivityFeedItem[];
  isFeedLoading: boolean;
  setViewedTask: (task: Task | null) => void;
  navigateToUserProfile: (userId: string) => void;
};

const WIDGETS = {
  tasksByStatus: 'tasksByStatus',
  tasksByPriority: 'tasksByPriority',
  leaderboard: 'leaderboard',
  activityFeed: 'activityFeed',
};

const defaultLayouts: { [key: string]: Layout[] } = {
  lg: [
    { i: WIDGETS.tasksByStatus, x: 0, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: WIDGETS.leaderboard, x: 1, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: WIDGETS.activityFeed, x: 2, y: 0, w: 1, h: 4, minW: 1, minH: 3 },
    { i: WIDGETS.tasksByPriority, x: 0, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
  ],
  md: [
    { i: WIDGETS.tasksByStatus, x: 0, y: 0, w: 1, h: 2 },
    { i: WIDGETS.leaderboard, x: 1, y: 0, w: 1, h: 2 },
    { i: WIDGETS.activityFeed, x: 0, y: 2, w: 2, h: 4 },
    { i: WIDGETS.tasksByPriority, x: 0, y: 6, w: 2, h: 2 },
  ],
  sm: [
    { i: WIDGETS.tasksByStatus, x: 0, y: 0, w: 1, h: 2 },
    { i: WIDGETS.leaderboard, x: 0, y: 2, w: 1, h: 2 },
    { i: WIDGETS.tasksByPriority, x: 0, y: 4, w: 1, h: 2 },
    { i: WIDGETS.activityFeed, x: 0, y: 6, w: 1, h: 4 },
  ],
};


export default function DashboardView({ tasks, users, activityFeedItems, isFeedLoading, setViewedTask, navigateToUserProfile }: DashboardViewProps) {
  const { user } = useAuth();

  // In a future step, this would be saved to the user's profile
  const layouts = user?.dashboardLayout || defaultLayouts;

  const memoizedWidgets = useMemo(() => ({
    [WIDGETS.tasksByStatus]: <TasksByStatusWidget tasks={tasks} />,
    [WIDGETS.tasksByPriority]: <TasksByPriorityWidget tasks={tasks} />,
    [WIDGETS.leaderboard]: <LeaderboardWidget users={users} />,
    [WIDGETS.activityFeed]: (
        <ActivityFeedWidget
            items={activityFeedItems}
            users={users}
            tasks={tasks}
            isLoading={isFeedLoading}
            setViewedTask={setViewedTask}
            navigateToUserProfile={navigateToUserProfile}
        />
    ),
  }), [tasks, users, activityFeedItems, isFeedLoading, setViewedTask, navigateToUserProfile]);


  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 3, md: 2, sm: 1, xs: 1, xxs: 1 }}
      rowHeight={150}
      isDraggable={false} // Customization disabled for now
      isResizable={false} // Customization disabled for now
    >
        {Object.keys(WIDGETS).map(key => (
            <div key={key}>
                {memoizedWidgets[key as keyof typeof WIDGETS]}
            </div>
        ))}
    </ResponsiveGridLayout>
  );
}
