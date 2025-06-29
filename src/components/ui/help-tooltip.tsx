"use client"
import { HelpCircle } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link"

interface HelpTooltipProps {
  content: ReactNode
  learnMoreLink?: string
}

export function HelpTooltip({ content, learnMoreLink }: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex align-middle ml-1.5 cursor-help"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="w-64">
          <p className="text-sm">{content}</p>
          {learnMoreLink && (
            <Button asChild variant="link" className="p-0 h-auto mt-2 text-xs">
              <Link href={learnMoreLink} target="_blank">
                Meer informatie
              </Link>
            </Button>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
