'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LauncherProps {
    isOpen: boolean;
    onClick: () => void;
    unreadCount?: number;
    store?: 'AGRO' | 'FISHING' | 'MOTORS';
}

// Mapeamento de logos por loja
const storeLogos: Record<string, string> = {
    'AGRO': '/logo_beka_agro.png',
    'FISHING': '/logo_beka_fishing.png',
    'MOTORS': '/logo_beka_motors.png',
};

export function Launcher({ isOpen, onClick, unreadCount = 0, store = 'AGRO' }: LauncherProps) {
    const [showChat, setShowChat] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Alterna entre logo e ícone de chat a cada 3 segundos
    useEffect(() => {
        if (isOpen) return; // Não animar quando o chat está aberto

        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setShowChat(prev => !prev);
                setIsAnimating(false);
            }, 300); // Metade da animação
        }, 3000);

        return () => clearInterval(interval);
    }, [isOpen]);

    const logoSrc = storeLogos[store] || storeLogos['AGRO'];

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {/* Efeito de pulse no fundo */}
            {!isOpen && (
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '1s' }} />
            )}

            <Button
                id='beka-assistent-btn'
                onClick={onClick}
                size="icon"
                className={cn(
                    "h-15 w-15 border-2 cursor-pointer m-3 rounded-full border-white/30 shadow-xl transition-all duration-300 hover:scale-110 backdrop-blur-xl backdrop-saturate-200 bg-white/70 hover:bg-white/90 relative overflow-hidden",
                    isOpen && "opacity-0 scale-0 pointer-events-none"
                )}
            >
                {/* Container de animação morph */}
                <div className="relative flex items-center justify-center w-full h-full">
                    {/* Logo da Loja */}
                    <div
                        className={cn(
                            "absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out",
                            showChat || isAnimating
                                ? "opacity-0 scale-50 rotate-180"
                                : "opacity-100 scale-100 rotate-0"
                        )}
                    >
                        <img
                            src={logoSrc}
                            alt="Beka"
                            className="w-9 h-9 ml-2 object-contain "
                        />
                    </div>

                    {/* Ícone de Chat */}
                    <div
                        className={cn(
                            "absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out",
                            showChat && !isAnimating
                                ? "opacity-100 scale-100 rotate-0"
                                : "opacity-0 scale-50 -rotate-180"
                        )}
                    >
                        <MessageCircle className="h-7 w-7 text-primary drop-shadow-lg" />
                    </div>
                </div>

                {/* Badge de mensagens não lidas */}
                {!isOpen && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-bounce">
                        {unreadCount}
                    </span>
                )}
            </Button>
        </div>
    );
}
