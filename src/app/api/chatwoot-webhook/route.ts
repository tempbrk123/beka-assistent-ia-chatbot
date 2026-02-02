import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/types/chat';

// Store simples usando variável global (funciona melhor em serverless)
// Em produção real, usar Redis/Supabase/Firebase
declare global {
    // eslint-disable-next-line no-var
    var chatwootPendingMessages: Map<number, PendingMessage[]> | undefined;
}

export interface PendingMessage {
    id: string;
    content: string | Product[];
    sender_name: string;
    timestamp: number;
    buttonLabels?: string[];
}

// Inicializar store global
if (!global.chatwootPendingMessages) {
    global.chatwootPendingMessages = new Map();
}

/**
 * GET: Polling endpoint - cliente busca mensagens pendentes
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const contactIdStr = searchParams.get('contact_id');

    if (!contactIdStr) {
        return NextResponse.json({ error: 'contact_id is required' }, { status: 400 });
    }

    const contactId = parseInt(contactIdStr, 10);

    if (isNaN(contactId)) {
        return NextResponse.json({ error: 'Invalid contact_id' }, { status: 400 });
    }

    // Buscar e limpar mensagens pendentes
    const messages = global.chatwootPendingMessages?.get(contactId) || [];

    if (messages.length > 0) {
        global.chatwootPendingMessages?.delete(contactId);
        console.log(`[ChatwootWebhook] GET - Retornando ${messages.length} mensagens para contact_id ${contactId}`);
    }

    return NextResponse.json({
        success: true,
        messages,
        count: messages.length
    });
}

/**
 * POST: Webhook endpoint - recebe eventos do Chatwoot
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
        const messageType = payload.message_type;
        const rawContent = payload.content;
        const messageId = payload.id?.toString() || payload.source_id;
        const sender = payload.sender;
        const conversation = payload.conversation;

        // Extrair contact_id
        const contactId =
            conversation?.contact_inbox?.contact_id ||
            sender?.id ||
            payload.sender_id;

        console.log('[ChatwootWebhook] Dados extraídos:', {
            messageType,
            content: rawContent?.substring?.(0, 100) || rawContent,
            messageId,
            contactId,
        });

        // Filtrar apenas mensagens de agentes (outgoing)
        if (messageType !== 'outgoing') {
            console.log('[ChatwootWebhook] Ignorando mensagem incoming (do cliente)');
            return NextResponse.json({ success: true, ignored: true, reason: 'incoming_message' });
        }

        if (!contactId || !rawContent) {
            console.warn('[ChatwootWebhook] Dados insuficientes:', { contactId, hasContent: !!rawContent });
            return NextResponse.json({ success: false, error: 'Missing contact_id or content' }, { status: 400 });
        }

        // Tentar parsear o conteúdo como JSON (formato Beka)
        let finalContent: string | Product[] = rawContent;
        let buttonLabels: string[] | undefined;

        try {
            let parsed;
            try {
                parsed = JSON.parse(rawContent);
            } catch {
                const cleaned = rawContent.replace(/```json\s*|\s*```/g, '').trim();
                if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
                    parsed = JSON.parse(cleaned);
                }
            }

            if (parsed) {
                if (Array.isArray(parsed)) {
                    finalContent = parsed as Product[];
                } else if (parsed.Beka !== undefined) {
                    if (typeof parsed.Beka === 'string') {
                        const trimmedBeka = parsed.Beka.trim();
                        if ((trimmedBeka.startsWith('[') && trimmedBeka.endsWith(']')) ||
                            (trimmedBeka.startsWith('{') && trimmedBeka.endsWith('}'))) {
                            try {
                                finalContent = JSON.parse(trimmedBeka);
                            } catch {
                                finalContent = parsed.Beka;
                            }
                        } else {
                            finalContent = parsed.Beka;
                        }
                    } else {
                        finalContent = parsed.Beka;
                    }

                    if (parsed.ButtonLabel && Array.isArray(parsed.ButtonLabel)) {
                        buttonLabels = parsed.ButtonLabel;
                    }
                }
            }
        } catch {
            // Não é JSON, manter como texto
        }

        // Criar mensagem pendente
        const pendingMessage: PendingMessage = {
            id: messageId,
            content: finalContent,
            sender_name: sender?.name || sender?.available_name || 'Agente',
            timestamp: Date.now(),
            buttonLabels: buttonLabels,
        };

        // Adicionar ao store global
        if (!global.chatwootPendingMessages) {
            global.chatwootPendingMessages = new Map();
        }

        const existing = global.chatwootPendingMessages.get(contactId) || [];

        // Evitar duplicatas
        if (!existing.some(m => m.id === pendingMessage.id)) {
            existing.push(pendingMessage);
            global.chatwootPendingMessages.set(contactId, existing);
            console.log(`[ChatwootWebhook] Mensagem adicionada para contact_id ${contactId}`);
        }

        return NextResponse.json({
            success: true,
            message_id: messageId,
            contact_id: contactId,
        });

    } catch (error) {
        console.error('[ChatwootWebhook] Erro ao processar webhook:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
