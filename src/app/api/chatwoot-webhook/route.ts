import { NextRequest, NextResponse } from 'next/server';
import { chatwootStore, ChatwootMessage } from '@/lib/chatwootMessages';

/**
 * Webhook endpoint para receber eventos do Chatwoot
 * 
 * O Chatwoot envia eventos como message_created quando mensagens são enviadas/recebidas
 * Este endpoint filtra apenas mensagens de agentes (outgoing) e as armazena no store
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // O payload pode vir como array ou objeto único
        const payload = Array.isArray(body) ? body[0]?.body : body.body || body;

        console.log('[ChatwootWebhook] Evento recebido:', payload?.event);

        // Verificar se é um evento de mensagem criada
        if (payload?.event !== 'message_created') {
            console.log('[ChatwootWebhook] Ignorando evento:', payload?.event);
            return NextResponse.json({ success: true, ignored: true });
        }

        // Extrair dados da mensagem
        const messageType = payload.message_type; // 'incoming' = cliente, 'outgoing' = agente
        const content = payload.content;
        const messageId = payload.id?.toString() || payload.source_id;
        const sender = payload.sender;
        const conversation = payload.conversation;

        // Extrair contact_id - pode estar em diferentes lugares do payload
        const contactId =
            conversation?.contact_inbox?.contact_id ||
            sender?.id ||
            payload.sender_id;

        console.log('[ChatwootWebhook] Dados extraídos:', {
            messageType,
            content: content?.substring(0, 50),
            messageId,
            contactId,
            senderType: sender?.type
        });

        // Filtrar apenas mensagens de agentes (outgoing)
        // Mensagens incoming são do cliente, não precisamos mostrar de volta
        if (messageType !== 'outgoing') {
            console.log('[ChatwootWebhook] Ignorando mensagem incoming (do cliente)');
            return NextResponse.json({ success: true, ignored: true, reason: 'incoming_message' });
        }

        if (!contactId || !content) {
            console.warn('[ChatwootWebhook] Dados insuficientes:', { contactId, hasContent: !!content });
            return NextResponse.json({ success: false, error: 'Missing contact_id or content' }, { status: 400 });
        }

        // Criar mensagem para o store
        const chatwootMessage: ChatwootMessage = {
            id: messageId,
            content: content,
            sender_name: sender?.name || sender?.available_name || 'Agente',
            sender_type: 'user', // agente
            timestamp: Date.now(),
            contact_id: contactId,
        };

        // Adicionar ao store (isso também notifica os listeners SSE)
        chatwootStore.addMessage(chatwootMessage);

        console.log('[ChatwootWebhook] Mensagem armazenada com sucesso');

        return NextResponse.json({
            success: true,
            message_id: messageId,
            contact_id: contactId
        });

    } catch (error) {
        console.error('[ChatwootWebhook] Erro ao processar webhook:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Também aceitar GET para verificação do endpoint
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Chatwoot webhook endpoint is ready'
    });
}
