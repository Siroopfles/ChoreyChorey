
'use client';

import type { Permission } from '@/lib/types';
import { PERMISSIONS_DESCRIPTIONS } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ReactNode } from 'react';

// Use Omit to remove props that we will handle internally
interface PermissionProtectedButtonProps extends Omit<ButtonProps, 'disabled' | 'asChild' | 'onClick'> {
  requiredPermission: Permission;
  manualDisableCondition?: boolean; // e.g. a feature toggle is off
  manualDisableTooltip?: string; // Tooltip content for when manually disabled
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}

export function PermissionProtectedButton({
  requiredPermission,
  manualDisableCondition = false,
  manualDisableTooltip,
  href,
  onClick,
  children,
  ...props
}: PermissionProtectedButtonProps) {
  const { currentUserPermissions } = useAuth();
  const hasPermission = currentUserPermissions.includes(requiredPermission);
  const isDisabled = !hasPermission || manualDisableCondition;

  const buttonElement = (
    <Button
      {...props}
      disabled={isDisabled}
      onClick={!isDisabled ? onClick : undefined}
    >
      {children}
    </Button>
  );
  
  const linkElement = (
     <Button
      {...props}
      asChild
      className={cn(isDisabled && "pointer-events-none opacity-50")}
    >
      <Link href={!isDisabled ? href! : "#"}>
        {children}
      </Link>
    </Button>
  );

  const renderableElement = href ? linkElement : buttonElement;
  
  if (!isDisabled) {
    return renderableElement;
  }
  
  const tooltipText = manualDisableCondition 
    ? manualDisableTooltip 
    : `${PERMISSIONS_DESCRIPTIONS[requiredPermission].name} permissie vereist.`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* The span is important for the tooltip to work on a disabled element */}
          <span tabIndex={0}>
            {renderableElement}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
