import { NextRequest, NextResponse } from 'next/server';

// Endpoint para persistir dados do contato (usado ao ABRIR o chat)
const PERSIST_CONTACT_URL = 'https://n8n.usebrk.com.br/webhook/persistir-contato-chatwoot';
const BEKA_API_TOKEN = process.env.BEKA_API_TOKEN || '';

/**
 * Endpoint para persistir dados do contato do usuário
 * Chamado quando o usuário abre o chat widget
 * Envia apenas dados do contato: login, nome, email, phone
 * 
 * Respostas possíveis do n8n:
 * - "Dados ausentes." - Usuário não autenticado, precisa preencher formulário
 * - "Usuário criado com sucesso." - Novo usuário criado
 * - "Usuário atualizado com sucesso." - Usuário existente atualizado
 * - "Contato não pode ser criado nem atualizado." - Erro ao processar
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { timestamp, source, data } = body;

        // Validar se temos dados da Shopify
        if (!data) {
            return NextResponse.json(
                { success: false, error: 'Dados da Shopify não fornecidos' },
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

        // Parse n8n response
        let n8nData: { message?: string; contact_id?: number } = {};
        try {
            n8nData = await n8nResponse.json();
        } catch {
            console.warn('[PersistContact] Não foi possível parsear resposta do n8n');
        }

        const n8nMessage = n8nData.message || null;
        const contactId = n8nData.contact_id || null;
        console.log('[PersistContact] Resposta do n8n:', { status: n8nResponse.status, message: n8nMessage, contact_id: contactId });

        // Sempre retornamos 200 OK para o frontend, 
        // passando a mensagem do n8n para que o frontend decida o que fazer
        // Isso é importante porque "Dados ausentes" não é um erro técnico,
        // apenas indica que o usuário precisa preencher o formulário

        // Determinar sucesso baseado na mensagem
        // NOTA: "Contato não pode ser criado nem atualizado" = contato JÁ EXISTE, então é SUCESSO!
        const isSuccess = n8nMessage === 'Usuário criado com sucesso.' ||
            n8nMessage === 'Usuário atualizado com sucesso.' ||
            n8nMessage === 'Contato não pode ser criado nem atualizado.' ||
            n8nMessage?.includes('Usuário criado') ||
            n8nMessage?.includes('Usuário atualizado') ||
            n8nMessage?.includes('Contato não pode ser criado nem atualizado');

        const needsData = n8nMessage === 'Dados ausentes.' ||
            n8nMessage?.includes('Dados ausentes');

        // Erro é apenas quando há falha de conexão ou resposta inesperada
        const isError = !isSuccess && !needsData && !n8nResponse.ok;

        return NextResponse.json({
            success: isSuccess,
            needsData: needsData,
            isError: isError,
            message: n8nMessage || (n8nResponse.ok ? 'Dados processados' : 'Erro ao processar'),
            contactId: contactId,
            receivedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('[PersistContact] Erro ao processar dados:', error);
        return NextResponse.json(
            {
                success: false,
                needsData: false,
                isError: true,
                error: 'Erro ao persistir dados do contato',
                message: 'Erro de conexão com o servidor.'
            },
            { status: 500 }
        );
    }
}
