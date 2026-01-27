'use client';

import { useState, useEffect } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Launcher } from '@/components/chat/Launcher';
import { cn } from '@/lib/utils';
import { useShopifyData } from '@/hooks/useShopifyData';

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);

    // Sincronizar dados da Shopify com o backend quando o widget for montado
    const { data: shopifyData, isSynced, error: syncError } = useShopifyData({
        autoSync: true,
        preventDuplicateSync: true,
    });

    // Log para debug (pode remover em produção)
    useEffect(() => {
        if (shopifyData) {
            console.log('[BekaWidget] Dados Shopify capturados:', shopifyData);
        }
        if (isSynced) {
            console.log('[BekaWidget] Dados sincronizados com backend');
        }
        if (syncError) {
            console.error('[BekaWidget] Erro na sincronização:', syncError);
        }
    }, [shopifyData, isSynced, syncError]);

    // Notify parent window (host site) when widget opens/closes
    useEffect(() => {
        const message = isOpen ? "BEKA_WIDGET_OPEN" : "BEKA_WIDGET_CLOSE";
        window.parent.postMessage(message, "*");
    }, [isOpen]);

    return (
        <>
            <div
                className={cn(
                    "fixed bottom-20 right-4 z-40 w-[calc(100vw-2rem)] max-w-[400px] h-[calc(100vh-6rem)] max-h-[600px] transition-all duration-300 ease-in-out bg-transparent",
                    isOpen
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                )}
            >
                <div className="h-full w-full rounded-4xl shadow-2xl overflow-hidden bg-background/80 backdrop-blur-md">
                    <ChatContainer onClose={() => setIsOpen(false)} />
                </div>
            </div>

            <Launcher
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            />
        </>
    );
}
