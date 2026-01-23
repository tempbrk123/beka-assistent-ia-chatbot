'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SplitTextProps {
    text: string;
    className?: string;
    delay?: number; // delay before animation starts (ms)
    charDelay?: number; // delay between each character (ms)
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export function SplitText({
    text,
    className = '',
    delay = 0,
    charDelay = 50,
    as: Component = 'span'
}: SplitTextProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <Component className={cn('inline-block', className)}>
            {text.split('').map((char, index) => (
                <span
                    key={index}
                    className={cn(
                        'inline-block transition-all duration-300',
                        isVisible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-4'
                    )}
                    style={{
                        transitionDelay: isVisible ? `${index * charDelay}ms` : '0ms',
                    }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </Component>
    );
}
