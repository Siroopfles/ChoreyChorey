
'use server';

import { Timestamp } from 'firebase/firestore';

// Generic helper to serialize Firestore Timestamps to ISO strings for any object
export const serializeTimestamps = (data: any) => {
    if (!data) return data;
    const serializedData: any = {};
    for (const key in data) {
        const value = data[key];
        if (value instanceof Timestamp) {
            serializedData[key] = value.toDate().toISOString();
        } else if (value instanceof Date) {
            serializedData[key] = value.toISOString();
        } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            serializedData[key] = value;
        } else {
            serializedData[key] = value;
        }
    }
    return serializedData;
};

// Explicitly select fields to prevent leaking sensitive data.
export const serializeTask = (data: any) => {
    const serialized = serializeTimestamps(data);
    return {
        id: serialized.id,
        title: serialized.title,
        description: serialized.description,
        status: serialized.status,
        priority: serialized.priority,
        dueDate: serialized.dueDate,
        assigneeIds: serialized.assigneeIds,
        creatorId: serialized.creatorId,
        projectId: serialized.projectId,
        teamId: serialized.teamId,
        labels: serialized.labels,
        subtasks: serialized.subtasks,
        attachments: serialized.attachments,
        comments: serialized.comments,
        isPrivate: serialized.isPrivate,
        createdAt: serialized.createdAt,
        completedAt: serialized.completedAt,
        order: serialized.order,
        storyPoints: serialized.storyPoints,
        cost: serialized.cost,
        blockedBy: serialized.blockedBy,
        relations: serialized.relations,
        recurring: serialized.recurring,
        organizationId: serialized.organizationId,
        imageUrl: serialized.imageUrl,
        timeLogged: serialized.timeLogged,
        rating: serialized.rating,
        reviewerId: serialized.reviewerId,
        consultedUserIds: serialized.consultedUserIds,
        informedUserIds: serialized.informedUserIds,
    };
};

export const serializeProject = (data: any) => {
    const serialized = serializeTimestamps(data);
     return {
        id: serialized.id,
        name: serialized.name,
        organizationId: serialized.organizationId,
        teamIds: serialized.teamIds,
        program: serialized.program,
        isSensitive: serialized.isSensitive,
        isPublic: serialized.isPublic,
        budget: serialized.budget,
        budgetType: serialized.budgetType,
        deadline: serialized.deadline,
        pinned: serialized.pinned,
    };
};

export const serializeTeam = (data: any) => {
    return serializeTimestamps(data);
};

export const serializeUser = (data: any) => {
    const serialized = serializeTimestamps(data);
    // Return a public-safe user object, excluding sensitive fields
    // like twoFactorSecret, refreshToken, etc.
    return {
        id: serialized.id,
        name: serialized.name,
        email: serialized.email,
        avatar: serialized.avatar,
        points: serialized.points || 0,
        skills: serialized.skills || [],
        status: serialized.status || { type: 'Offline', until: null },
    };
};
