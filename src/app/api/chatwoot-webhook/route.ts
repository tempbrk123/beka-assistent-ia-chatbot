import { NextRequest, NextResponse } from 'next/server';
import { chatwootStore, ChatwootMessage } from '@/lib/chatwootMessages';
import { Product } from '@/types/chat';

/**
 * Webhook endpoint para receber eventos do Chatwoot
 * 
 * O Chatwoot envia eventos como message_created quando mensagens são enviadas/recebidas
 * Este endpoint filtra apenas mensagens de agentes (outgoing) e as armazena no store
 * 
 * O conteúdo pode ser:
 * - Texto simples
 * - JSON com formato { Beka: string | Product[], ButtonLabel?: string[] }
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
        const rawContent = payload.content;
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
            content: rawContent?.substring?.(0, 100) || rawContent,
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

        if (!contactId || !rawContent) {
            console.warn('[ChatwootWebhook] Dados insuficientes:', { contactId, hasContent: !!rawContent });
            return NextResponse.json({ success: false, error: 'Missing contact_id or content' }, { status: 400 });
        }

        // Tentar parsear o conteúdo como JSON (formato Beka)
        let finalContent: string | Product[] = rawContent;
        let buttonLabels: string[] | undefined;

        try {
            // Tentar parse direto
            let parsed;
            try {
                parsed = JSON.parse(rawContent);
            } catch {
                // Tentar limpar markdown de código (```json ... ```)
                const cleaned = rawContent.replace(/```json\s*|\s*```/g, '').trim();
                if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
                    parsed = JSON.parse(cleaned);
                }
            }

            if (parsed) {
                // Se for array direto, são produtos
                if (Array.isArray(parsed)) {
                    finalContent = parsed as Product[];
                    console.log('[ChatwootWebhook] Conteúdo é array de produtos:', parsed.length);
                }
                // Se tiver campo Beka, extrair
                else if (parsed.Beka !== undefined) {
                    // Beka pode ser string ou array de produtos
                    if (typeof parsed.Beka === 'string') {
                        // Verificar se Beka é JSON string
                        const trimmedBeka = parsed.Beka.trim();
                        if ((trimmedBeka.startsWith('[') && trimmedBeka.endsWith(']')) ||
                            (trimmedBeka.startsWith('{') && trimmedBeka.endsWith('}'))) {
                            try {
                                const parsedBeka = JSON.parse(trimmedBeka);
                                finalContent = parsedBeka;
                            } catch {
                                finalContent = parsed.Beka;
                            }
                        } else {
                            finalContent = parsed.Beka;
                        }
                    } else {
                        finalContent = parsed.Beka;
                    }

                    // Extrair ButtonLabel se existir
                    if (parsed.ButtonLabel && Array.isArray(parsed.ButtonLabel)) {
                        buttonLabels = parsed.ButtonLabel;
                        console.log('[ChatwootWebhook] ButtonLabels extraídos:', buttonLabels);
                    }

                    console.log('[ChatwootWebhook] Conteúdo Beka extraído:',
                        typeof finalContent === 'string' ? finalContent.substring(0, 50) : '[Array]');
                }
            }
        } catch (e) {
            // Não é JSON, manter como texto
            console.log('[ChatwootWebhook] Conteúdo não é JSON, tratando como texto');
        }

        // Criar mensagem para o store
        const chatwootMessage: ChatwootMessage = {
            id: messageId,
            content: finalContent,
            sender_name: sender?.name || sender?.available_name || 'Agente',
            sender_type: 'user', // agente
            timestamp: Date.now(),
            contact_id: contactId,
            buttonLabels: buttonLabels,
        };

        // Adicionar ao store (isso também notifica os listeners SSE)
        chatwootStore.addMessage(chatwootMessage);

        console.log('[ChatwootWebhook] Mensagem armazenada com sucesso');

        return NextResponse.json({
            success: true,
            message_id: messageId,
            contact_id: contactId,
            has_buttons: !!buttonLabels,
            content_type: Array.isArray(finalContent) ? 'products' : 'text'
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
