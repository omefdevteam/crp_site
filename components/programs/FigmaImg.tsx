import Image from "next/image";

type FigmaImgProps = {
  src: string;
  width: number;
  height: number;
  className?: string;
  alt?: string;
  /**
   * Above-the-fold image: load eagerly with high fetch priority (and let
   * React/Next preload it). Everything else lazy-loads near the viewport.
   */
  priority?: boolean;
  /** Responsive `sizes` hint; omit for fixed-size art (1x/2x srcset from `width`). */
  sizes?: string;
};

/**
 * Figma-exported art for /programs. Raster photos go through next/image
 * (AVIF/WebP, srcset sized to the slot) instead of the 1024–1280px PNG
 * masters; SVG icons stay plain <img> since there is nothing to optimise.
 * Either way the rendered element keeps the same width/height/className, so
 * layout is unchanged.
 */
export function FigmaImg({
  src,
  width,
  height,
  className,
  alt = "",
  priority = false,
  sizes,
}: FigmaImgProps) {
  if (src.endsWith(".svg")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={Math.round(width)}
      height={Math.round(height)}
      className={className}
      sizes={sizes}
      preload={priority}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
