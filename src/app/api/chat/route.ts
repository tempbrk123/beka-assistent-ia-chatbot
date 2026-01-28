import { NextRequest, NextResponse } from 'next/server';

const BEKA_API_URL = process.env.BEKA_API_URL || 'https://n8n.usebrk.com.br/webhook/beka_website_assistent';
const BEKA_API_TOKEN = process.env.BEKA_API_TOKEN || '';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, shopifyData } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Mensagem inválida' },
                { status: 400 }
            );
        }

        if (!BEKA_API_URL || !BEKA_API_TOKEN) {
            console.error('Configuration Error: Missing BEKA_API_URL or BEKA_API_TOKEN');
            return NextResponse.json(
                { error: 'Server configuration error: Missing API credentials' },
                { status: 500 }
            );
        }

        console.log('Enviando para API:', {
            message,
            url: BEKA_API_URL,
            hasShopifyData: !!shopifyData,
        });

        const response = await fetch(BEKA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BEKA_API_TOKEN}`,
            },
            body: JSON.stringify({
                message,
                shopifyData: shopifyData || undefined,
            }),
        });

        console.log('Status da resposta:', response.status);

        const responseText = await response.text();
        console.log('Resposta raw:', responseText);

        if (!response.ok) {
            console.error('API retornou erro:', response.status, responseText);
            throw new Error(`API retornou status ${response.status}`);
        }

        // Tentar parsear como JSON com lógica robusta
        let data;
        try {
            // 1. Tentar parse direto
            try {
                data = JSON.parse(responseText);
            } catch {
                // 2. Se falhar, tentar limpar markdown de código (```json ... ```)
                const cleaned = responseText.replace(/```json\s*|\s*```/g, '').trim();
                data = JSON.parse(cleaned);
            }

            // Normalização dos dados

            // Se a resposta for direto um array (lista de produtos), mover para Beka
            if (Array.isArray(data)) {
                data = { Beka: data };
            }

            // Se Beka for uma string que parece JSON, tentar parsear
            if (data.Beka && typeof data.Beka === 'string') {
                const trimmedBeka = data.Beka.trim();
                if ((trimmedBeka.startsWith('[') && trimmedBeka.endsWith(']')) ||
                    (trimmedBeka.startsWith('{') && trimmedBeka.endsWith('}'))) {
                    try {
                        const parsedBeka = JSON.parse(trimmedBeka);
                        data.Beka = parsedBeka;
                    } catch (e) {
                        console.warn('Falha ao parsear string JSON dentro de Beka:', e);
                    }
                }
            }

            // Verificação de duplo aninhamento (casos onde data.Beka.Beka existe)
            if (data.Beka && typeof data.Beka === 'object' && !Array.isArray(data.Beka) && 'Beka' in data.Beka) {
                // Se existe ButtonLabel no nível interno, subir para o principal
                if (data.Beka.ButtonLabel) {
                    data.ButtonLabel = data.Beka.ButtonLabel;
                }
                data.Beka = data.Beka.Beka;
            }

        } catch (e) {
            // Se realmente não for JSON válido, retornar como texto simples
            console.log('Resposta não é JSON válido após tentativas, tratando como texto:', e);
            data = { Beka: responseText };
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Erro ao conectar com a API:', error);
        return NextResponse.json(
            { error: 'Não foi possível conectar com o assistente. Tente novamente.' },
            { status: 500 }
        );
    }
}
