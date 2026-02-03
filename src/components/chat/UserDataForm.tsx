'use client';

import { useState } from 'react';
import { Loader2, User, Mail, Phone, AlertCircle, X } from 'lucide-react';
import { useStoreLogo } from '@/hooks/useStoreLogo';
import { StoreType } from '@/hooks/useShopifyData';

interface UserDataFormProps {
    onSubmit: (data: { nome: string; email: string; phone: string }) => Promise<void>;
    onClose?: () => void;
    isLoading?: boolean;
    error?: string | null;
    store?: StoreType;
}

export function UserDataForm({ onSubmit, onClose, isLoading = false, error, store }: UserDataFormProps) {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    // Obter logo da loja
    const { logoIcon } = useStoreLogo(store);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const formatPhone = (value: string): string => {
        // Remove tudo que não é número
        const numbers = value.replace(/\D/g, '');

        // Formata como telefone brasileiro
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setPhone(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        // Validações
        if (!nome.trim()) {
            setValidationError('Por favor, informe seu nome completo.');
            return;
        }

        if (!email.trim() || !validateEmail(email)) {
            setValidationError('Por favor, informe um e-mail válido.');
            return;
        }

        const phoneNumbers = phone.replace(/\D/g, '');
        if (phoneNumbers.length < 10) {
            setValidationError('Por favor, informe um telefone válido com DDD.');
            return;
        }

        await onSubmit({ nome: nome.trim(), email: email.trim(), phone: phoneNumbers });
    };

    return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-8 relative z-10">

            {/* Close Button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-surface-white/60 backdrop-blur-sm border border-black/10 text-text-secondary hover:text-text-primary hover:bg-surface-white transition-all duration-200 cursor-pointer"
                    aria-label="Fechar chat"
                >
                    <X className="h-5 w-5" />
                </button>
            )}

            {/* Header / Logo 
        Refatorado: Removemos divs aninhadas desnecessárias e posições absolutas.
        Usamos apenas flexbox para centralizar.
    */}
            <div className="mb-6 p-4 rounded-full backdrop-blur-sm flex items-center justify-center">
                <img
                    src={logoIcon || '/logo_beka_agro.png'}
                    alt="Beka"
                    className="w-19 h-auto"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo_beka_agro.png';
                    }}
                />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-text-primary mb-2 text-center">
                Bem-vindo à Beka!
            </h2>
            <p className="text-text-secondary text-center mb-6 max-w-sm">
                Para iniciar seu atendimento, precisamos de algumas informações.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">

                {/* PADRÃO INPUT GROUP (Sem Position Absolute)
           1. O container pai (div) age como a "caixa" visual (borda, fundo, arredondamento).
           2. Usamos 'focus-within' no pai para que ele mude de cor quando o input filho for clicado.
           3. O input fica transparente e sem bordas, preenchendo o espaço restante (flex-1).
        */}

                {/* Campo Nome */}
                <div className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-surface-white/60 backdrop-blur-sm border border-black/10 transition-all focus-within:ring-2 focus-within:ring-accent-mint/50 focus-within:border-accent-mint">
                    <User className="h-5 w-5 text-accent-mint shrink-0" />
                    <input
                        type="text"
                        placeholder="Seu nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary/60 disabled:opacity-50 min-w-0"
                    />
                </div>

                {/* Campo Email */}
                <div className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-surface-white/60 backdrop-blur-sm border border-black/10 transition-all focus-within:ring-2 focus-within:ring-accent-mint/50 focus-within:border-accent-mint">
                    <Mail className="h-5 w-5 text-accent-mint shrink-0" />
                    <input
                        type="email"
                        placeholder="Seu e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary/60 disabled:opacity-50 min-w-0"
                    />
                </div>

                {/* Campo Telefone */}
                <div className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-surface-white/60 backdrop-blur-sm border border-black/10 transition-all focus-within:ring-2 focus-within:ring-accent-mint/50 focus-within:border-accent-mint">
                    <Phone className="h-5 w-5 text-accent-mint shrink-0" />
                    <input
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={phone}
                        onChange={handlePhoneChange}
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary/60 disabled:opacity-50 min-w-0"
                    />
                </div>

                {/* Error Messages */}
                {(validationError || error) && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{validationError || error}</span>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-linear-to-r from-accent-mint to-accent-lime text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center cursor-pointer justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        'Iniciar Conversa'
                    )}
                </button>
            </form>
            {/* Privacy Note */}
            <p className="text-xs text-text-secondary/60 text-center mt-6 max-w-xs">
                Suas informações são protegidas e utilizadas apenas para seu atendimento.
            </p>
        </div>
    );
}
