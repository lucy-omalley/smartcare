"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type MarketingImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  floating?: boolean;
  sizes?: string;
};

/** Lazy-loaded marketing image with optional subtle float animation. */
export function MarketingImage({
  src,
  alt,
  priority = false,
  className,
  imageClassName,
  floating = false,
  sizes = "(max-width: 1024px) 100vw, 50vw",
}: MarketingImageProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-visible",
        floating && "landing-float",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={1536}
        height={1024}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes={sizes}
        className={cn(
          "w-full h-auto object-contain drop-shadow-2xl rounded-2xl",
          imageClassName
        )}
      />
    </div>
  );
}
