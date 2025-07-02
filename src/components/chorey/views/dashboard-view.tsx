'use client';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layouts } from 'react-grid-layout';
import { useAuth } from '@/contexts/user/auth-context';
import { useOrganization } from '@/contexts/system/organization-context';
import { useTasks } from '@/contexts/feature/task-context';
import { useCallback, useRef } from 'react';
import type { Task, ActivityFeedItem, WidgetInstance } from '@/lib/types';
import { WidgetWrapper } from '../dashboard/WidgetWrapper';
import { updateUserProfile } from '@/app/actions/user/user.actions';

// Import Widgets
import { TasksByStatusWidget } from '../dashboard/widgets/TasksByStatusWidget';
import { TasksByPriorityWidget } from '../dashboard/widgets/TasksByPriorityWidget';
import { LeaderboardWidget } from '../dashboard/widgets/LeaderboardWidget';
import { ActivityFeedWidget } from '../dashboard/widgets/ActivityFeedWidget';
import { RecentActivityWidget } from '../dashboard/widgets/RecentActivityWidget';
import { WelcomeWidget } from '../dashboard/widgets/WelcomeWidget';
import { MyTasksWidget } from '../dashboard/widgets/MyTasksWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardViewProps {
  tasks: Task[];
  activityFeedItems: ActivityFeedItem[];
  isFeedLoading: boolean;
};


export default function DashboardView({ tasks, activityFeedItems, isFeedLoading }: DashboardViewProps) {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { users, loading: orgLoading } = useOrganization();
  const layoutChangeTimer = useRef<NodeJS.Timeout | null>(null);

  const dashboardConfig = user?.dashboardConfig || [];
  const layouts = user?.dashboardLayout;
  
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
            await refreshUser();
          }
        }
      }, 500);
    },
    [user, layouts, refreshUser]
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
            return <ActivityFeedWidget items={activityFeedItems} isLoading={isFeedLoading} />;
        case 'recentActivity':
            return <RecentActivityWidget isLoading={authLoading || orgLoading} />;
        case 'welcome':
            return <WelcomeWidget name={user?.name || 'gebruiker'} />;
        case 'myTasks':
            return <MyTasksWidget config={widget.config} />;
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
