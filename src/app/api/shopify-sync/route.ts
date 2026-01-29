import { NextRequest, NextResponse } from 'next/server';

// Endpoint para persistir dados do contato (usado ao ABRIR o chat)
const PERSIST_CONTACT_URL = 'https://n8n.usebrk.com.br/webhook/persistir-contato-chatwoot';
const BEKA_API_TOKEN = process.env.BEKA_API_TOKEN || '';

/**
 * Endpoint para persistir dados do contato do usuário
 * Chamado quando o usuário abre o chat widget
 * Envia apenas dados do contato: login, nome, email, phone
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

        // Extrair apenas os dados do contato do usuário
        const customer = data.customer || {};
        const contactData = {
            nome: customer.name || customer.first_name || null,
            email: customer.email || null,
            phone: customer.phone || null,
        };

        console.log('[PersistContact] Dados do contato recebidos:', {
            timestamp,
            source,
            contact: contactData,
        });

        // Verificar se temos pelo menos um dado de contato válido
        const hasContactInfo = contactData.nome || contactData.email || contactData.phone;

        if (!hasContactInfo) {
            console.log('[PersistContact] Nenhum dado de contato válido, pulando envio');
            return NextResponse.json({
                success: true,
                message: 'Nenhum dado de contato para persistir (visitante anônimo)',
                receivedAt: new Date().toISOString(),
            });
        }

        console.log('[PersistContact] Enviando dados do contato para n8n...');

        const n8nResponse = await fetch(PERSIST_CONTACT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(BEKA_API_TOKEN && { 'Authorization': `Bearer ${BEKA_API_TOKEN}` }),
            },
            body: JSON.stringify({
                timestamp,
                source,
                ...contactData,
            }),
        });

        // Parse n8n response to get the message
        const n8nData = await n8nResponse.json().catch(() => ({}));
        const n8nMessage = n8nData.message || null;

        if (!n8nResponse.ok) {
            console.error('[PersistContact] n8n retornou erro:', n8nResponse.status);
            // Retorna a mensagem de erro do n8n
            return NextResponse.json({
                success: false,
                message: n8nMessage || 'Erro ao processar contato',
                receivedAt: new Date().toISOString(),
            });
        } else {
            console.log('[PersistContact] Resposta do n8n:', n8nMessage);
        }

        return NextResponse.json({
            success: true,
            message: n8nMessage || 'Dados do contato persistidos com sucesso',
            receivedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[PersistContact] Erro ao processar dados:', error);
        return NextResponse.json(
            { error: 'Erro ao persistir dados do contato' },
            { status: 500 }
        );
    }
}
