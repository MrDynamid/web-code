"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
};

// useLayoutEffect on the client (so we can hide below-the-fold nodes before the
// first paint), useEffect on the server to avoid the React SSR warning.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Reveals children as they scroll into view.
 *
 * Content renders VISIBLE by default, so server-rendered / above-the-fold
 * markup is never hidden behind an unhydrated `opacity: 0` (which used to make
 * whole pages flash blank on load). Only elements that are actually below the
 * fold on mount get "armed" — hidden before paint, then animated in when they
 * scroll into view. Reduced-motion users and no-IntersectionObserver browsers
 * always see the content immediately.
 */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(true);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (typeof IntersectionObserver === "undefined" || prefersReducedMotion) {
      return; // keep content visible, no animation
    }

    // Anything already within (or just below) the initial viewport stays
    // visible with no entrance animation — avoids a blank first paint.
    const rect = node.getBoundingClientRect();
    const belowFold = rect.top > window.innerHeight * 0.9;
    if (!belowFold) return;

    // Arm the reveal: hide now (pre-paint), then fade+rise in on scroll.
    setShown(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("reveal", shown && "reveal-in", className)}
    >
      {children}
    </Tag>
  );
}
