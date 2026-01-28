import { NextRequest, NextResponse } from 'next/server';

const BEKA_API_URL = process.env.BEKA_API_URL || 'https://n8n.usebrk.com.br/webhook/beka_website_assistent';
const BEKA_API_TOKEN = process.env.BEKA_API_TOKEN || '';

/**
 * Endpoint para receber e processar dados da sessão do Shopify
 * Estes dados chegam do hook useShopifyData quando o widget é carregado em uma loja Shopify
 * e são imediatamente enviados para o n8n
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

        // Enviar dados para o n8n
        if (!BEKA_API_URL || !BEKA_API_TOKEN) {
            console.error('[ShopifySync] Configuration Error: Missing BEKA_API_URL or BEKA_API_TOKEN');
            return NextResponse.json(
                { error: 'Server configuration error: Missing API credentials' },
                { status: 500 }
            );
        }

        console.log('[ShopifySync] Enviando dados para n8n...');

        const n8nResponse = await fetch(BEKA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BEKA_API_TOKEN}`,
            },
            body: JSON.stringify({
                type: 'shopify_session_init',
                timestamp,
                source,
                shopifyData: data,
            }),
        });

        if (!n8nResponse.ok) {
            console.error('[ShopifySync] n8n retornou erro:', n8nResponse.status);
            // Não falhar a requisição, apenas logar
        } else {
            console.log('[ShopifySync] Dados enviados para n8n com sucesso!');
        }

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
