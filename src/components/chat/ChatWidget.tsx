'use client';

import { useState } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Launcher } from '@/components/chat/Launcher';
import { cn } from '@/lib/utils';

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div
                className={cn(
                    "fixed top-20 right-4 z-40 w-[calc(100vw-2rem)] max-w-[400px] h-[calc(100vh-6rem)] max-h-[600px] transition-all duration-300 ease-in-out bg-transparent",
                    isOpen
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
                )}
            >
                <div className="h-full w-full rounded-2xl shadow-2xl overflow-hidden border border-border/50 bg-background/95 backdrop-blur-sm">
                    <ChatContainer />
                </div>
            </div>

            <Launcher
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            />
        </>
    );
}
