"use client";

import { forwardRef, type ImgHTMLAttributes } from "react";

/**
 * Returns the pre-generated WebP twin for a local raster asset, or null when
 * there's no optimized version to serve (remote URLs, SVGs, blob URLs, etc.).
 * Every file under /public/images has a matching .webp built at deploy time.
 */
function toWebp(src: string): string | null {
  if (/^\/images\/.+\.(png|jpe?g)$/i.test(src)) {
    return src.replace(/\.(png|jpe?g)$/i, ".webp");
  }
  return null;
}

/**
 * Best available source for a raster asset — the WebP twin when one exists,
 * otherwise the original. Use for CSS `background-image`, where <picture>
 * negotiation isn't available.
 */
export function preferredImageSrc(src: string): string {
  return toWebp(src) ?? src;
}

type SmartImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
};

/**
 * Drop-in replacement for <img> that serves a lightweight WebP to browsers that
 * support it and falls back to the original file otherwise. The <picture> uses
 * `display: contents` so it never changes layout — the inner <img> keeps behaving
 * exactly like a direct child (object-cover, h-full, refs and onLoad all work).
 */
export const SmartImage = forwardRef<HTMLImageElement, SmartImageProps>(
  function SmartImage({ src, ...props }, ref) {
    const webp = toWebp(src);
    return (
      <picture className="contents">
        {webp ? <source srcSet={webp} type="image/webp" /> : null}
        <img ref={ref} src={src} {...props} />
      </picture>
    );
  },
);
