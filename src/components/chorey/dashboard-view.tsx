'use client';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layouts } from 'react-grid-layout';

// Import Widgets
import { TasksByStatusWidget } from './dashboard/widgets/TasksByStatusWidget';
import { TasksByPriorityWidget } from './dashboard/widgets/TasksByPriorityWidget';
import { LeaderboardWidget } from './dashboard/widgets/LeaderboardWidget';
import { ActivityFeedWidget } from './dashboard/widgets/ActivityFeedWidget';
import { RecentActivityWidget } from './dashboard/widgets/RecentActivityWidget';

// Import Types
import type { Task, User, ActivityFeedItem } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useMemo, useCallback, useRef } from 'react';
import { updateUserProfile } from '@/app/actions/user.actions';

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
  recentActivity: 'recentActivity',
};

const defaultLayouts: Layouts = {
  lg: [
    { i: WIDGETS.tasksByStatus, x: 0, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: WIDGETS.leaderboard, x: 1, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: WIDGETS.tasksByPriority, x: 2, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: WIDGETS.activityFeed, x: 0, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
    { i: WIDGETS.recentActivity, x: 2, y: 2, w: 1, h: 2, minW: 1, minH: 2 },
  ],
  md: [
    { i: WIDGETS.tasksByStatus, x: 0, y: 0, w: 1, h: 2 },
    { i: WIDGETS.leaderboard, x: 1, y: 0, w: 1, h: 2 },
    { i: WIDGETS.activityFeed, x: 0, y: 2, w: 2, h: 2 },
    { i: WIDGETS.tasksByPriority, x: 0, y: 4, w: 1, h: 2 },
    { i: WIDGETS.recentActivity, x: 1, y: 4, w: 1, h: 2 },
  ],
  sm: [
    { i: WIDGETS.tasksByStatus, x: 0, y: 0, w: 1, h: 2 },
    { i: WIDGETS.leaderboard, x: 0, y: 2, w: 1, h: 2 },
    { i: WIDGETS.tasksByPriority, x: 0, y: 4, w: 1, h: 2 },
    { i: WIDGETS.activityFeed, x: 0, y: 6, w: 1, h: 2 },
    { i: WIDGETS.recentActivity, x: 0, y: 8, w: 1, h: 2 },
  ],
};


export default function DashboardView({ tasks, users, activityFeedItems, isFeedLoading, setViewedTask, navigateToUserProfile }: DashboardViewProps) {
  const { user, loading } = useAuth();
  const layoutChangeTimer = useRef<NodeJS.Timeout | null>(null);

  const layouts = useMemo(() => user?.dashboardLayout || defaultLayouts, [user?.dashboardLayout]);
  
  const handleLayoutChange = useCallback(
    (_currentLayout: any, allLayouts: Layouts) => {
      if (layoutChangeTimer.current) {
        clearTimeout(layoutChangeTimer.current);
      }
      layoutChangeTimer.current = setTimeout(async () => {
        if (user) {
          const hasLayoutChanged = JSON.stringify(allLayouts) !== JSON.stringify(layouts);
          if (hasLayoutChanged) {
            await updateUserProfile(user.id, { dashboardLayout: allLayouts });
          }
        }
      }, 500);
    },
    [user, layouts]
  );

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
     [WIDGETS.recentActivity]: (
      <RecentActivityWidget
        tasks={tasks}
        currentUser={user}
        setViewedTask={setViewedTask}
        isLoading={loading}
      />
    ),
  }), [tasks, users, activityFeedItems, isFeedLoading, setViewedTask, navigateToUserProfile, user, loading]);


  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 3, md: 2, sm: 1, xs: 1, xxs: 1 }}
      rowHeight={150}
      isDraggable={true}
      isResizable={true}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".react-grid-drag-handle"
    >
        {Object.keys(WIDGETS).map(key => (
            <div key={key}>
                {memoizedWidgets[key as keyof typeof WIDGETS]}
            </div>
        ))}
    </ResponsiveGridLayout>
  );
}
