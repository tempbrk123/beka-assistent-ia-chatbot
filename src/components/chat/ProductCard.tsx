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
        <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
                <Image
                    src={product.image_src}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    unoptimized
                />
            </div>
            <CardContent className="px-5 space-y-3">
                <h3 className="font-semibold text-sm line-clamp-2 text-foreground">
                    {product.title}
                </h3>
                <p className="text-lg font-bold text-primary">
                    {product.price}
                </p>
                <Button
                    asChild
                    className="w-full bg-primary h-10 hover:bg-primary/90 text-primary-foreground"
                >
                    <a href={product.link} target="_blank" rel="noopener noreferrer">
                        Ver Produto
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
}
