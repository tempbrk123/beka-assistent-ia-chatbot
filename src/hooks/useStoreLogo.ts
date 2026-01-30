'use client';

import { useMemo } from 'react';
import { StoreType } from './useShopifyData';

/**
 * Configuração de logos por loja
 */
interface StoreLogos {
    /** Logo completa com texto (para o header) */
    logoFull: string;
    /** Logo apenas ícone (para orbs e badges) */
    logoIcon: string;
}

const STORE_LOGOS: Record<StoreType, StoreLogos> = {
    AGRO: {
        logoFull: '/logotipo_beka_agro.png',
        logoIcon: '/logo_beka_agro.png',
    },
    FISHING: {
        logoFull: '/logotipo_beka_fishing.png',
        logoIcon: '/logo_beka_fishing.png',
    },
    MOTORS: {
        logoFull: '/logotipo_beka_motors.png',
        logoIcon: '/logo_beka_motors.png',
    },
    DEFAULT: {
        logoFull: '/logotipo_beka_agro.png',
        logoIcon: '/logo_beka_agro.png',
    },
};

/**
 * Hook para obter os caminhos das logos baseado na loja
 * @param store - Tipo da loja (AGRO, FISHING, MOTORS)
 * @returns Objeto com os caminhos das logos (logoFull e logoIcon)
 */
export function useStoreLogo(store?: StoreType): StoreLogos {
    const logos = useMemo(() => {
        return store ? STORE_LOGOS[store] : STORE_LOGOS.DEFAULT;
    }, [store]);

    return logos;
}

export { STORE_LOGOS };
export type { StoreLogos };
