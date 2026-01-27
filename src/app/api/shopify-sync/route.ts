import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para receber e processar dados da sessão do Shopify
 * Estes dados chegam do hook useShopifyData quando o widget é carregado em uma loja Shopify
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { timestamp, source, data } = body;

        // Validar se temos dados da Shopify
        if (!data) {
            return NextResponse.json(
                { error: 'Dados da Shopify não fornecidos' },
                { status: 400 }
            );
        }

        console.log('[ShopifySync] Dados recebidos:', {
            timestamp,
            source,
            shop: data.shop,
            customer: data.customer?.id || data.customer?.name || 'Visitante',
            cartItemCount: data.cart?.item_count || 0,
            hasProduct: !!data.product,
        });

        // Aqui você pode:
        // 1. Armazenar os dados em um banco de dados
        // 2. Enviar para um serviço externo
        // 3. Criar uma sessão para o usuário
        // 4. Qualquer outra lógica de negócio necessária

        // Por enquanto, apenas retornamos sucesso
        return NextResponse.json({
            success: true,
            message: 'Dados da Shopify sincronizados com sucesso',
            receivedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[ShopifySync] Erro ao processar dados:', error);
        return NextResponse.json(
            { error: 'Erro ao processar dados da Shopify' },
            { status: 500 }
        );
    }
}
