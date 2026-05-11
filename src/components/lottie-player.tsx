"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

/**
 * Lazy-load lottie-react — the library + lottie-web are ~50KB gzipped.
 * Only loaded when a LottiePlayer actually mounts (IntersectionObserver
 * triggers the fetch below, then this component renders).
 */
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

/**
 * Hook to detect `prefers-reduced-motion: reduce`.
 * Returns true if the user prefers reduced motion.
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

interface LottiePlayerProps {
  /** URL to the Lottie JSON file on Sanity CDN */
  src: string;
  /** Alt text for screen readers */
  altText: string;
  /** Optional caption below the animation */
  caption?: string;
  /** Whether to autoplay (default: true) */
  autoplay?: boolean;
  /** Whether to loop (default: true) */
  loop?: boolean;
}

export function LottiePlayer({
  src,
  altText,
  caption,
  autoplay = true,
  loop = true,
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationData, setAnimationData] = useState<unknown>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // IntersectionObserver — only fetch animation data when in viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // start loading 200px before visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch Lottie JSON when visible
  useEffect(() => {
    if (!isVisible || !src) return;

    let cancelled = false;

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isVisible, src]);

  // Respect prefers-reduced-motion: show first frame only
  const shouldAnimate = !prefersReducedMotion && autoplay;

  return (
    <figure className="my-6" ref={containerRef}>
      <div
        role="img"
        aria-label={altText}
        className="mx-auto max-w-lg rounded-lg overflow-hidden bg-gray-50"
      >
        {error ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            Animation failed to load
          </div>
        ) : animationData ? (
          <Lottie
            animationData={animationData}
            loop={loop}
            autoplay={shouldAnimate}
            aria-hidden="true"
            style={{ width: "100%", height: "auto" }}
          />
        ) : isVisible ? (
          <div className="flex items-center justify-center h-48">
            <div
              className="w-8 h-8 border-2 border-spark-blue border-t-transparent rounded-full animate-spin"
              role="status"
            >
              <span className="sr-only">Loading animation…</span>
            </div>
          </div>
        ) : (
          // Placeholder before intersection — maintains layout space
          <div className="h-48" />
        )}
      </div>
      {caption && (
        <figcaption className="text-sm text-gray-500 mt-2 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
