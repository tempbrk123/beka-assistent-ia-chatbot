import { NextRequest } from 'next/server';
import { chatwootStore, ChatwootMessage } from '@/lib/chatwootMessages';

/**
 * Server-Sent Events endpoint para streaming de mensagens do Chatwoot
 * 
 * O cliente conecta passando o contact_id como query parameter
 * e recebe mensagens em tempo real quando chegam do webhook
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const contactIdStr = searchParams.get('contact_id');

    if (!contactIdStr) {
        return new Response(JSON.stringify({ error: 'contact_id is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const contactId = parseInt(contactIdStr, 10);

    if (isNaN(contactId)) {
        return new Response(JSON.stringify({ error: 'Invalid contact_id' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    console.log(`[ChatwootSSE] Nova conexão SSE para contact_id: ${contactId}`);

    // Criar stream de resposta
    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Função para enviar mensagem SSE
            const sendMessage = (message: ChatwootMessage) => {
                const data = JSON.stringify(message);
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            };

            // Enviar mensagens existentes primeiro
            const existingMessages = chatwootStore.getMessages(contactId);
            existingMessages.forEach(msg => sendMessage(msg));

            // Limpar mensagens após enviar (já foram consumidas)
            if (existingMessages.length > 0) {
                chatwootStore.clearMessages(contactId);
            }

            // Registrar listener para novas mensagens
            const unsubscribe = chatwootStore.subscribe(contactId, (message) => {
                try {
                    sendMessage(message);
                } catch (error) {
                    console.error('[ChatwootSSE] Erro ao enviar mensagem:', error);
                }
            });

            // Enviar heartbeat a cada 30s para manter conexão viva
            const heartbeatInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': heartbeat\n\n'));
                } catch {
                    clearInterval(heartbeatInterval);
                    unsubscribe();
                }
            }, 30000);

            // Cleanup quando a conexão é fechada
            request.signal.addEventListener('abort', () => {
                console.log(`[ChatwootSSE] Conexão fechada para contact_id: ${contactId}`);
                clearInterval(heartbeatInterval);
                unsubscribe();
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });
}
