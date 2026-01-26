'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LauncherProps {
    isOpen: boolean;
    onClick: () => void;
    unreadCount?: number;
}

export function Launcher({ isOpen, onClick, unreadCount = 0 }: LauncherProps) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            <Button
                onClick={onClick}
                size="icon"
                className={cn(
                    "h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-105 bg-primary hover:bg-primary/90",
                    isOpen && "opacity-0 scale-0 pointer-events-none"
                )}
            >
                <div className="relative flex items-center justify-center">
                    <MessageCircle
                        className="h-7 w-7"
                    />
                </div>

                {!isOpen && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
                        {unreadCount}
                    </span>
                )}
            </Button>
        </div>
    );
}
