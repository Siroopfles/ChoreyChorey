export type ReportConfig = {
    name: string;
    chartType: 'bar' | 'pie';
    groupBy: 'status' | 'priority' | 'assignee';
    metric: 'count' | 'storyPoints' | 'points';
};

export type ScheduledReportFormValues = {
    name: string;
    recipients: string;
    schedule: 'daily' | 'weekly' | 'monthly';
    reportConfig: ReportConfig;
};

export type ScheduledReport = {
    id: string;
    organizationId: string;
    creatorId: string;
    name: string;
    recipients: string[];
    schedule: 'daily' | 'weekly' | 'monthly';
    reportConfig: ReportConfig;
    lastSentAt: Date | null;
    createdAt: Date;
};
