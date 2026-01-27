'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Tipagem para os dados esperados da Shopify
export interface ShopifyCustomer {
    id?: string | number;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    [key: string]: unknown;
}

export interface ShopifyCart {
    token?: string;
    items?: Array<{
        id?: string | number;
        title?: string;
        quantity?: number;
        price?: number;
        variant_id?: string | number;
        [key: string]: unknown;
    }>;
    total_price?: number;
    item_count?: number;
    [key: string]: unknown;
}

export interface ShopifyProduct {
    id?: string | number;
    title?: string;
    handle?: string;
    vendor?: string;
    price?: number;
    variants?: Array<unknown>;
    [key: string]: unknown;
}

export interface ShopifyShop {
    name?: string;
    domain?: string;
    currency?: string;
    [key: string]: unknown;
}

export interface BekaAppData {
    shop?: string | ShopifyShop;
    customer?: ShopifyCustomer & { name?: string };
    cart?: ShopifyCart;
    product?: ShopifyProduct;
}

// Extender interface Window para incluir BekaAppData
declare global {
    interface Window {
        BekaAppData?: BekaAppData;
    }
}

const SYNC_ENDPOINT = '/api/shopify-sync';
const SESSION_KEY = 'beka_shopify_data_hash';

/**
 * Gera um hash simples para comparar dados
 */
function generateDataHash(data: BekaAppData): string {
    try {
        return btoa(JSON.stringify(data)).slice(0, 50);
    } catch {
        return Math.random().toString(36);
    }
}

/**
 * Verifica se já enviamos esses dados nesta sessão
 */
function hasAlreadySynced(hash: string): boolean {
    if (typeof sessionStorage === 'undefined') return false;

    const storedHash = sessionStorage.getItem(SESSION_KEY);
    return storedHash === hash;
}

/**
 * Marca os dados como sincronizados na sessão
 */
function markAsSynced(hash: string): void {
    if (typeof sessionStorage === 'undefined') return;

    sessionStorage.setItem(SESSION_KEY, hash);
}

interface UseShopifyDataOptions {
    /** Intervalo em ms para verificar se os dados carregaram (default: 500) */
    pollInterval?: number;
    /** Tempo máximo em ms para aguardar os dados (default: 10000) */
    maxWaitTime?: number;
    /** Se deve sincronizar automaticamente com o backend (default: true) */
    autoSync?: boolean;
    /** Se deve evitar envio de dados duplicados na mesma sessão (default: true) */
    preventDuplicateSync?: boolean;
}

interface UseShopifyDataReturn {
    /** Dados capturados da Shopify */
    data: BekaAppData | null;
    /** Se está carregando/aguardando os dados */
    isLoading: boolean;
    /** Se os dados foram sincronizados com sucesso */
    isSynced: boolean;
    /** Se está em processo de sincronização */
    isSyncing: boolean;
    /** Erro caso ocorra falha */
    error: Error | null;
    /** Função para forçar nova sincronização */
    forceSync: () => Promise<void>;
    /** Função para recarregar os dados da window */
    refreshData: () => void;
}

/**
 * Hook para capturar dados da Shopify do objeto window.BekaAppData
 * e sincronizar com o backend.
 */
export function useShopifyData(options: UseShopifyDataOptions = {}): UseShopifyDataReturn {
    const {
        pollInterval = 500,
        maxWaitTime = 10000,
        autoSync = true,
        preventDuplicateSync = true,
    } = options;

    const [data, setData] = useState<BekaAppData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSynced, setIsSynced] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const syncAttemptedRef = useRef(false);
    const startTimeRef = useRef(Date.now());

    /**
     * Captura os dados da window (local ou parent quando em iframe)
     */
    const fetchDataFromWindow = useCallback((): BekaAppData | null => {
        // Garantir que estamos no client-side
        if (typeof window === 'undefined') return null;

        // Primeiro, tentar na window atual
        if (window.BekaAppData) {
            console.log('[BekaShopify] Dados encontrados na window local');
            return window.BekaAppData;
        }

        // Se estiver em um iframe, tentar buscar da janela pai
        try {
            if (window.parent && window.parent !== window) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const parentData = (window.parent as any).BekaAppData;
                if (parentData) {
                    console.log('[BekaShopify] Dados encontrados na window.parent');
                    return parentData;
                }
            }
        } catch (e) {
            // Erro de cross-origin - não temos acesso à janela pai
            console.log('[BekaShopify] Não foi possível acessar window.parent (cross-origin)');
        }

        return null;
    }, []);

    /**
     * Sincroniza os dados com o backend
     */
    const syncWithBackend = useCallback(async (shopifyData: BekaAppData, force = false): Promise<void> => {
        // Verificar duplicatas se a opção estiver ativada
        if (preventDuplicateSync && !force) {
            const hash = generateDataHash(shopifyData);
            if (hasAlreadySynced(hash)) {
                console.log('[BekaShopify] Dados já sincronizados nesta sessão, pulando...');
                setIsSynced(true);
                return;
            }
        }

        setIsSyncing(true);
        setError(null);

        try {
            const response = await fetch(SYNC_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    source: 'beka_widget',
                    data: shopifyData,
                }),
            });

            if (!response.ok) {
                throw new Error(`Falha na sincronização: ${response.status} ${response.statusText}`);
            }

            // Marcar como sincronizado
            if (preventDuplicateSync) {
                const hash = generateDataHash(shopifyData);
                markAsSynced(hash);
            }

            setIsSynced(true);
            console.log('[BekaShopify] Dados sincronizados com sucesso!');
        } catch (err) {
            const errorMessage = err instanceof Error ? err : new Error('Erro desconhecido na sincronização');
            setError(errorMessage);
            console.error('[BekaShopify] Erro ao sincronizar:', errorMessage);
        } finally {
            setIsSyncing(false);
        }
    }, [preventDuplicateSync]);

    /**
     * Força uma nova sincronização
     */
    const forceSync = useCallback(async () => {
        if (data) {
            await syncWithBackend(data, true);
        }
    }, [data, syncWithBackend]);

    /**
     * Recarrega os dados da window
     */
    const refreshData = useCallback(() => {
        const newData = fetchDataFromWindow();
        if (newData) {
            setData(newData);
        }
    }, [fetchDataFromWindow]);

    /**
     * Efeito principal: captura dados e sincroniza
     */
    useEffect(() => {
        // Garantir client-side
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return;
        }

        startTimeRef.current = Date.now();

        /**
         * Handler para receber dados via postMessage (quando em iframe)
         */
        const handleMessage = (event: MessageEvent) => {
            // Verificar se é uma mensagem de dados da Shopify
            if (event.data && event.data.type === 'BEKA_SHOPIFY_DATA' && event.data.payload) {
                console.log('[BekaShopify] Dados recebidos via postMessage:', event.data.payload);

                const shopifyData = event.data.payload as BekaAppData;
                setData(shopifyData);
                setIsLoading(false);

                // Sincronizar automaticamente se habilitado
                if (autoSync && !syncAttemptedRef.current) {
                    syncAttemptedRef.current = true;
                    syncWithBackend(shopifyData);
                }
            }
        };

        // Adicionar listener para postMessage
        window.addEventListener('message', handleMessage);

        // Solicitar dados ao parent (se estiver em iframe)
        if (window.parent && window.parent !== window) {
            console.log('[BekaShopify] Solicitando dados ao parent...');
            window.parent.postMessage('BEKA_REQUEST_SHOPIFY_DATA', '*');
        }

        // Tentar capturar dados imediatamente (caso local)
        const initialData = fetchDataFromWindow();
        if (initialData) {
            setData(initialData);
            setIsLoading(false);

            // Sincronizar automaticamente se habilitado
            if (autoSync && !syncAttemptedRef.current) {
                syncAttemptedRef.current = true;
                syncWithBackend(initialData);
            }
            return () => {
                window.removeEventListener('message', handleMessage);
            };
        }

        // Se não encontrou, fazer polling (fallback)
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;

            // Timeout: parar de esperar
            if (elapsed >= maxWaitTime) {
                clearInterval(interval);
                setIsLoading(false);
                console.log('[BekaShopify] Timeout: dados não encontrados');
                return;
            }

            const polledData = fetchDataFromWindow();
            if (polledData) {
                setData(polledData);
                setIsLoading(false);
                clearInterval(interval);

                // Sincronizar automaticamente
                if (autoSync && !syncAttemptedRef.current) {
                    syncAttemptedRef.current = true;
                    syncWithBackend(polledData);
                }
            }
        }, pollInterval);

        return () => {
            clearInterval(interval);
            window.removeEventListener('message', handleMessage);
        };
    }, [fetchDataFromWindow, syncWithBackend, autoSync, pollInterval, maxWaitTime]);

    return {
        data,
        isLoading,
        isSynced,
        isSyncing,
        error,
        forceSync,
        refreshData,
    };
}
