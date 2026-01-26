'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Mic, MicOff, SendHorizontal } from 'lucide-react';

declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

interface ChatInputProps {
    onSend: (message: string, audioBlob?: Blob) => void;
    isLoading: boolean;
    disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'pt-BR';

                recognition.onresult = (event: any) => {
                    let transcript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        if (event.results[i].isFinal) {
                            transcript += event.results[i][0].transcript + ' ';
                        }
                    }
                    if (transcript) {
                        setInput((prev) => prev + transcript);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    stopRecording();
                };

                recognition.onend = () => {
                    if (isListening) {
                        stopRecording();
                    }
                };

                recognitionRef.current = recognition;
            }
        }
    }, []); // Removed isListening dependency to avoid re-binding loops

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Start Media Recorder
            const mediaRecorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;

            // Start Speech Recognition
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    console.error("Recognition start error", e);
                }
            }

            setIsListening(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Não foi possível acessar o microfone. Verifique as permissões.');
        }
    };

    const stopRecording = (): Promise<void> => {
        return new Promise((resolve) => {
            setIsListening(false);

            // Stop Speech Recognition
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore if already stopped
                }
            }

            // Stop Media Recorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.onstop = () => {
                    // Ensure stream tracks are stopped
                    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
                    resolve();
                };
                mediaRecorderRef.current.stop();
            } else {
                resolve();
            }
        });
    };

    const toggleListening = () => {
        if (isListening) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleSend = async () => {
        if (isListening) {
            await stopRecording();
        }

        const trimmedInput = input.trim();

        let audioBlob: Blob | undefined;
        if (audioChunksRef.current.length > 0) {
            audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            audioChunksRef.current = [];
        }

        // Allow sending if there is text OR audio
        if ((trimmedInput || audioBlob) && !isLoading && !disabled) {
            onSend(trimmedInput, audioBlob);
            setInput('');
            // audioChunksRef cleared above
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-2 md:p-4 w-full flex justify-center">
            <div className="w-full max-w-4xl bg-surface-white/90 backdrop-blur-md shadow-2xl rounded-[24px] md:rounded-[32px] p-1.5 md:p-2 flex items-end gap-2 border border-white/50 relative overflow-hidden">

                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "Ouvindo..." : "Digite sua mensagem..."}
                    disabled={isLoading || disabled}
                    className={`min-h-[44px] md:min-h-[52px] max-h-[150px] md:max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 text-text-primary placeholder:text-text-secondary/50 text-sm md:text-base py-3 px-3 md:py-3.5 md:px-4 flex-1 rounded-[20px] md:rounded-[24px] ${isListening ? 'animate-pulse bg-red-50/50' : ''}`}
                    rows={1}
                />

                <Button
                    onClick={toggleListening}
                    disabled={isLoading || disabled}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 md:h-12 md:w-12 rounded-full shrink-0 transition-all duration-300 hover:bg-surface-ground mb-0.5 ${isListening ? 'text-red-500 hover:text-red-600 bg-red-50' : 'text-text-secondary hover:text-primary'}`}
                >
                    {isListening ? (
                        <MicOff className="h-5 w-5 md:h-6 md:w-6" />
                    ) : (
                        <Mic className="h-5 w-5 md:h-6 md:w-6" />
                    )}
                </Button>

                <Button
                    onClick={handleSend}
                    disabled={(!input.trim() && audioChunksRef.current.length === 0 && !isListening) || isLoading || disabled}
                    size="icon"
                    className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary text-white hover:bg-[#30800a] cursor-pointer shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md mb-0.5 mr-0.5"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                    ) : (
                        <SendHorizontal className="h-7 w-7 md:h-8 md:w-8" strokeWidth={2.5} />
                    )}
                    <span className="sr-only">Enviar mensagem</span>
                </Button>
            </div>
        </div>
    );
}
