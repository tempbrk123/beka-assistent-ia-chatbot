'use client';

import { Product } from '@/types/chat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    return (
        <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 max-w-[220px] mx-auto group">
            <div className="relative aspect-square w-full overflow-hidden bg-transparent">
                <Image
                    src={product.image_src}
                    alt={product.title}
                    fill
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 400px) 100vw, 220px"
                    unoptimized
                />
            </div>
            <CardContent className="px-3 space-y-2">
                <h3 className="font-semibold text-xs line-clamp-2 text-foreground h-8 leading-tight">
                    {product.title}
                </h3>
                <p className="text-sm font-bold text-primary">
                    {product.price}
                </p>
                <Button
                    asChild
                    className="w-full bg-primary h-8 text-xs hover:bg-primary/90 text-primary-foreground shadow-sm"
                >
                    <a href={product.link} target="_blank" rel="noopener noreferrer">
                        Ver Produto
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
}
