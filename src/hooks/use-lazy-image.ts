// src/hooks/use-lazy-image.ts
import { useEffect, useRef, useState } from "react";

interface UseLazyImageProps {
  src: string;
  placeholder?: string;
  threshold?: number;
}

/**
 * Hook for lazy loading images using Intersection Observer
 * Returns { isLoaded, imgRef, imageSrc } for use in img tags
 */
export function useLazyImage({
  src,
  placeholder = "",
  threshold = 0.1,
}: UseLazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, threshold]);

  return {
    imgRef,
    imageSrc,
    isLoaded,
    onLoad: () => setIsLoaded(true),
  };
}
