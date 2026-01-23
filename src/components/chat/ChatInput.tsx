'use client';

import { useState, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
    const [input, setInput] = useState('');

    const handleSend = () => {
        const trimmedInput = input.trim();
        if (trimmedInput && !isLoading && !disabled) {
            onSend(trimmedInput);
            setInput('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-2 md:p-4 w-full flex justify-center">
            <div className="w-full max-w-4xl bg-surface-white/90 backdrop-blur-md shadow-2xl rounded-[24px] md:rounded-[32px] p-1.5 md:p-2 flex items-end gap-2 border border-white/50 relative overflow-hidden">

                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading || disabled}
                    className="min-h-[44px] md:min-h-[52px] max-h-[150px] md:max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 text-text-primary placeholder:text-text-secondary/50 text-sm md:text-base py-3 px-3 md:py-3.5 md:px-4 flex-1 rounded-[20px] md:rounded-[24px]"
                    rows={1}
                />
                <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || disabled}
                    size="icon"
                    className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary text-white hover:bg-[#30800a] cursor-pointer shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md mb-0.5 mr-0.5"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4 md:h-5 md:w-5 ml-0.5" />
                    )}
                    <span className="sr-only">Enviar mensagem</span>
                </Button>
            </div>
        </div>
    );
}
