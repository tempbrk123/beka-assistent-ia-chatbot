'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatwootMessage } from '@/lib/chatwootMessages';

interface UseChatwootMessagesOptions {
    contactId: number | null;
    enabled?: boolean;
}

/**
 * Hook para receber mensagens do Chatwoot via SSE
 * 
 * Conecta ao endpoint /api/chatwoot-sse e recebe mensagens em tempo real
 * quando o contact_id corresponde ao usuário atual
 */
export function useChatwootMessages({ contactId, enabled = true }: UseChatwootMessagesOptions) {
    const [messages, setMessages] = useState<ChatwootMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (!contactId || !enabled) {
            return;
        }

        // Limpar conexão anterior
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        console.log(`[useChatwootMessages] Conectando SSE para contact_id: ${contactId}`);

        try {
            const eventSource = new EventSource(`/api/chatwoot-sse?contact_id=${contactId}`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('[useChatwootMessages] Conexão SSE estabelecida');
                setIsConnected(true);
                setError(null);
            };

            eventSource.onmessage = (event) => {
                try {
                    const message: ChatwootMessage = JSON.parse(event.data);
                    console.log('[useChatwootMessages] Mensagem recebida:', message);

                    setMessages(prev => {
                        // Evitar duplicatas
                        if (prev.some(m => m.id === message.id)) {
                            return prev;
                        }
                        return [...prev, message];
                    });
                } catch (e) {
                    console.error('[useChatwootMessages] Erro ao parsear mensagem:', e);
                }
            };

            eventSource.onerror = (e) => {
                console.error('[useChatwootMessages] Erro na conexão SSE:', e);
                setIsConnected(false);
                setError('Conexão perdida');

                // Tentar reconectar após 5 segundos
                eventSource.close();
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('[useChatwootMessages] Tentando reconectar...');
                    connect();
                }, 5000);
            };

        } catch (e) {
            console.error('[useChatwootMessages] Erro ao criar EventSource:', e);
            setError('Falha ao conectar');
        }
    }, [contactId, enabled]);

    // Conectar quando contactId muda ou enabled é true
    useEffect(() => {
        if (contactId && enabled) {
            connect();
        }

        return () => {
            if (eventSourceRef.current) {
                console.log('[useChatwootMessages] Fechando conexão SSE');
                eventSourceRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [contactId, enabled, connect]);

    // Limpar mensagens
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    return {
        messages,
        isConnected,
        error,
        clearMessages,
    };
}
