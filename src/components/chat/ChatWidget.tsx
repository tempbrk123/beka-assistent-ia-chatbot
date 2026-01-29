'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { UserDataForm } from '@/components/chat/UserDataForm';
import { Launcher } from '@/components/chat/Launcher';
import { cn } from '@/lib/utils';
import { useShopifyData, BekaAppData } from '@/hooks/useShopifyData';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// Tipos de status de autenticação
type AuthStatus = 'idle' | 'pending' | 'needs_data' | 'authenticated' | 'error';

// Mensagens de resposta da API
const API_MESSAGES = {
    DADOS_AUSENTES: 'Dados ausentes.',
    USUARIO_CRIADO: 'Usuário criado com sucesso.',
    USUARIO_ATUALIZADO: 'Usuário atualizado com sucesso.',
    CONTATO_ERRO: 'Contato não pode ser criado nem atualizado.',
};

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
    const [authError, setAuthError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const hasSentToN8n = useRef(false);

    // Dados do formulário submetido (para usar junto com shopifyData)
    const [manualUserData, setManualUserData] = useState<{ nome: string; email: string; phone: string } | null>(null);

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

    /**
     * Envia dados para o webhook de persistir contato
     */
    const sendToN8n = async (userData?: { nome: string; email: string; phone: string }) => {
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

            // Processar resposta baseado na mensagem
            const message = result.message;

            if (message === API_MESSAGES.DADOS_AUSENTES) {
                console.log('[BekaWidget] Dados ausentes - mostrando formulário');
                setAuthStatus('needs_data');
            } else if (
                message === API_MESSAGES.USUARIO_CRIADO ||
                message === API_MESSAGES.USUARIO_ATUALIZADO
            ) {
                console.log('[BekaWidget] Usuário autenticado com sucesso!');
                setAuthStatus('authenticated');
                hasSentToN8n.current = true;
            } else if (message === API_MESSAGES.CONTATO_ERRO) {
                console.error('[BekaWidget] Erro: contato não pode ser criado/atualizado');
                setAuthStatus('error');
                setAuthError('Não foi possível criar seu cadastro. Por favor, tente novamente.');
            } else {
                // Resposta inesperada - verificar se foi sucesso
                if (result.success) {
                    console.log('[BekaWidget] Resposta de sucesso não reconhecida, liberando chat');
                    setAuthStatus('authenticated');
                    hasSentToN8n.current = true;
                } else {
                    console.error('[BekaWidget] Resposta de erro não reconhecida:', message);
                    setAuthStatus('error');
                    setAuthError(message || 'Erro desconhecido. Por favor, tente novamente.');
                }
            }
        } catch (error) {
            console.error('[BekaWidget] Erro ao enviar para persistir-contato:', error);
            setAuthStatus('error');
            setAuthError('Erro de conexão. Por favor, verifique sua internet e tente novamente.');
        }
    };

    // Enviar dados quando o usuário abre o chat
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        // Se já autenticou, não precisa verificar novamente
        if (authStatus === 'authenticated') {
            return;
        }

        // Reset para idle quando abre
        if (authStatus === 'idle') {
            sendToN8n();
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
    const handleRetry = () => {
        setAuthStatus('idle');
        setAuthError(null);
        sendToN8n(manualUserData || undefined);
    };

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
                            <div className="absolute inset-0 bg-gradient-to-tr from-accent-mint via-accent-lime to-accent-yellow rounded-full blur-xl opacity-80 animate-pulse" />
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
                        isLoading={isSubmitting}
                        error={authError}
                    />
                );

            case 'error':
                // Estado de erro
                return (
                    <div className="flex flex-col items-center justify-center h-full px-6 gap-6">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 bg-gradient-to-tr from-red-400 to-orange-400 rounded-full blur-xl opacity-60 animate-pulse" />
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
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-accent-mint to-accent-lime text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
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
                    "fixed bottom-20 right-4 z-40 w-[calc(100vw-2rem)] max-w-[400px] h-[calc(100vh-6rem)] max-h-[600px] transition-all duration-300 ease-in-out bg-transparent",
                    isOpen
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                )}
            >
                <div className="h-full w-full rounded-4xl shadow-2xl overflow-hidden bg-background/80 backdrop-blur-md">
                    {renderContent()}
                </div>
            </div>

            <Launcher
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            />
        </>
    );
}
