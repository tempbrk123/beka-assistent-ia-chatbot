'use client';

import { useRef, useState, useCallback, MouseEvent, useEffect } from 'react';
import { Message, Product } from '@/types/chat';
import { ProductCard } from './ProductCard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Pencil, Check, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
    message: Message;
    onButtonClick?: (label: string) => void;
    onEdit?: (id: string, newContent: string) => void;
}

export function ChatMessage({ message, onButtonClick, onEdit }: ChatMessageProps) {
    const isUser = message.role === 'user';
    const isProductResponse = Array.isArray(message.content);
    const hasButtonLabels = message.buttonLabels && message.buttonLabels.length > 0;

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        if (typeof message.content === 'string') {
            setEditContent(message.content);
        }
    }, [message.content]);

    const handleSaveEdit = () => {
        if (editContent.trim() !== '' && onEdit) {
            onEdit(message.id, editContent);
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (typeof message.content === 'string') {
            setEditContent(message.content);
        }
    };

    // Drag to scroll
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5; // Scroll speed
        scrollRef.current.scrollLeft = scrollLeft - walk;
    }, [isDragging, startX, scrollLeft]);

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    return (
        <div
            className={cn(
                'flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 group',
                isUser ? 'justify-end' : 'justify-start'
            )}
        >
            {isUser ? (
                <div className="flex flex-col items-end gap-1 max-w-[85%] md:max-w-[75%]">
                    {isEditing ? (
                        <div className="w-full bg-surface-white rounded-[24px] p-2 md:p-3 border border-primary/20 shadow-lg animate-in fade-in zoom-in-95 duration-200">
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[80px] bg-transparent border-0 focus-visible:ring-0 resize-none text-text-primary text-sm md:text-base mb-2"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCancelEdit}
                                    className="h-8 w-8 p-0 rounded-full hover:bg-neutral-100 text-text-secondary"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    className="h-8 w-8 p-0 rounded-full bg-primary text-white hover:bg-primary/90"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative group/message">
                            <div className="rounded-[24px] rounded-br-sm px-6 py-3.5 bg-surface-white text-text-primary shadow-sm border border-white/40">
                                {message.audioUrl ? (
                                    <div className="w-full min-w-[200px]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <audio controls src={message.audioUrl} className="w-full h-10 accent-primary" />
                                        </div>
                                        <details className="text-xs text-text-secondary/70 mt-1">
                                            <summary className="cursor-pointer hover:text-primary transition-colors select-none">Ver transcrição</summary>
                                            <p className="mt-1 italic pl-2 border-l-2 border-primary/20">{message.content as string}</p>
                                        </details>
                                    </div>
                                ) : (
                                    <p className="text-sm md:text-base whitespace-pre-wrap font-medium leading-relaxed">{message.content as string}</p>
                                )}
                            </div>

                            {/* Edit Button - Visible on hover */}
                            {!message.audioUrl && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-surface-white/80 text-text-secondary opacity-0 group-hover/message:opacity-100 transition-all hover:text-primary hover:bg-white shadow-sm border border-white/40 backdrop-blur-sm"
                                    title="Editar mensagem"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : isProductResponse ? (
                <div className="w-full space-y-4">
                    <p className="text-sm md:text-base text-text-secondary px-4 font-medium">
                        Encontrei alguns produtos que podem te interessar:
                    </p>
                    <div
                        ref={scrollRef}
                        className={cn(
                            "flex gap-4 overflow-x-auto pb-4 px-4 cursor-grab select-none scrollbar-hide",
                            isDragging && "cursor-grabbing"
                        )}
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                    >
                        {(message.content as Product[]).map((product, index) => (
                            <div
                                key={`${product.handle}-${index}`}
                                className="shrink-0 w-[200px] md:w-[240px] transform transition-transform hover:scale-[1.02]"
                                onDragStart={(e) => e.preventDefault()}
                            >
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="w-full flex justify-start"> {/* Container to ensure left alignment */}
                    <div className="max-w-[90%] md:max-w-[65%] space-y-2"> {/* Reduced max-width */}
                        <div className="rounded-[20px] rounded-bl-[4px] px-5 py-4 bg-surface-white/60 backdrop-blur-xl text-text-primary border border-white/40 shadow-sm flex flex-col gap-3"> {/* Increased blur, adjusted border/radius */}

                            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 text-text-primary leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {typeof message.content === 'string'
                                        ? message.content
                                        : JSON.stringify(message.content)}
                                </ReactMarkdown>
                            </div>

                            {/* Button Labels - More integrated look */}
                            {hasButtonLabels && (
                                <div className="flex flex-wrap gap-2 pt-1 mt-1"> {/* Removed top border for cleaner look */}
                                    {message.buttonLabels!.map((label, index) => (
                                        <button
                                            key={`${label}-${index}`}
                                            onClick={() => onButtonClick?.(label)}
                                            className="px-3.5 py-2 rounded-[16px] bg-white/70 hover:bg-primary hover:text-white text-xs md:text-sm font-medium text-text-primary 
                                                     transition-all duration-200
                                                     border border-white/50 hover:border-transparent 
                                                     shadow-sm hover:shadow-md active:scale-95 text-left"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
