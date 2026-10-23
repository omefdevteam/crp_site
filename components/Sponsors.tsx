"use client";

const BLANK_GIF =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// Partners / sponsors band — logos and ticker hidden temporarily; glow stays.
export function Sponsors() {
  return (
    <section
      id="sponsors"
      data-nav-tone="dark"
      className="relative isolate overflow-hidden bg-ink pb-[160px] pt-16 text-white desk:hidden"
      aria-hidden
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[26%] -z-10 w-[620px] max-w-none -translate-x-1/2 desk:top-[143px] desk:w-[1051px]"
      >
        {/*
          The section is desk:hidden, so from the desk breakpoint the <picture>
          resolves to an inline blank GIF and the swirl is never fetched. Below
          it: 1051px AVIF (WebP fallback), lazy so React doesn't preload it.
        */}
        <picture>
          <source media="(min-width: 900px)" srcSet={BLANK_GIF} />
          <source type="image/avif" srcSet="/images/sponsors-swirl-1051.avif" />
          <img
            src="/images/sponsors-swirl-1051.webp"
            alt=""
            width={1051}
            height={1070}
            loading="lazy"
            decoding="async"
            className="h-auto w-full"
          />
        </picture>
      </div>
    </section>
  );
}
