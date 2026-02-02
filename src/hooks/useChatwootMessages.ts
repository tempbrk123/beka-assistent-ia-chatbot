'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Product } from '@/types/chat';

interface ChatwootMessage {
    id: string;
    content: string | Product[];
    sender_name: string;
    timestamp: number;
    buttonLabels?: string[];
}

interface UseChatwootMessagesOptions {
    contactId: number | null;
    enabled?: boolean;
    pollInterval?: number; // Intervalo de polling em ms
}

/**
 * Hook para receber mensagens do Chatwoot via polling
 * 
 * Faz requisições periódicas para /api/chatwoot-webhook para buscar novas mensagens
 */
export function useChatwootMessages({
    contactId,
    enabled = true,
    pollInterval = 2000 // Poll a cada 2 segundos
}: UseChatwootMessagesOptions) {
    const [messages, setMessages] = useState<ChatwootMessage[]>([]);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isPollingRef = useRef(false);

    const fetchMessages = useCallback(async () => {
        if (!contactId || !enabled || isPollingRef.current) {
            return;
        }

        isPollingRef.current = true;

        try {
            const response = await fetch(`/api/chatwoot-webhook?contact_id=${contactId}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.messages && data.messages.length > 0) {
                console.log('[useChatwootMessages] Novas mensagens recebidas:', data.messages.length);

                setMessages(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const newMessages = data.messages.filter(
                        (m: ChatwootMessage) => !existingIds.has(m.id)
                    );

                    if (newMessages.length === 0) return prev;

                    return [...prev, ...newMessages];
                });
            }

            setError(null);
        } catch (e) {
            console.error('[useChatwootMessages] Erro ao buscar mensagens:', e);
            setError('Erro de conexão');
        } finally {
            isPollingRef.current = false;
        }
    }, [contactId, enabled]);

    // Iniciar/parar polling
    useEffect(() => {
        if (!contactId || !enabled) {
            setIsPolling(false);
            return;
        }

        setIsPolling(true);
        console.log(`[useChatwootMessages] Iniciando polling para contact_id: ${contactId}`);

        // Polling loop
        const poll = () => {
            fetchMessages();
            pollTimeoutRef.current = setTimeout(poll, pollInterval);
        };

        // Primeira busca imediata
        fetchMessages();
        pollTimeoutRef.current = setTimeout(poll, pollInterval);

        return () => {
            console.log('[useChatwootMessages] Parando polling');
            if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
            }
        };
    }, [contactId, enabled, pollInterval, fetchMessages]);

    // Limpar mensagens
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    return {
        messages,
        isPolling,
        error,
        clearMessages,
    };
}
