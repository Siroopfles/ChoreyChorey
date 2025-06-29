
'use client';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layouts } from 'react-grid-layout';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/contexts/task-context';
import { useMemo, useCallback, useRef } from 'react';
import type { Task, User, ActivityFeedItem, WidgetInstance } from '@/lib/types';
import { updateUserProfile } from '@/app/actions/user.actions';
import { WIDGET_TYPES } from '@/lib/types';
import { WidgetWrapper } from './dashboard/WidgetWrapper';

// Import Widgets
import { TasksByStatusWidget } from './dashboard/widgets/TasksByStatusWidget';
import { TasksByPriorityWidget } from './dashboard/widgets/TasksByPriorityWidget';
import { LeaderboardWidget } from './dashboard/widgets/LeaderboardWidget';
import { ActivityFeedWidget } from './dashboard/widgets/ActivityFeedWidget';
import { RecentActivityWidget } from './dashboard/widgets/RecentActivityWidget';
import { WelcomeWidget } from './dashboard/widgets/WelcomeWidget';
import { MyTasksWidget } from './dashboard/widgets/MyTasksWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardViewProps {
  tasks: Task[];
  users: User[];
  activityFeedItems: ActivityFeedItem[];
  isFeedLoading: boolean;
};


export default function DashboardView({ tasks, users, activityFeedItems, isFeedLoading }: DashboardViewProps) {
  const { user, loading, updateUserDashboard } = useAuth();
  const { setViewedTask } = useTasks();
  const layoutChangeTimer = useRef<NodeJS.Timeout | null>(null);

  const { dashboardConfig, layouts } = useMemo(() => {
      const config = user?.dashboardConfig || [];
      const defaultLayouts: Layouts = {
          lg: config.map((widget, index) => ({
              i: widget.id,
              x: (index % 3) * 4,
              y: Math.floor(index / 3) * 2,
              w: 4, h: 2, minW: 3, minH: 2
          })),
      };
      return {
          dashboardConfig: config,
          layouts: user?.dashboardLayout || defaultLayouts,
      };
  }, [user]);
  
  const handleLayoutChange = useCallback(
    (_currentLayout: any, allLayouts: Layouts) => {
      if (layoutChangeTimer.current) {
        clearTimeout(layoutChangeTimer.current);
      }
      layoutChangeTimer.current = setTimeout(async () => {
        if (user) {
          const hasLayoutChanged = JSON.stringify(allLayouts) !== JSON.stringify(layouts);
          if (hasLayoutChanged) {
            await updateUserDashboard({ dashboardLayout: allLayouts });
          }
        }
      }, 500);
    },
    [user, layouts, updateUserDashboard]
  );
  
  const renderWidget = (widget: WidgetInstance) => {
    switch (widget.type) {
        case 'tasksByStatus':
            return <TasksByStatusWidget tasks={tasks} config={widget.config} />;
        case 'tasksByPriority':
            return <TasksByPriorityWidget tasks={tasks} config={widget.config} />;
        case 'leaderboard':
            return <LeaderboardWidget users={users} config={widget.config} />;
        case 'activityFeed':
            return <ActivityFeedWidget items={activityFeedItems} users={users} tasks={tasks} isLoading={isFeedLoading} setViewedTask={setViewedTask} navigateToUserProfile={() => {}} />;
        case 'recentActivity':
            return <RecentActivityWidget tasks={tasks} currentUser={user} setViewedTask={setViewedTask} isLoading={loading} />;
        case 'welcome':
            return <WelcomeWidget name={user?.name || 'gebruiker'} />;
        case 'myTasks':
            return <MyTasksWidget tasks={tasks} currentUser={user} setViewedTask={setViewedTask} config={widget.config} />;
        default:
            return <div>Onbekend widget type: {widget.type}</div>;
    }
  };


  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={100}
      isDraggable={true}
      isResizable={true}
      onLayoutChange={handleLayoutChange}
      draggableHandle=".react-grid-drag-handle"
    >
        {dashboardConfig.map(widget => (
            <div key={widget.id}>
                <WidgetWrapper widget={widget}>
                  {renderWidget(widget)}
                </WidgetWrapper>
            </div>
        ))}
    </ResponsiveGridLayout>
  );
}
