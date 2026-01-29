'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { Launcher } from '@/components/chat/Launcher';
import { cn } from '@/lib/utils';
import { useShopifyData } from '@/hooks/useShopifyData';

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const hasSentToN8n = useRef(false);

    // Capturar dados da Shopify (sem autoSync para /api/shopify-sync)
    const { data: shopifyData, error: syncError } = useShopifyData({
        autoSync: false,  // Não sincronizar automaticamente
        preventDuplicateSync: true,
    });

    // Log para debug
    useEffect(() => {
        if (shopifyData) {
            console.log('[BekaWidget] Dados Shopify capturados:', shopifyData);
        }
        if (syncError) {
            console.error('[BekaWidget] Erro na sincronização:', syncError);
        }
    }, [shopifyData, syncError]);

    // Enviar dados para persistir-contato quando o usuário abre o chat
    useEffect(() => {
        // Se já enviou ou não está aberto, não faz nada
        if (!isOpen || hasSentToN8n.current) {
            return;
        }

        // SEMPRE enviar quando o chat abrir (com ou sem dados Shopify)
        hasSentToN8n.current = true;
        console.log('[BekaWidget] Chat aberto - Enviando dados para persistir-contato:', shopifyData);

        fetch('/api/shopify-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                source: 'beka_widget_open',
                data: shopifyData || {},
            }),
        })
            .then(res => {
                if (res.ok) {
                    console.log('[BekaWidget] Dados enviados para persistir-contato com sucesso!');
                } else {
                    console.error('[BekaWidget] Erro ao enviar para persistir-contato:', res.status);
                    hasSentToN8n.current = false;
                }
            })
            .catch(err => {
                console.error('[BekaWidget] Erro ao enviar para persistir-contato:', err);
                hasSentToN8n.current = false;
            });
    }, [isOpen, shopifyData]);

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
                    <ChatContainer onClose={() => setIsOpen(false)} shopifyData={shopifyData} />
                </div>
            </div>

            <Launcher
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            />
        </>
    );
}
