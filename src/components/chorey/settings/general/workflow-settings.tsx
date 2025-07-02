'use client';
// This component has been refactored and split into smaller components
// inside src/components/chorey/settings/workflow/
// This file can be removed in a future cleanup.
import { redirect } from 'next/navigation';

export default function DeprecatedWorkflowSettings() {
    redirect('/dashboard/settings/organization/workflow');
    return null;
}
