export interface Product {
  title: string;
  price: string;
  image_src: string;
  handle: string;
  link: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | Product[];
  timestamp: number;
  audioUrl?: string; // URL do blog de áudio para exibição na UI
  buttonLabels?: string[]; // Botões de opção quando a IA faz perguntas
  status?: 'sending' | 'sent' | 'delivered' | 'seen'; // Status de entrega da mensagem
}

export interface BekaResponse {
  Beka: string | Product[];
  ButtonLabel?: string[]; // Opções de botão retornadas pela API
}
