'use client';

import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LauncherProps {
    isOpen: boolean;
    onClick: () => void;
    unreadCount?: number;
}

export function Launcher({ isOpen, onClick, unreadCount = 0 }: LauncherProps) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
            <Button
                onClick={onClick}
                size="icon"
                className={cn(
                    "h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
                    isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                )}
            >
                <div className="relative flex items-center justify-center">
                    <X
                        className={cn(
                            "absolute h-7 w-7 transition-all duration-300",
                            isOpen ? "scale-100 rotate-0" : "scale-0 rotate-90"
                        )}
                    />
                    <MessageCircle
                        className={cn(
                            "absolute h-7 w-7 transition-all duration-300",
                            isOpen ? "scale-0 -rotate-90" : "scale-100 rotate-0"
                        )}
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
