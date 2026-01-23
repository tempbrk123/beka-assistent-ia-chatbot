'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, BekaResponse, Product } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Loader2, Leaf } from 'lucide-react';
import { SplitText } from '@/components/ui/SplitText';

const STORAGE_KEY = 'beka-chat-history';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ChatContainer() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load messages from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setMessages(parsed);
            }
        } catch (e) {
            console.error('Error loading chat history:', e);
        }
        setIsHydrated(true);
    }, []);

    // Save messages to localStorage when they change
    useEffect(() => {
        if (isHydrated && messages.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
            } catch (e) {
                console.error('Error saving chat history:', e);
            }
        }
    }, [messages, isHydrated]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const sendMessage = async (content: string) => {
        setError(null);

        // Add user message
        const userMessage: Message = {
            id: generateId(),
            role: 'user',
            content,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: content }),
            });

            if (!response.ok) {
                throw new Error('Falha ao enviar mensagem');
            }

            const data: BekaResponse = await response.json();

            // Add assistant message with optional button labels
            const assistantMessage: Message = {
                id: generateId(),
                role: 'assistant',
                content: data.Beka,
                timestamp: Date.now(),
                buttonLabels: data.ButtonLabel,
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (e) {
            console.error('Error sending message:', e);
            setError('Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = () => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <div className="flex flex-col h-[100dvh] relative overflow-hidden bg-background">
            {/* Background Decor - Aurora Glow */}
            <div className="aurora-glow top-[-10%] left-[-10%] opacity-60 animate-pulse pointer-events-none z-0" />
            <div className="aurora-glow bottom-[10%] right-[-5%] w-[500px] h-[100px] opacity-40 pointer-events-none z-0" />

            {/* Header simplified or removed - keeping just a clean space or floating controls if needed */}
            {/* Header - Fixed Glass Bar with Safe Area */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-3 flex items-center justify-between bg-gradient-to-b from-surface-white/95 via-surface-white/80 to-transparent backdrop-blur-md transition-all duration-300">
                <div className="flex items-center gap-3">
                    <div className="h-10 bg-surface-white/50 backdrop-blur-md flex items-center justify-center shadow-sm border border-white/40 overflow-hidden rounded-full px-2">
                        <img src="/logo_beka_ia.png" alt="Beka" className="h-8 object-contain" />
                    </div>
                </div>

                {messages.length > 0 && (
                    <button
                        onClick={clearHistory}
                        className="text-xs font-medium text-text-secondary hover:text-red-500 bg-surface-white/50 hover:bg-surface-white backdrop-blur-md px-4 py-2 rounded-full transition-all border border-white/40 shadow-sm hover:shadow"
                    >
                        Limpar
                    </button>
                )}
            </header>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-4 pt-24 pb-6 space-y-6 scroll-smooth overscroll-contain">
                {!isHydrated ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-text-primary" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 relative z-0">

                        {/* Voice Orb - Visual Centerpiece */}
                        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-tr from-accent-mint via-accent-lime to-accent-yellow rounded-full blur-xl opacity-80 animate-pulse" />
                            <div className="absolute inset-2 bg-surface-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-inner overflow-hidden">
                                <img src="/logo_beka_only.png" alt="Beka" className="w-20 h-20 object-contain" />
                            </div>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-3 tracking-tight">
                            <SplitText text="Olá! Sou a Beka" delay={300} />
                        </h2>
                        <p className="text-text-secondary max-w-md mb-10 text-lg leading-relaxed font-medium">
                            <SplitText text="Como posso te ajudar hoje?" delay={1000} className="text-lg" />
                        </p>

                        <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                            {['Quais produtos vocês têm?', 'Preciso de ajuda técnica', 'Ver novidades do Agro'].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => sendMessage(suggestion)}
                                    className="px-6 py-3 rounded-[32px] bg-surface-white/60 backdrop-blur-sm text-text-primary hover:bg-surface-white transition-all duration-300 shadow-sm hover:shadow-lg border border-white/40 hover:-translate-y-0.5 text-sm font-medium"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto w-full space-y-6 pb-4">
                        {messages.map((message) => (
                            <ChatMessage
                                key={message.id}
                                message={message}
                                onButtonClick={sendMessage}
                            />
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-text-secondary animate-in fade-in pl-4">
                                <div className="flex items-center gap-1.5 px-5 py-4 bg-surface-white/50 backdrop-blur-sm rounded-[24px] rounded-bl-sm shadow-sm">
                                    <span className="w-2 h-2 bg-text-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-text-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-text-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
    );
}
