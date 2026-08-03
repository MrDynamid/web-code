"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/smart-image";

export type HeroSlide = {
  id: string;
  image: string | null;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
};

const AUTOPLAY_MS = 6000;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  return (
    <section
      className="relative isolate overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        const end = e.changedTouches[0]?.clientX;
        if (start == null || end == null) return;
        if (Math.abs(end - start) > 45) go(index + (end < start ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <div className="relative h-[68vh] min-h-[440px] w-full bg-muted sm:h-[78vh] lg:h-[86vh]">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <SmartImage
              src={slide.image ?? "/images/hero.jpg"}
              alt={
                slide.subtitle
                  ? `${slide.title} — ${slide.subtitle}`
                  : `${slide.title}, handloom Indian womenswear by MEHR`
              }
              width={1920}
              height={1280}
              fetchPriority={i === 0 ? "high" : "low"}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              sizes="100vw"
              className="h-full w-full object-cover object-[62%_center]"
            />
            <div className="absolute inset-0 bg-gradient-hero" />
          </div>
        ))}

        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div key={slides[index]!.id} className="max-w-xl animate-fade-up">
              <p className="text-eyebrow text-primary">
                {slides[index]!.eyebrow ?? "The Wedding Edit"}
              </p>
              <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
                {slides[index]!.title}
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                {slides[index]!.subtitle ??
                  "Handloom silks, zardozi lehengas and heirloom drapes from India's finest karigars."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="group">
                  <Link href={slides[index]!.cta_href ?? "/shop"}>
                    {slides[index]!.cta_label ?? "Shop the edit"}
                    <ArrowRight
                      width={16}
                      height={16}
                      className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/shop?category=sarees">
                    Explore sarees
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={() => go(index - 1)}
              className="absolute top-1/2 left-2 hidden -translate-y-1/2 rounded-full border border-border/60 bg-background/70 p-2 backdrop-blur transition-colors hover:text-primary sm:block"
            >
              <ChevronLeft width={18} height={18} />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={() => go(index + 1)}
              className="absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-full border border-border/60 bg-background/70 p-2 backdrop-blur transition-colors hover:text-primary sm:block"
            >
              <ChevronRight width={18} height={18} />
            </button>
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => go(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === index ? "w-8 bg-primary" : "w-3 bg-foreground/30 hover:bg-foreground/60"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
