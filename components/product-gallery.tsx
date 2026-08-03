"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Expand, X, ZoomIn } from "lucide-react";
import { SmartImage, preferredImageSrc } from "@/components/smart-image";
import { cn } from "@/lib/utils";

/** How much the zoom panel magnifies the source image. */
const ZOOM = 2.5;
/** Magnification inside the full-screen lightbox. */
const LIGHTBOX_ZOOM = 2.4;

type Point = { x: number; y: number };

/**
 * Amazon-style product gallery.
 *
 * Desktop (>=1024px): hovering the main image shows a square "lens" following the
 * cursor, and a panel floated to the right renders that region magnified — the
 * same split-view Amazon uses. The panel is absolutely positioned and overlays
 * the page, so it never pushes the buy box around.
 *
 * Touch/small screens: no hover, so tapping opens a full-screen lightbox with
 * tap-to-toggle pan-to-zoom instead.
 */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const gallery = images.length > 0 ? images : ["/images/hero.jpg"];
  const [active, setActive] = useState(0);
  const [zooming, setZooming] = useState(false);
  // Cursor position over the frame, in percent (drives both lens + panel).
  const [pos, setPos] = useState<Point>({ x: 50, y: 50 });
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [lightbox, setLightbox] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(false);
  // Hover-zoom needs room for the panel *and* a real mouse. Width is a media
  // query, but the pointer is decided from the actual pointer that arrives —
  // touch-capable laptops report `hover: none` while still driving a mouse, so
  // trusting the media query alone silently disables zoom for them.
  const [wideEnough, setWideEnough] = useState(false);
  const [hasMouse, setHasMouse] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canHoverZoom = wideEnough && hasMouse;

  const src = gallery[active] ?? gallery[0]!;

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWideEnough(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // Seed the pointer capability from the media query, then let the first real
  // pointer event correct it either way.
  useEffect(() => {
    setHasMouse(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  // Reset zoom state whenever the shopper switches image.
  useEffect(() => {
    setZooming(false);
    setLightboxZoom(false);
  }, [active]);

  useEffect(() => {
    if (!lightbox) setLightboxZoom(false);
  }, [lightbox]);

  const measure = useCallback(() => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (rect) setFrameSize({ width: rect.width, height: rect.height });
  }, []);

  const track = useCallback((event: React.MouseEvent, el: HTMLElement | null) => {
    const node = el ?? (event.currentTarget as HTMLElement);
    const rect = node.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setPos({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  }, []);

  // The lens is the slice of the image the panel is showing, so its size is the
  // panel size divided by the magnification.
  const lensWidthPct = 100 / ZOOM;
  const lensHeightPct = 100 / ZOOM;
  // Clamp so the lens never hangs off the edge of the frame.
  const lensLeftPct = Math.min(100 - lensWidthPct, Math.max(0, pos.x - lensWidthPct / 2));
  const lensTopPct = Math.min(100 - lensHeightPct, Math.max(0, pos.y - lensHeightPct / 2));
  // Convert the clamped lens origin into a background position for the panel.
  const originX = (lensLeftPct / (100 - lensWidthPct || 1)) * 100;
  const originY = (lensTopPct / (100 - lensHeightPct || 1)) * 100;

  const showPanel = canHoverZoom && zooming && frameSize.width > 0;

  return (
    <div className="grid gap-3 sm:grid-cols-[72px_minmax(0,1fr)]">
      {/* Thumbnails */}
      <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible">
        {gallery.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActive(index)}
            onMouseEnter={() => setActive(index)}
            aria-label={`View image ${index + 1}`}
            aria-current={active === index}
            className={cn(
              "shrink-0 overflow-hidden rounded-md border transition-all duration-300",
              active === index
                ? "border-primary ring-1 ring-primary/40"
                : "border-border hover:border-gold",
            )}
          >
            <SmartImage
              src={image}
              alt=""
              width={200}
              height={250}
              loading="lazy"
              decoding="async"
              className="h-20 w-16 object-cover sm:h-[88px] sm:w-[72px]"
            />
          </button>
        ))}
      </div>

      {/* Main image + hover lens */}
      <div className="order-1 sm:order-2">
        {/* `relative` anchors the floating zoom panel; it must not clip it. */}
        <div className="relative">
          <div
            ref={frameRef}
            onPointerEnter={(event) => {
              // `pointerType` is the ground truth: "mouse" means the lens/panel
              // split view is usable, "touch"/"pen" means fall back to the
              // tap-to-open lightbox.
              setHasMouse(event.pointerType === "mouse");
            }}
            onMouseEnter={() => {
              measure();
              setZooming(true);
            }}
            onMouseLeave={() => setZooming(false)}
            onMouseMove={(event) => track(event, frameRef.current)}
            onClick={() => setLightbox(true)}
            className={cn(
              "group relative aspect-[4/5] overflow-hidden rounded-lg bg-secondary",
              canHoverZoom ? "cursor-crosshair" : "cursor-zoom-in",
            )}
          >
            <SmartImage
              key={active}
              src={src}
              alt={name}
              width={1024}
              height={1280}
              fetchPriority="high"
              decoding="async"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-full w-full animate-fade-in object-cover"
            />

            {/* Lens: shows exactly which region the panel is magnifying. */}
            {showPanel ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute border border-gold/70 bg-background/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]"
                style={{
                  width: `${lensWidthPct}%`,
                  height: `${lensHeightPct}%`,
                  left: `${lensLeftPct}%`,
                  top: `${lensTopPct}%`,
                }}
              />
            ) : null}

            {/* Zoom hint — hidden while the panel is open */}
            <span
              className={cn(
                "pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-[11px] text-foreground backdrop-blur transition-opacity duration-300",
                zooming ? "opacity-0" : "opacity-100",
              )}
            >
              <ZoomIn width={13} height={13} strokeWidth={1.6} />
              {canHoverZoom ? "Hover to zoom" : "Tap to enlarge"}
            </span>

            <button
              type="button"
              aria-label="Open full-screen view"
              onClick={(event) => {
                event.stopPropagation();
                setLightbox(true);
              }}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/85 text-foreground backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Expand width={15} height={15} strokeWidth={1.6} />
            </button>
          </div>

          {/* Magnified panel, floated to the right of the frame like Amazon. */}
          {showPanel ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-[calc(100%+1rem)] top-0 z-40 hidden overflow-hidden rounded-lg border border-border bg-background shadow-[var(--shadow-lift)] lg:block"
              style={{
                width: frameSize.width,
                height: frameSize.height,
                backgroundImage: `url(${preferredImageSrc(src)})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${ZOOM * 100}% ${ZOOM * 100}%`,
                backgroundPosition: `${originX}% ${originY}%`,
              }}
            />
          ) : null}
        </div>
      </div>

      {/* Full-screen lightbox */}
      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} enlarged image`}
          onClick={() => setLightbox(false)}
          className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center bg-ink/90 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/90 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <X width={18} height={18} />
          </button>
          <div
            onClick={(event) => {
              event.stopPropagation();
              // Tap toggles zoom so touch users get magnification too.
              setLightboxZoom((on) => !on);
            }}
            onMouseMove={(event) => {
              if (lightboxZoom) track(event, event.currentTarget);
            }}
            className={cn(
              "max-h-[88vh] max-w-3xl overflow-hidden rounded-lg",
              lightboxZoom ? "cursor-zoom-out" : "cursor-zoom-in",
            )}
          >
            <SmartImage
              src={src}
              alt={name}
              decoding="async"
              style={
                lightboxZoom
                  ? {
                      transform: `scale(${LIGHTBOX_ZOOM})`,
                      transformOrigin: `${pos.x}% ${pos.y}%`,
                    }
                  : undefined
              }
              className="max-h-[88vh] w-auto object-contain transition-transform duration-300 ease-out"
            />
          </div>

          <span className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2 rounded-full bg-background/85 px-3 py-1 text-[11px] text-foreground backdrop-blur">
            {lightboxZoom ? "Move to pan · tap to zoom out" : "Tap image to zoom"}
          </span>

          {gallery.length > 1 ? (
            <div className="absolute inset-x-0 bottom-5 flex justify-center gap-2">
              {gallery.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  aria-label={`Show image ${index + 1}`}
                  aria-current={active === index}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActive(index);
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    active === index ? "w-8 bg-primary" : "w-3 bg-background/50",
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
