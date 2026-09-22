type FigmaImgProps = {
  src: string;
  width: number;
  height: number;
  className?: string;
  alt?: string;
};

export function FigmaImg({ src, width, height, className, alt = "" }: FigmaImgProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  );
}
