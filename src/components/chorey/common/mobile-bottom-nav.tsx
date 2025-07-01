'use client';

import { useIsMobile } from "@/hooks/use-mobile";
import { usePathname } from "next/navigation";
import Link from 'next/link';
import { cn } from "@/lib/utils/utils";
import { LayoutDashboard, CalendarCheck, Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/contexts/feature/task-context";
import { useNotifications } from "@/contexts/communication/notification-context";
import { Badge } from "@/components/ui/badge";

export default function MobileBottomNav() {
    const isMobile = useIsMobile();
    const pathname = usePathname();
    const { setIsAddTaskDialogOpen } = useTasks();
    const { notifications } = useNotifications();

    const unreadCount = notifications.filter(n => !n.read).length;

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/dashboard/my-week', icon: CalendarCheck, label: 'Mijn Week' },
        { href: '/dashboard/inbox', icon: Inbox, label: 'Inbox', badge: unreadCount > 0 ? unreadCount : 0 },
    ];

    if (!isMobile) {
        return null;
    }

    return (
        <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t">
            <div className="grid h-full grid-cols-5 mx-auto font-medium">
                {navItems.slice(0, 2).map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "inline-flex flex-col items-center justify-center px-5 hover:bg-muted group",
                            pathname === item.href && "text-primary"
                        )}
                    >
                        <item.icon className="w-5 h-5 mb-1 text-muted-foreground group-hover:text-foreground group-[.text-primary]:text-primary" />
                        <span className="text-xs text-muted-foreground group-hover:text-foreground group-[.text-primary]:text-primary">{item.label}</span>
                    </Link>
                ))}

                <div className="flex items-center justify-center">
                    <Button
                        size="icon"
                        className="w-14 h-14 rounded-full -mt-6 shadow-lg"
                        onClick={() => setIsAddTaskDialogOpen(true)}
                        aria-label="Nieuwe taak toevoegen"
                    >
                        <Plus className="w-6 h-6" />
                    </Button>
                </div>
                
                {navItems.slice(2).map((item) => (
                     <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "inline-flex flex-col items-center justify-center px-5 hover:bg-muted group relative",
                            pathname === item.href && "text-primary"
                        )}
                    >
                        {item.badge > 0 && (
                            <Badge variant="destructive" className="absolute top-1 right-3 h-4 w-4 p-0 flex items-center justify-center text-[10px]">{item.badge}</Badge>
                        )}
                        <item.icon className="w-5 h-5 mb-1 text-muted-foreground group-hover:text-foreground group-[.text-primary]:text-primary" />
                        <span className="text-xs text-muted-foreground group-hover:text-foreground group-[.text-primary]:text-primary">{item.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
