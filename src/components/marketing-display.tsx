
'use client';

import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';

const slides = [
  {
    image: 'https://picsum.photos/1200/400?random=1',
    hint: 'business meeting',
    title: 'Effortless GST Invoicing',
    subtitle: 'Create, manage, and send GST-compliant invoices in minutes.'
  },
  {
    image: 'https://picsum.photos/1200/400?random=2',
    hint: 'financial chart',
    title: 'Automated GST Reports',
    subtitle: 'Generate GSTR-1 and GSTR-3B summaries automatically from your data.'
  },
  {
    image: 'https://picsum.photos/1200/400?random=3',
    hint: 'team collaboration',
    title: 'AI-Powered Reconciliation',
    subtitle: 'Reconcile your ITC with GSTR-2B using AI for unmatched accuracy.'
  },
];

export function MarketingDisplay() {
  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={index}>
            <Card className="overflow-hidden">
              <CardContent className="p-0 relative h-64 md:h-80">
                <Image
                  src={slide.image}
                  alt={`Marketing slide ${index + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint={slide.hint}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white shadow-lg">{slide.title}</h2>
                  <p className="text-md md:text-lg text-white/90 mt-2 shadow-md">{slide.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
    </Carousel>
  );
}
