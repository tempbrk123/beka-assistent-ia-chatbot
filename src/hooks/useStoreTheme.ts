'use client';

import { useEffect } from 'react';
import { StoreType } from './useShopifyData';

/**
 * Configuração de tema por loja
 * - AGRO: Verde (padrão) - #4a9d23
 * - FISHING: Azul - #135ed1
 * - MOTORS: Laranja - #fc5106
 */
const STORE_THEMES: Record<StoreType, string> = {
    AGRO: 'theme-agro',
    FISHING: 'theme-fishing',
    MOTORS: 'theme-motors',
    DEFAULT: 'theme-agro', // Default usa o tema do Agro
};

/**
 * Hook para aplicar o tema da loja baseado no valor de store recebido
 */
export function useStoreTheme(store?: StoreType) {
    useEffect(() => {
        // Remove todos os temas anteriores
        const root = document.documentElement;
        Object.values(STORE_THEMES).forEach((themeClass) => {
            root.classList.remove(themeClass);
        });

        // Aplica o tema atual
        const themeClass = store ? STORE_THEMES[store] : STORE_THEMES.DEFAULT;
        root.classList.add(themeClass);

        console.log(`[BekaTheme] Aplicando tema: ${themeClass} para store: ${store || 'DEFAULT'}`);

        // Cleanup ao desmontar
        return () => {
            root.classList.remove(themeClass);
        };
    }, [store]);
}

export { STORE_THEMES };
