import { NextRequest, NextResponse } from 'next/server';

// Endpoint para persistir mensagens das conversas
const PERSIST_MESSAGE_URL = 'https://n8n.usebrk.com.br/webhook/persistir-conversations-messages-chatwoot';

/**
 * Endpoint para persistir mensagens das conversas no Chatwoot
 * Chamado quando o usuário envia uma mensagem no chat
 * 
 * Payload esperado:
 * {
 *   "message": "Mensagem do usuário",
 *   "contact_id": 7911
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, contact_id } = body;

        console.log('[PersistMessage] Recebido:', { message, contact_id });

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Mensagem inválida' },
                { status: 400 }
            );
        }

        if (!contact_id) {
            console.warn('[PersistMessage] contact_id não fornecido');
            return NextResponse.json(
                { success: false, error: 'contact_id não fornecido' },
                { status: 400 }
            );
        }

        console.log('[PersistMessage] Enviando para webhook:', { message, contact_id });

        const webhookResponse = await fetch(PERSIST_MESSAGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                contact_id,
            }),
        });

        let webhookData = {};
        try {
            webhookData = await webhookResponse.json();
        } catch {
            const textResponse = await webhookResponse.text();
            console.log('[PersistMessage] Resposta do webhook (texto):', textResponse);
            webhookData = { raw: textResponse };
        }

        console.log('[PersistMessage] Resposta do webhook:', {
            status: webhookResponse.status,
            data: webhookData,
        });

        return NextResponse.json({
            success: webhookResponse.ok,
            message: 'Mensagem persistida',
            webhookResponse: webhookData,
        });

    } catch (error) {
        console.error('[PersistMessage] Erro ao persistir mensagem:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Erro ao persistir mensagem',
            },
            { status: 500 }
        );
    }
}
