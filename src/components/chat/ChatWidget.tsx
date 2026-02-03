'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { UserDataForm } from '@/components/chat/UserDataForm';
import { Launcher } from '@/components/chat/Launcher';
import { cn } from '@/lib/utils';
import { useShopifyData, BekaAppData } from '@/hooks/useShopifyData';
import { useStoreTheme } from '@/hooks/useStoreTheme';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// Tipos de status de autenticação
type AuthStatus = 'idle' | 'pending' | 'needs_data' | 'authenticated' | 'error';

type formData = {
    nome: string,
    email: string,
    phone: string
} | null

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
    const [authError, setAuthError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs para controle de fluxo
    const isAuthenticatingRef = useRef(false);
    const hasCheckedAuthRef = useRef(false);

    // Dados do formulário submetido (para usar junto com shopifyData)
    const [manualUserData, setManualUserData] = useState<formData>(null);

    // Contact ID retornado pelo webhook de persistir contato
    const [contactId, setContactId] = useState<number | null>(null);

    // Capturar dados da Shopify (sem autoSync para /api/shopify-sync)
    const {
        data: shopifyData, error: syncError } = useShopifyData({
            autoSync: false,
            preventDuplicateSync: true,
        });

    // Aplicar tema baseado na loja da Shopify
    useStoreTheme(shopifyData?.store);

    /**
     * Envia dados para o webhook de persistir contato
     */
    const sendToN8n = useCallback(async (userData?: { nome: string; email: string; phone: string }) => {
        // Prevenir chamadas duplicadas
        if (isAuthenticatingRef.current) {
            console.log('[BekaWidget] Já está autenticando, ignorando chamada duplicada');
            return;
        }

        isAuthenticatingRef.current = true;
        setAuthStatus('pending');
        setAuthError(null);

        // Mesclar dados do Shopify com dados manuais (se houver)
        const dataToSend: BekaAppData = {
            ...shopifyData,
            customer: {
                ...(shopifyData?.customer || {}),
                name: userData?.nome || shopifyData?.customer?.name,
                email: userData?.email || shopifyData?.customer?.email,
                phone: userData?.phone || shopifyData?.customer?.phone,
            },
        };

        console.log('[BekaWidget] Enviando dados para persistir-contato:', dataToSend);

        try {
            const response = await fetch('/api/shopify-sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    source: 'beka_widget_open',
                    data: dataToSend,
                }),
            });

            const result = await response.json();
            console.log('[BekaWidget] Resposta da API:', result);

            // Processar resposta usando as flags da API
            if (result.needsData) {
                // Usuário não autenticado - mostrar formulário
                console.log('[BekaWidget] Dados ausentes - mostrando formulário');
                setAuthStatus('needs_data');
            } else if (result.success) {
                // Usuário autenticado com sucesso
                console.log('[BekaWidget] Usuário autenticado com sucesso!');
                // Capturar e armazenar o contact_id
                if (result.contact_id) {
                    console.log('[BekaWidget] contact_id recebido:', result.contact_id);
                    setContactId(result.contact_id);
                }
                setAuthStatus('authenticated');
            } else if (result.isError) {
                // Erro ao processar contato
                console.error('[BekaWidget] Erro: contato não pode ser criado/atualizado');
                setAuthStatus('error');
                setAuthError(result.message || 'Não foi possível criar seu cadastro. Por favor, tente novamente.');
            } else {
                // Fallback: verificar mensagem para compatibilidade
                const message = result.message;
                if (message?.includes('Dados ausentes')) {
                    setAuthStatus('needs_data');
                } else if (message?.includes('Usuário criado') || message?.includes('Usuário atualizado')) {
                    // Capturar o contact_id no fallback também
                    if (result.contact_id) {
                        console.log('[BekaWidget] contact_id recebido (fallback):', result.contact_id);
                        setContactId(result.contact_id);
                    }
                    setAuthStatus('authenticated');
                } else {
                    console.error('[BekaWidget] Resposta não reconhecida:', result);
                    setAuthStatus('error');
                    setAuthError(message || 'Erro desconhecido. Por favor, tente novamente.');
                }
            }
        } catch (error) {
            console.error('[BekaWidget] Erro ao enviar para persistir-contato:', error);
            setAuthStatus('error');
            setAuthError('Erro de conexão. Por favor, verifique sua internet e tente novamente.');
        } finally {
            isAuthenticatingRef.current = false;
        }
    }, [shopifyData]);

    // Enviar dados quando o usuário abre o chat
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        // Se já autenticou, não precisa verificar novamente
        if (authStatus === 'authenticated') {
            return;
        }

        // Verificar apenas uma vez quando abre
        if (authStatus === 'idle' && !hasCheckedAuthRef.current) {
            hasCheckedAuthRef.current = true;
            sendToN8n();
        }
    }, [isOpen, authStatus, sendToN8n]);

    // Reset estado quando fecha o chat
    useEffect(() => {
        if (!isOpen) {
            // Só reseta se estava em estado de erro ou needs_data
            // Não reseta se já estava autenticado
            if (authStatus !== 'authenticated') {
                hasCheckedAuthRef.current = false;
                // Não resetamos para idle aqui para evitar re-verificação desnecessária
            }
        }
    }, [isOpen, authStatus]);

    // Notify parent window (host site) when widget opens/closes
    useEffect(() => {
        const message = isOpen ? "BEKA_WIDGET_OPEN" : "BEKA_WIDGET_CLOSE";
        window.parent.postMessage(message, "*");
    }, [isOpen]);

    /**
     * Handler para submissão do formulário de dados
     */
    const handleFormSubmit = async (data: { nome: string; email: string; phone: string }) => {
        setIsSubmitting(true);
        setManualUserData(data);
        await sendToN8n(data);
        setIsSubmitting(false);
    };

    /**
     * Handler para retry em caso de erro
     */
    const handleRetry = useCallback(() => {
        hasCheckedAuthRef.current = false;
        isAuthenticatingRef.current = false;
        setAuthStatus('idle');
        setAuthError(null);
        // Dispara verificação novamente no próximo render
        setTimeout(() => {
            sendToN8n(manualUserData || undefined);
        }, 100);
    }, [manualUserData, sendToN8n]);

    /**
     * Renderiza o conteúdo baseado no status de autenticação
     */
    const renderContent = () => {
        switch (authStatus) {
            case 'idle':
            case 'pending':
                // Loading state
                return (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 bg-linear-to-tr from-accent-mint via-accent-lime to-accent-yellow rounded-full blur-xl opacity-80 animate-pulse" />
                            <div className="absolute inset-2 bg-surface-white/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-accent-mint" />
                            </div>
                        </div>
                        <p className="text-text-secondary text-sm">Carregando...</p>
                    </div>
                );

            case 'needs_data':
                // Formulário para coletar dados
                return (
                    <UserDataForm
                        onSubmit={handleFormSubmit}
                        onClose={() => setIsOpen(false)}
                        isLoading={isSubmitting}
                        error={authError}
                        store={shopifyData?.store}
                    />
                );

            case 'error':
                // Estado de erro
                return (
                    <div className="flex flex-col items-center justify-center h-full px-6 gap-6">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 bg-linear-to-tr from-red-400 to-orange-400 rounded-full blur-xl opacity-60 animate-pulse" />
                            <div className="absolute inset-2 bg-surface-white/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-text-primary mb-2">
                                Ops! Algo deu errado
                            </h3>
                            <p className="text-text-secondary text-sm max-w-xs">
                                {authError || 'Não foi possível conectar ao serviço.'}
                            </p>
                        </div>
                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-linear-to-r from-accent-mint to-accent-lime text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Tentar Novamente
                        </button>
                    </div>
                );

            case 'authenticated':
                // Chat normal
                return (
                    <ChatContainer
                        onClose={() => setIsOpen(false)}
                        shopifyData={manualUserData ? {
                            ...shopifyData,
                            customer: {
                                ...(shopifyData?.customer || {}),
                                name: manualUserData.nome,
                                email: manualUserData.email,
                                phone: manualUserData.phone,
                            },
                        } : shopifyData}
                        contactId={contactId}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <>
            <div
                className={cn(
                    // Chat container - positioned above mobile nav bar
                    "fixed bottom-24 right-2 left-2 md:bottom-4 md:left-auto md:right-4 z-40 md:w-[400px] h-[calc(100vh-10rem)] md:h-[calc(100vh-6rem)] max-h-[600px] transition-all duration-300 ease-in-out",
                    isOpen
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                )}
            >
                <div className="h-full w-full rounded-3xl md:rounded-4xl shadow-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
                    {renderContent()}
                </div>
            </div>

            <Launcher
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                store={shopifyData?.store as 'AGRO' | 'FISHING' | 'MOTORS'}
            />
        </>
    );
}
