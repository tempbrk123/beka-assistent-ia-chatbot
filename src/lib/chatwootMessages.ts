/**
 * Store global para mensagens do Chatwoot
 * Armazena mensagens recebidas via webhook organizadas por contact_id
 */

export interface ChatwootMessage {
    id: string;
    content: string;
    sender_name: string;
    sender_type: 'user' | 'contact'; // user = agente, contact = cliente
    timestamp: number;
    contact_id: number;
}

type MessageListener = (message: ChatwootMessage) => void;

class ChatwootMessageStore {
    private messages: Map<number, ChatwootMessage[]> = new Map();
    private listeners: Map<number, Set<MessageListener>> = new Map();

    /**
     * Adiciona uma mensagem ao store e notifica listeners
     */
    addMessage(message: ChatwootMessage): void {
        const contactId = message.contact_id;

        if (!this.messages.has(contactId)) {
            this.messages.set(contactId, []);
        }

        const messages = this.messages.get(contactId)!;

        // Evita duplicatas
        if (messages.some(m => m.id === message.id)) {
            return;
        }

        messages.push(message);

        // Notifica listeners para este contact_id
        const listeners = this.listeners.get(contactId);
        if (listeners) {
            listeners.forEach(listener => listener(message));
        }

        console.log(`[ChatwootStore] Mensagem adicionada para contact_id ${contactId}:`, message.content);
    }

    /**
     * Retorna todas as mensagens de um contact_id
     */
    getMessages(contactId: number): ChatwootMessage[] {
        return this.messages.get(contactId) || [];
    }

    /**
     * Limpa mensagens de um contact_id
     */
    clearMessages(contactId: number): void {
        this.messages.delete(contactId);
    }

    /**
     * Registra um listener para novas mensagens de um contact_id
     */
    subscribe(contactId: number, listener: MessageListener): () => void {
        if (!this.listeners.has(contactId)) {
            this.listeners.set(contactId, new Set());
        }

        this.listeners.get(contactId)!.add(listener);

        // Retorna função para cancelar inscrição
        return () => {
            const listeners = this.listeners.get(contactId);
            if (listeners) {
                listeners.delete(listener);
                if (listeners.size === 0) {
                    this.listeners.delete(contactId);
                }
            }
        };
    }

    /**
     * Retorna número de mensagens pendentes
     */
    getPendingCount(contactId: number): number {
        return this.messages.get(contactId)?.length || 0;
    }
}

// Instância singleton
export const chatwootStore = new ChatwootMessageStore();
